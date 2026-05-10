from .serializers import (
    UserRegistrationSerializer, 
    MechanicRegistrationSerializer, 
    WorkshopRegistrationSerializer,
    VerifyOTPSerializer, 
    ResendOTPSerializer, 
    CustomTokenObtainPairSerializer, 
    UserRoleSerializer, 
    ForgotPasswordResetSerializer, 
    ForgotPasswordVerifyOtpSerializer, 
    ForgotPasswordSendOtpSerializer, 
    ProfileUpdateSerializer, 
    ChangePasswordSerializer,    
    CookieTokenRefreshSerializer,
    WorkshopSearchSerializer,
    MechanicRequestSerializer
)
from django.db.models import Q, Sum, F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import EmailOTP,PendingUser,User,Workshop,Mechanic
from .utils import send_otp_mail, send_password_reset_otp
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from google.oauth2 import id_token
from google.auth.transport import requests
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework import serializers
from django.db import transaction
from service_request.models import MechanicEarning, ServiceExecution
from payments.models import Wallet,WalletTransaction
import logging

logger = logging.getLogger(__name__)


class BaseRegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = None 

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        
        try:
            if serializer.is_valid():
                try:
                    pending_user = serializer.save()
                    logger.info(f"User registration successful: {pending_user.email}")

                    return Response(
                        {
                            'message': 'Registration successful. Please check your email for the OTP verification.',
                            'email': pending_user.email,
                            'role': pending_user.role
                        },
                        status=status.HTTP_201_CREATED
                    )
                
                except Exception as e:
                    logger.exception("Exception occurred during user registration")
                    error_message = str(e) if str(e) else "An unexpected error occurred during registration. Please try again."
                    return Response(
                        {'error': error_message},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            logger.warning(f"Registration validation errors: {serializer.errors}")
            errors = serializer.errors
            if isinstance(errors, dict):
                first_field = next(iter(errors.keys()))
                first_error = errors[first_field]
                
                if isinstance(first_error, list) and len(first_error) > 0:
                    raw_msg = first_error[0]
                else:
                    raw_msg = str(first_error)

                if first_field == 'non_field_errors':
                    error_message = raw_msg
                else:
                    readable_field = first_field.replace('_', ' ').title()
                    error_message = f"{readable_field}: {raw_msg}"
                
                return Response(
                    {'error': error_message, 'details': errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response(
                {'error': 'Invalid registration data. Please check your inputs.', 'details': errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            logger.exception("Unexpected error in BaseRegisterView POST method")
            return Response(
                {'error': 'An unexpected server error occurred. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class UserRegisterView(BaseRegisterView):
    serializer_class = UserRegistrationSerializer

class MechanicRegisterView(BaseRegisterView):
    serializer_class = MechanicRegistrationSerializer

class WorkshopRegisterView(BaseRegisterView):
    serializer_class = WorkshopRegistrationSerializer

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as e:
            error_detail = e.detail
            if isinstance(error_detail, dict):
                first_error = next(iter(error_detail.values()))
                if isinstance(first_error, list):
                    error_message = first_error[0]
                else:
                    error_message = str(first_error)
            else:
                error_message = str(error_detail)
            logger.warning(f"OTP verification validation error: {error_message}")
            return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        role = serializer.validated_data['role']

        try:
            with transaction.atomic():
                try:
                    otp_record = EmailOTP.objects.get(
                        email=email,
                        is_verified=False,
                        purpose='registration'
                    )
                except EmailOTP.DoesNotExist:
                    logger.warning(f"No OTP found for email: {email}")
                    return Response(
                        {'error': 'No OTP found for this email. Please request a new OTP or register again.'},
                        status=status.HTTP_404_NOT_FOUND
                    )

                try:
                    pending_user = PendingUser.objects.get(email=email)
                except PendingUser.DoesNotExist:
                    logger.warning(f"Pending user not found for email: {email}")
                    return Response(
                        {'error': 'Registration session expired. Please register again.'},
                        status=status.HTTP_404_NOT_FOUND
                    )

                if pending_user.role != role:
                    logger.warning(f"Role mismatch for email {email}: expected {pending_user.role}, got {role}")
                    return Response(
                        {'error': f'Role mismatch. Please verify you selected the correct role: {pending_user.role}.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if otp_record.is_expired():
                    logger.info(f"OTP expired for email: {email}")
                    return Response(
                        {'error': 'OTP has expired. Please request a new OTP.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if otp_record.otp != otp:
                    logger.info(f"Invalid OTP attempt for email: {email}")
                    return Response(
                        {'error': 'Invalid OTP. Please check the code and try again.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Mark OTP as verified
                otp_record.is_verified = True
                otp_record.save()
                logger.info(f"OTP verified for email: {email}")

                # Create user
                user = User.objects.create_user(
                    email=pending_user.email,
                    full_name=pending_user.full_name,
                    role=pending_user.role,
                    password=pending_user.password,
                    is_active=True
                )
                logger.info(f"User account created for email: {email}")

                # Role-specific profile creation
                if user.role == 'workshop_admin':
                    Workshop.objects.create(
                        user=user,
                        workshop_name=pending_user.workshop_name,
                        license_number=pending_user.license_number,
                        address_line=pending_user.address_line,
                        locality=pending_user.locality,
                        city=pending_user.city,
                        state=pending_user.state,
                        pincode=pending_user.pincode,
                        contact_number=pending_user.contact_number,
                        type=pending_user.type,
                        latitude=pending_user.latitude,
                        longitude=pending_user.longitude
                    )
                    logger.info(f"Workshop profile created for user: {email}")

                elif user.role == 'mechanic':
                    Mechanic.objects.create(
                        user=user,
                        contact_number=pending_user.contact_number
                    )
                    logger.info(f"Mechanic profile created for user: {email}")

                # Clean up
                pending_user.delete()
                otp_record.delete()
                logger.info(f"Pending user and OTP record deleted for email: {email}")

                return Response(
                    {'message': 'Account created successfully. Please login to continue.'},
                    status=status.HTTP_201_CREATED
                )

        except Exception as e:
            logger.exception(f"OTP verification failed for email: {email}")
            return Response(
                {'error': f'Account creation failed: {str(e)}. Please try again or contact support.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as e:
            error_detail = e.detail
            if isinstance(error_detail, dict):
                first_error = next(iter(error_detail.values()))
                if isinstance(first_error, list):
                    error_message = first_error[0]
                else:
                    error_message = str(first_error)
            else:
                error_message = str(error_detail)
            logger.warning(f"Resend OTP validation error: {error_message}")
            return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        role = serializer.validated_data['role']

        try:
            pending_user = PendingUser.objects.get(email=email, role=role)
            logger.info(f"Found pending user for Resend OTP: {email}, role: {role}")

            otp_record, status_ok, message = send_otp_mail(
                email=pending_user.email,
                full_name=pending_user.full_name,
                role=pending_user.role
            )

            if status_ok:
                logger.info(f"OTP resent successfully to {email}")
                return Response({"message": message}, status=status.HTTP_200_OK)
            else:
                logger.warning(f"Failed to resend OTP to {email}: {message}")
                return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

        except PendingUser.DoesNotExist:
            logger.warning(f"No pending user found for email: {email}, role: {role}")
            return Response(
                {'error': 'No pending registration found for this email and role. Please register first.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.exception(f"Unexpected error while resending OTP for email: {email}")
            return Response({'error': 'Failed to resend OTP. Please try again later.'}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '')
        password = request.data.get('password', '')

        try:
            user = User.objects.get(email=email)
            if not user.is_active:
                logger.warning(f"Blocked login attempt for email: {email}")
                return Response(
                    {'error': 'Your account has been blocked. Please contact support.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except User.DoesNotExist:
            logger.info(f"Login attempt with non-existent email: {email}")
            return Response(
                {'error': 'No account found with this email address. Please register.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not user.check_password(password):
            logger.info(f"Incorrect password attempt for email: {email}")
            return Response(
                {'error': 'Incorrect password. Please try again or reset your password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        serializer = self.serializer_class(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as e:
            error_detail = e.detail
            if isinstance(error_detail, dict):
                first_error = next(iter(error_detail.values()))
                if isinstance(first_error, list):
                    error_message = first_error[0]
                else:
                    error_message = str(first_error)
            else:
                error_message = str(error_detail)
            logger.warning(f"Login validation error for email {email}: {error_message}")
            return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Unexpected login error for email: {email}")
            return Response(
                {'error': 'An unexpected error occurred. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        data = serializer.validated_data

        response_data = {
            'user_id': user.id,
            'access': data['access'],
            'full_name': data['full_name'],
            'role': data['role'],
            'email': data['email']
        }

        if 'workshop_status' in data:
            response_data['workshop_status'] = data['workshop_status']

        response = Response(response_data, status=status.HTTP_200_OK)

        response.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=data['refresh'],
            expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            path='/'
        )

        logger.info(f"User logged in successfully: {email}")

        return response
    
    
class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({'detail': 'Successfully logged out'}, status=status.HTTP_200_OK)

        response.delete_cookie('refreshtoken')

        refresh_token = request.COOKIES.get('refreshtoken')
        if not refresh_token:
            logger.info("Logout attempted but no refresh token cookie was present.")
            return Response(
                {'detail': 'No refresh token cookie was present. Logged out locally.'},
                status=status.HTTP_200_OK
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info("Refresh token blacklisted successfully during logout.")
            return response

        except TokenError:
            logger.warning("Invalid or expired refresh token during logout.")
            return Response({'error': 'Invalid token or token expired'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception("Unexpected error during logout.")
            response.data = {'error': 'An unexpected server error occurred during logout.'}
            response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            return response


class CookieTokenRefeshView(TokenRefreshView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = CookieTokenRefreshSerializer


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        id_token_str = request.data.get("id_token")

        if not id_token_str:
            return Response({"error": "ID token missing"}, status=400)

        try:
            idinfo = id_token.verify_oauth2_token(
                id_token_str,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            email = idinfo.get("email")
            full_name = idinfo.get("name")

            if not email:
                return Response({"error": "Email not returned by Google"}, status=400)

            user, created = User.objects.get_or_create(
                email=email,
                defaults={"full_name": full_name, "role": "user"}
            )

            refresh = RefreshToken.for_user(user)

            response = Response(
                {
                    "access": str(refresh.access_token),
                    "user": UserRoleSerializer(user).data
                },
                status=200
            )

            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=str(refresh),
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                path='/'
            )

            return response

        except Exception as e:
            return Response({"error": str(e)}, status=400)

        

class ForgotPasswordSendOtpView(APIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordSendOtpSerializer

    def post(self, request):
        try:
            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)
            email = serializer.validated_data['email']
            logger.info(f"Password reset OTP request for email: {email}")

            otp_record, success, message = send_password_reset_otp(email)

            if success:
                logger.info(f"Password reset OTP sent successfully to: {email}")
                return Response({"detail": message}, status=status.HTTP_200_OK)
            else:
                if message.startswith("User with this email"):
                    # Avoid leaking user existence information
                    logger.info(f"Password reset OTP requested for unregistered email: {email}")
                    return Response(
                        {"detail": "If the email is registered, an OTP has been sent."}, 
                        status=status.HTTP_200_OK
                    )
                logger.warning(f"Failed to send password reset OTP for {email}: {message}")
                return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

        except serializers.ValidationError as e:
            error_detail = e.detail
            if isinstance(error_detail, dict):
                first_error = next(iter(error_detail.values()))
                if isinstance(first_error, list):
                    error_message = first_error[0]
                else:
                    error_message = str(first_error)
            else:
                error_message = str(error_detail)
            logger.warning(f"Password reset OTP validation error: {error_message}")
            return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception("Unexpected error during password reset OTP request.")
            return Response(
                {'error': 'An unexpected server error occurred. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class ForgotPasswordVerifyOtpView(APIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordVerifyOtpSerializer

    def post(self, request):
        try:
            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            logger.info(f"Password reset OTP verification attempt for email: {email}")

            try:
                otp_record = EmailOTP.objects.get(email=email, purpose='forgot_password')
            except EmailOTP.DoesNotExist:
                logger.warning(f"OTP verification failed: no record for email {email}")
                return Response(
                    {"detail": "Invalid email or OTP."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if otp_record.is_expired():
                logger.info(f"OTP expired for email: {email}")
                return Response(
                    {"detail": "OTP has expired. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if otp_record.otp != otp:
                logger.info(f"Incorrect OTP attempt for email: {email}")
                return Response(
                    {"detail": "Invalid OTP."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            otp_record.is_verified = True
            otp_record.save()
            logger.info(f"OTP verified successfully for email: {email}")

            return Response(
                {"detail": "OTP verified successfully. You can now reset your password."},
                status=status.HTTP_200_OK
            )

        except serializers.ValidationError as e:
            error_detail = e.detail
            if isinstance(error_detail, dict):
                first_error = next(iter(error_detail.values()))
                if isinstance(first_error, list):
                    error_message = first_error[0]
                else:
                    error_message = str(first_error)
            else:
                error_message = str(error_detail)
            logger.warning(f"Password reset OTP validation error: {error_message}")
            return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception(f"Unexpected error during OTP verification for email: {email}")
            return Response(
                {'error': 'An unexpected server error occurred. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class ForgotPasswordResetView(APIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordResetSerializer

    def post(self, request):
        try:
            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)
            email = serializer.validated_data['email']
            new_password = serializer.validated_data['new_password']
            logger.info(f"Password reset attempt for email: {email}")

            # Verify OTP record exists
            try:
                otp_record = EmailOTP.objects.get(email=email, purpose='forgot_password')
            except EmailOTP.DoesNotExist:
                logger.warning(f"Password reset failed: no OTP record for email {email}")
                return Response(
                    {"detail": "Password reset flow not initiated or token expired."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Ensure OTP was verified
            if not otp_record.is_verified:
                logger.warning(f"Password reset failed: OTP not verified for email {email}")
                return Response(
                    {"detail": "OTP must be verified before resetting the password."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Ensure user exists
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                logger.warning(f"Password reset failed: user not found for email {email}")
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            # Validate new password
            try:
                validate_password(new_password, user=user)
            except DjangoValidationError as e:
                logger.info(f"Password validation failed for email {email}: {e.messages}")
                return Response({"detail": e.messages}, status=status.HTTP_400_BAD_REQUEST)

            # Reset password
            user.set_password(new_password)
            user.save()
            logger.info(f"Password reset successfully for email: {email}")

            # Clean up OTP
            otp_record.delete()

            return Response(
                {"detail": "Password reset successfully. Please log in with your new password."},
                status=status.HTTP_200_OK
            )

        except serializers.ValidationError as e:
            error_detail = e.detail
            if isinstance(error_detail, dict):
                first_error = next(iter(error_detail.values()))
                if isinstance(first_error, list):
                    error_message = first_error[0]
                else:
                    error_message = str(first_error)
            else:
                error_message = str(error_detail)
            logger.warning(f"Password reset validation error: {error_message}")
            return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception(f"Unexpected error during password reset for email: {email}")
            return Response(
                {'error': 'An unexpected server error occurred. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            role_data = None

            try:
                if user.role == "mechanic":
                    role_data = {
                        "contact_number": user.mechanic.contact_number,
                        "availability": user.mechanic.availability
                    }
                elif user.role == "workshop_admin":
                    workshop = user.workshop
                    role_data = {
                        "contact_number": workshop.contact_number,
                        "workshop_name": workshop.workshop_name,
                        "city": workshop.city,
                        "locality": workshop.locality,
                        "pincode": workshop.pincode,
                        "address_line": workshop.address_line,
                        "state": workshop.state,
                        "type": workshop.type,
                        "verification_status": workshop.verification_status,
                        "license_number": workshop.license_number
                    }
            except Exception as e:
                logger.warning(f"Failed to fetch role-specific data for user {user.id}: {e}")
                role_data = None

            data = {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "profile_picture": user.profile_picture.url if user.profile_picture else None,
                "role_details": role_data,
                "memberSince": user.date_joined
            }

            return Response(data)

        except Exception as e:
            logger.exception(f"Unexpected error fetching profile for user {request.user.id}")
            return Response(
                {'error': 'An unexpected error occurred while fetching profile.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request):
        try:
            user = request.user
            serializer = ProfileUpdateSerializer(data=request.data)

            if serializer.is_valid():
                serializer.update(user, serializer.validated_data)
                logger.info(f"Profile updated successfully for user {user.id}")
                return Response({"detail": "Profile updated successfully."})

            logger.warning(f"Profile update validation errors for user {user.id}: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception(f"Unexpected error updating profile for user {request.user.id}")
            return Response(
                {'error': 'An unexpected error occurred while updating profile.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        try:
            serializer = ChangePasswordSerializer(data=request.data)

            if not serializer.is_valid():
                logger.warning(f"Change password validation errors for user {request.user.id}: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            user = request.user

            if not user.check_password(serializer.validated_data["old_password"]):
                logger.info(f"Incorrect old password attempt for user {user.id}")
                return Response(
                    {"detail": "Old password is incorrect."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(serializer.validated_data["new_password"])
            user.save()
            logger.info(f"Password updated successfully for user {user.id}")

            return Response(
                {"detail": "Password updated successfully."},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.exception(f"Unexpected error during password change for user {request.user.id}")
            return Response(
                {'error': 'An unexpected server error occurred. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class WorkshopReApplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role != 'workshop_admin':
            logger.warning(f"Unauthorized re-application attempt by user {user.id} with role {user.role}")
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        try:
            workshop = user.workshop
            if workshop.verification_status == 'REJECTED':
                workshop.verification_status = 'REQUESTED_AGAIN'
                workshop.save()
                logger.info(f"Workshop re-application submitted for user {user.id}")
                return Response(
                    {'message': 'Re-application submitted successfully'},
                    status=status.HTTP_200_OK
                )
            else:
                logger.info(f"Workshop re-application denied for user {user.id}: status is {workshop.verification_status}")
                return Response(
                    {'error': 'Cannot re-apply. Status is not rejected.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Workshop.DoesNotExist:
            logger.warning(f"Workshop profile not found for user {user.id}")
            return Response({'error': 'Workshop profile not found'}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.exception(f"Unexpected error during workshop re-application for user {user.id}")
            return Response(
                {'error': 'An unexpected server error occurred. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class WorkshopSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            query = request.GET.get('query', '').strip()
            if not query:
                return Response([], status=status.HTTP_200_OK)
            
            workshops = Workshop.objects.filter(
                Q(workshop_name__icontains=query) | Q(city__icontains=query), type='TEAM'
            ).exclude(verification_status='REJECTED') 

            serializer = WorkshopSearchSerializer(workshops, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MechanicJoinRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'mechanic':
            return Response({'error': 'Only mechanics can perform this action'}, status=status.HTTP_403_FORBIDDEN)
        
        workshop_id = request.data.get('workshop_id')
        if not workshop_id:
             return Response({'error': 'Workshop ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            mechanic = request.user.mechanic
            if mechanic.workshop and mechanic.joining_status == 'ACCEPTED':
                 return Response({'error': 'You are already working with a workshop. Please leave before joining another.'}, status=status.HTTP_400_BAD_REQUEST)

            if mechanic.workshop and mechanic.joining_status == 'PENDING':
                return Response({'error' : 'workshop hasnt approved yet'},status=status.HTTP_400_BAD_REQUEST)
            
            workshop = Workshop.objects.get(id=workshop_id)

            if workshop.type == 'INDIVIDUAL':
                 return Response({'error': 'Individual workshops cannot accept team members. You can only join Team workshops.'}, status=status.HTTP_400_BAD_REQUEST)
            
            mechanic.workshop = workshop
            mechanic.joining_status = 'PENDING'
            mechanic.save()
            return Response({'message': 'Joining request sent successfully'}, status=status.HTTP_200_OK)

        except Workshop.DoesNotExist:
             return Response({'error': 'Workshop not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WorkshopMechanicRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'workshop_admin':
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            workshop = request.user.workshop
            requests = Mechanic.objects.filter(workshop=workshop, joining_status='PENDING')
            serializer = MechanicRequestSerializer(requests, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WorkshopMechanicActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role != 'workshop_admin':
            logger.warning(f"Unauthorized mechanic action attempt by user {user.id} with role {user.role}")
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        mechanic_id = request.data.get('mechanic_id')
        action = request.data.get('action')

        if not mechanic_id or action not in ['APPROVE', 'REJECT']:
            logger.info(f"Invalid mechanic action data from user {user.id}: {request.data}")
            return Response({'error': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            workshop = user.workshop
            mechanic = Mechanic.objects.get(id=mechanic_id, workshop=workshop)

            if action == 'APPROVE':
                mechanic.joining_status = 'ACCEPTED'
                mechanic.save()
                logger.info(f"Mechanic {mechanic_id} approved by workshop {workshop.id}")
                return Response({'message': 'Mechanic approved successfully'}, status=status.HTTP_200_OK)

            elif action == 'REJECT':
                mechanic.joining_status = 'REJECTED'
                mechanic.workshop = None
                mechanic.save()
                logger.info(f"Mechanic {mechanic_id} rejected by workshop {workshop.id}")
                return Response({'message': 'Mechanic rejected'}, status=status.HTTP_200_OK)

        except Mechanic.DoesNotExist:
            logger.warning(f"Mechanic request not found: {mechanic_id} for workshop {user.workshop.id}")
            return Response({'error': 'Mechanic request not found'}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.exception(f"Unexpected error during mechanic action by user {user.id}")
            return Response(
                {'error': 'An unexpected server error occurred. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WorkshopMyMechanicsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'workshop_admin':
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        try:
            workshop = request.user.workshop
            mechanics = Mechanic.objects.filter(workshop=workshop, joining_status='ACCEPTED')
            serializer = MechanicRequestSerializer(mechanics, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MechanicCurrentWorkshopView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'mechanic':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            mechanic = request.user.mechanic
            workshop = mechanic.workshop
            
            if not workshop:
                return Response(None, status=status.HTTP_200_OK)
            
            data = {
                'id': workshop.id,
                'workshop_name': workshop.workshop_name,
                'address_line': workshop.address_line,
                'city': workshop.city,
                'locality': workshop.locality,
                'contact_number': workshop.contact_number,
                'rating_avg': workshop.rating_avg,
                'joining_status': mechanic.joining_status
            }
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MechanicLeaveWorkshopView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'mechanic':
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            mechanic = request.user.mechanic
            if not mechanic.workshop:
                 return Response({'error': 'You are not connected to any workshop'}, status=status.HTTP_400_BAD_REQUEST)

            from service_request.models import ServiceExecution
            ongoing_services = ServiceExecution.objects.filter(
                mechanics=mechanic,
                service_request__status__in=['CONNECTED', 'ESTIMATE_SHARED', 'SERVICE_AMOUNT_PAID', 'IN_PROGRESS']
            ).exists()
            
            if ongoing_services:
                return Response({
                    'error': 'You cannot leave the workshop while you have ongoing service assignments. Please complete or transfer your current services first.'
                }, status=status.HTTP_400_BAD_REQUEST)

            mechanic.workshop = None
            mechanic.joining_status = 'PENDING' 
            mechanic.save()
            return Response({'message': 'Left workshop successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WorkshopRemoveMechanicView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'workshop_admin':
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        mechanic_id = request.data.get('mechanic_id')
        if not mechanic_id:
             return Response({'error': 'Mechanic ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            workshop = request.user.workshop
            mechanic = Mechanic.objects.get(id=mechanic_id, workshop=workshop)
            
            from service_request.models import ServiceExecution
            ongoing_services = ServiceExecution.objects.filter(
                mechanics=mechanic,
                service_request__status__in=['CONNECTED', 'ESTIMATE_SHARED', 'SERVICE_AMOUNT_PAID', 'IN_PROGRESS']
            ).exists()
            
            if ongoing_services:
                return Response({
                    'error': 'Cannot remove mechanic because they are currently assigned to an ongoing service. Please complete or transfer their services first.'
                }, status=status.HTTP_400_BAD_REQUEST)

            mechanic.workshop = None
            mechanic.joining_status = 'PENDING' 
            mechanic.save()
            return Response({'message': 'Mechanic removed successfully'}, status=status.HTTP_200_OK)
        except Mechanic.DoesNotExist:
             return Response({'error': 'Mechanic not found in your workshop'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MechanicCancelJoinRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'mechanic':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            mechanic = request.user.mechanic
            
            if not mechanic.workshop or mechanic.joining_status != 'PENDING':
                return Response({'error': 'No pending join request found'}, status=status.HTTP_400_BAD_REQUEST)
            
            mechanic.workshop = None
            mechanic.joining_status = 'PENDING'
            mechanic.save()
            
            return Response({'message': 'Join request cancelled successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WorkshopMechanicDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, mechanic_id):
        if not hasattr(request.user, 'workshop'):
            return Response({'error' : 'Unauthorized'}, status = status.HTTP_403_FORBIDDEN)

        try:
            try:
                mechanic = Mechanic.objects.get(id = mechanic_id, workshop = request.user.workshop)
            except Mechanic.DoesNotExist:
                return Response({'error' : 'Mechanic not found in your team'}, status = status.HTTP_404_NOT_FOUND)

            data = {
                'id' : mechanic.id,
                'name' : mechanic.user.full_name,
                'email': mechanic.user.email,
                'phone' : mechanic.contact_number,
                'joinedDate' : mechanic.created_at.strftime('%d %b %Y'),
                'status' : mechanic.availability,
                'rating_avg' : mechanic.rating_avg
            }

            earnings_qs = MechanicEarning.objects.filter(
                mechanic = mechanic,
                earning_type = 'SERVICE_SHARE'
            ).select_related('service_execution__service_request').order_by('-created_at')

            data['totalServices'] = earnings_qs.count()
            data['totalEarnings'] = earnings_qs.aggregate(total = Sum('amount'))['total'] or 0.00

            services_list = []

            for earn in earnings_qs:
                sr = earn.service_execution.service_request if earn.service_execution else None
                if sr:
                    services_list.append({
                        'id' : str(sr.id),
                        'category' : sr.issue_category,
                        'vehicle' : sr.vehicle_model,
                        'date' : earn.created_at.strftime('%d %b %Y'),
                        'mechanicShare' : float(earn.amount),
                        'status' : sr.status
                    })

            data['services'] = services_list

            return Response(data, status = status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class PayMechanicBonus(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, 'workshop'):
            return Response({'error' : 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        mechanic_id = request.data.get('mechanicId')
        service_id = request.data.get('serviceId')
        amount = request.data.get('amount')

        try:
            amount = float(amount)
            if amount <= 1:
                return Response({'error' : 'Amount must be greater than 0'}, status= status.HTTP_400_BAD_REQUEST)
        except (ValueError,TypeError):
            return Response({'error' : 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            mechanic = Mechanic.objects.get(id = mechanic_id, workshop = request.user.workshop)
        except Mechanic.DoesNotExist:
            return Response({'error' : 'Mechanic not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            with transaction.atomic():
                workshop_wallet, _ = Wallet.objects.get_or_create(user = request.user)
                if workshop_wallet.balance < amount:
                    return Response({'error' : 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)
                
                workshop_wallet.balance = F('balance') - amount
                workshop_wallet.save()

                WalletTransaction.objects.create(
                    wallet = workshop_wallet,
                    amount = amount,
                    transaction_type = 'DEBIT',
                    description=f"Bonus Paid to {mechanic.user.full_name}"
                )

                mechanic_wallet, _ = Wallet.objects.get_or_create(user = mechanic.user)
                mechanic_wallet.balance = F('balance') + amount
                mechanic_wallet.save()

                WalletTransaction.objects.create(
                    wallet = mechanic_wallet,
                    amount = amount,
                    transaction_type = 'CREDIT',
                    description=f"Bonus Received from Workshop: {request.user.workshop.workshop_name}"
                )

                service_exec = None
                if service_id:
                    service_exec = ServiceExecution.objects.filter(service_request_id=service_id).first()

                MechanicEarning.objects.create(
                    mechanic=mechanic,
                    service_execution=service_exec,
                    amount=amount,
                    earning_type='BONUS',
                    description=f"Bonus from workshop admin: {request.user.workshop.workshop_name}"
                )

            return Response({'message': f'₹{amount} Bonus paid successfully to {mechanic.user.full_name}!'}, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetRejectedReason(APIView):
    def get(self, request):
        if not hasattr(request.user, 'workshop'):
            return Response({'error' : 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        try:
            rejection_reason  = request.user.workshop.rejection_reason
            return Response({'rejected_reason' : rejection_reason}, status= status.HTTP_200_OK)
        except Exception:
            return Response({'error' : 'Failed to fetch rejected reason'})

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
from django.db.models import Q
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


class BaseRegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = None 

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        
        if serializer.is_valid():
            try:
                pending_user = serializer.save()

                return Response(
                    {
                        'message': 'Registration successful. Please check your email for the OTP verification.',
                        'email': pending_user.email,
                        'role': pending_user.role
                    },
                    status=status.HTTP_201_CREATED
                )
            
            except Exception as e:
                print(f'Registration exception: {e}')
                # Provide more specific error if possible
                error_message = str(e) if str(e) else "An unexpected error occurred during registration. Please try again."
                return Response(
                    {'error': error_message},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Format validation errors for better readability
        print(f"Validation errors: {serializer.errors}")
        
        # Extract the first error message for user-friendly display
        errors = serializer.errors
        if isinstance(errors, dict):
            # Get first field error
            first_field = next(iter(errors.keys()))
            first_error = errors[first_field]
            
            error_message = ""
            if isinstance(first_error, list) and len(first_error) > 0:
                raw_msg = first_error[0]
            else:
                raw_msg = str(first_error)

            if first_field == 'non_field_errors':
                error_message = raw_msg
            else:
                # Make field name readable
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
            # Return validation errors from serializer
            error_detail = e.detail
            if isinstance(error_detail, dict):
                first_error = next(iter(error_detail.values()))
                if isinstance(first_error, list):
                    error_message = first_error[0]
                else:
                    error_message = str(first_error)
            else:
                error_message = str(error_detail)
            return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        role = serializer.validated_data['role']

        try:
            with transaction.atomic():
                # Check if OTP record exists
                try:
                    otp_record = EmailOTP.objects.get(
                        email=email,
                        is_verified=False,
                        purpose='registration'
                    )
                except EmailOTP.DoesNotExist:
                    return Response(
                        {'error': 'No OTP found for this email. Please request a new OTP or register again.'},
                        status=status.HTTP_404_NOT_FOUND
                    )

                # Check if pending user exists
                try:
                    pending_user = PendingUser.objects.get(email=email)
                except PendingUser.DoesNotExist:
                    return Response(
                        {'error': 'Registration session expired. Please register again.'},
                        status=status.HTTP_404_NOT_FOUND
                    )

                # Verify role matches
                if pending_user.role != role:
                    return Response(
                        {'error': f'Role mismatch. Please verify you selected the correct role: {pending_user.role}.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Check if OTP is expired
                if otp_record.is_expired():
                    return Response(
                        {'error': 'OTP has expired. Please request a new OTP.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Verify OTP
                if otp_record.otp != otp:
                    return Response(
                        {'error': 'Invalid OTP. Please check the code and try again.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Mark OTP as verified
                otp_record.is_verified = True
                otp_record.save()

                # Create user account
                user = User.objects.create_user(
                    email=pending_user.email,
                    full_name=pending_user.full_name,
                    role=pending_user.role,
                    password=pending_user.password,
                    is_active=True
                )

                # Create role-specific profile
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

                elif user.role == 'mechanic':
                    Mechanic.objects.create(
                        user=user,
                        contact_number=pending_user.contact_number
                    )

                # Clean up
                pending_user.delete()
                otp_record.delete()

                return Response(
                    {'message': 'Account created successfully. Please login to continue.'},
                    status=status.HTTP_201_CREATED
                )

        except Exception as e:
            print(f"OTP Verification Error: {e}")
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
            return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        role = serializer.validated_data['role']
    
        try:
            pending_user = PendingUser.objects.get(email=email, role=role)
        except PendingUser.DoesNotExist:
            return Response(
                {'error': 'No pending registration found for this email and role. Please register first.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        otp_record, status_ok, message = send_otp_mail(
            email=pending_user.email,
            full_name=pending_user.full_name,
            role=pending_user.role
        )

        if status_ok:
            return Response({"message": message}, status=status.HTTP_200_OK)
        else:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
        
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
                return Response(
                    {'error': 'Your account has been blocked. Please contact support for assistance.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except User.DoesNotExist:
            return Response(
                {'error': 'No account found with this email address. Please check your email or register.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not user.check_password(password):
             return Response(
                {'error': 'Incorrect password. Please try again or use "Forgot Password" to reset.'},
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
            
            return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Login error: {e}")
            return Response(
                {'error': 'An unexpected error occurred. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        data = serializer.validated_data

        response_data = {
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

        return response
    
class LogoutView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        response = Response({'detail' : 'successfully logged out'}, status=status.HTTP_200_OK)

        response.delete_cookie('refreshtoken')

        refresh_token = request.COOKIES.get('refreshtoken')

        if not refresh_token:
            return Response({'detail': 'No refresh token cookie was present. Logged out locally.'},status=status.HTTP_200_OK)
        
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return response
        
        except TokenError:
            response = Response({'Invalid token or token expired'},status=status.HTTP_400_BAD_REQUEST)
            return response
        
        except Exception as e:
            print(e)
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

            print("🧠 SETTING REFRESH COOKIE")
            print("REFRESH VALUE:", str(refresh))
            print("COOKIE SETTINGS:", {
                "key": settings.SIMPLE_JWT['AUTH_COOKIE'],
                "samesite": settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                "secure": settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            })


            return response

        except Exception as e:
            return Response({"error": str(e)}, status=400)

        

class ForgotPasswordSendOtpView(APIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordSendOtpSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        otp_record, success, message = send_password_reset_otp(email)

        if success:
            return Response({"detail": message}, status=status.HTTP_200_OK)
        else:
            if message.startswith("User with this email"):
                 return Response({"detail": "If the email is registered, an OTP has been sent."}, status=status.HTTP_200_OK)
            print(message)
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordVerifyOtpView(APIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordVerifyOtpSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        try:
            otp_record = EmailOTP.objects.get(email=email, purpose = 'forgot_password')
        except EmailOTP.DoesNotExist:
            return Response({"detail": "Invalid email or OTP."}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.is_expired():
            return Response({"detail": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)
        
        if otp_record.otp != otp:
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otp_record.is_verified = True
        otp_record.save()

        return Response({"detail": "OTP verified successfully. You can now reset your password."}, status=status.HTTP_200_OK)


class ForgotPasswordResetView(APIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordResetSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        new_password = serializer.validated_data['new_password']

        try:
            otp_record = EmailOTP.objects.get(email=email, purpose = 'forgot_password')
        except EmailOTP.DoesNotExist:
            return Response({"detail": "Password reset flow not initiated or token expired."}, status=status.HTTP_400_BAD_REQUEST)

        if not otp_record.is_verified:
            return Response({"detail": "OTP must be verified before resetting the password."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as e:
            return Response({"detail": e.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        otp_record.delete() 

        return Response({"detail": "Password reset successfully. Please log in with your new password."}, status=status.HTTP_200_OK)
    

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        role_data = None

        if user.role == "mechanic":
            role_data = {
                "contact_number": user.mechanic.contact_number,
                "availability": user.mechanic.availability
            }
        elif user.role == "workshop_admin":
            workshop = user.workshop
            role_data = {
                "contact_number": workshop.contact_number,
                "workshop_name" : workshop.workshop_name,
                "city" : workshop.city,
                "locality" : workshop.locality,
                "pincode" : workshop.pincode,
                "address_line" : workshop.address_line,
                "state" : workshop.state,
                "type" : workshop.type,
                "verification_status" : workshop.verification_status,
                "license_number" : workshop.license_number
            }

        data = {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "profile_picture": user.profile_picture.url if user.profile_picture else None,
            "role_details": role_data,
            'memberSince': user.date_joined
        }

        return Response(data)

    def put(self, request):
        user = request.user
        serializer = ProfileUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.update(user, serializer.validated_data)
            return Response({"detail": "Profile updated successfully."})

        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data)

        if not serializer.is_valid():
            print(serializer.errors)
            return Response(serializer.errors, status=400)

        user = request.user

        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"detail": "Old password is incorrect."}, status=400)

        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response({"detail": "Password updated successfully."}, status=200)

class WorkshopReApplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'workshop_admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            workshop = user.workshop
            if workshop.verification_status == 'REJECTED':
                workshop.verification_status = 'REQUESTED_AGAIN'
                workshop.save()
                return Response({'message': 'Re-application submitted successfully'}, status=status.HTTP_200_OK)
            else:
                 return Response({'error': 'Cannot re-apply. Status is not rejected.'}, status=status.HTTP_400_BAD_REQUEST)
        except Workshop.DoesNotExist:
            return Response({'error': 'Workshop profile not found'}, status=status.HTTP_404_NOT_FOUND)

class WorkshopSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get('query', '').strip()
        if not query:
            return Response([], status=status.HTTP_200_OK)
        
        workshops = Workshop.objects.filter(
            Q(workshop_name__icontains=query) | Q(city__icontains=query)
        ).exclude(verification_status='REJECTED') 

        serializer = WorkshopSearchSerializer(workshops, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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
        if request.user.role != 'workshop_admin':
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        mechanic_id = request.data.get('mechanic_id')
        action = request.data.get('action') 

        if not mechanic_id or action not in ['APPROVE', 'REJECT']:
             return Response({'error': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            workshop = request.user.workshop
            mechanic = Mechanic.objects.get(id=mechanic_id, workshop=workshop)
            
            if action == 'APPROVE':
                mechanic.joining_status = 'ACCEPTED'
                mechanic.save()
                return Response({'message': 'Mechanic approved successfully'}, status=status.HTTP_200_OK)
            elif action == 'REJECT':
                mechanic.joining_status = 'REJECTED'
                mechanic.workshop = None 
                mechanic.save()
                return Response({'message': 'Mechanic rejected'}, status=status.HTTP_200_OK)
        
        except Mechanic.DoesNotExist:
             return Response({'error': 'Mechanic request not found'}, status=status.HTTP_404_NOT_FOUND)

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
            
            mechanic.workshop = None
            mechanic.joining_status = 'PENDING' 
            mechanic.save()
            return Response({'message': 'Mechanic removed successfully'}, status=status.HTTP_200_OK)
        except Mechanic.DoesNotExist:
             return Response({'error': 'Mechanic not found in your workshop'}, status=status.HTTP_404_NOT_FOUND)

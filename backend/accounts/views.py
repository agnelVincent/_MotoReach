from .serializers import RegistrationSerializer, VerifyOTPSerializer, ResendOTPSerializer, CustomTokenObtainPairSerializer, UserRoleSerializer, ForgotPasswordResetSerializer, ForgotPasswordVerifyOtpSerializer, ForgotPasswordSendOtpSerializer, ProfileUpdateSerializer, ChangePasswordSerializer, CookieTokenRefreshSerializer 
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

class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self,request):
        serializer = RegistrationSerializer(data = request.data)
        if serializer.is_valid():
            try:
                pending_user = serializer.save()

                return Response(
                    {
                        'message' : 'Registration successful. Please check your email for the OTP verification',
                        'email' : pending_user.email,
                        'role' : pending_user.role
                    },
                    status = status.HTTP_201_CREATED
                )
            
            except Exception as e:
                print(f'exception occured : {e}')
                return Response(
                    {'error' : "An unexpected error occured during registration. Please try again"},
                    status = status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self,request):
        serializer = VerifyOTPSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        role = serializer.validated_data['role']

        try:
            otp_record = EmailOTP.objects.get(email = email, is_verified = False, purpose = 'registration')
            pending_user = PendingUser.objects.get(email = email, role = role)

            if otp_record.is_expired():
                otp_record.delete()
                return Response({'error' : 'OTP has expired. Please try for a new one'}, status = status.HTTP_400_BAD_REQUEST)
            
            if otp_record.otp != otp:
                return Response({"error" : "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
            
            otp_record.is_verified = True
            otp_record.save()

            user = User.objects.create_user(
                email = pending_user.email,
                full_name = pending_user.full_name,
                role = pending_user.role,
                password = pending_user.password,
                is_active = True
            )

            if user.role == 'workshop_admin':
                Workshop.objects.create(
                    user = user,
                    workshop_name = pending_user.workshop_name,
                    address_line = pending_user.address_line,
                    locality = pending_user.locality,
                    city = pending_user.city,
                    contact_number = pending_user.contact_number,
                    state = pending_user.state,
                    pincode = pending_user.pincode,
                    type = pending_user.type
                )
            elif user.role == 'mechanic':
                Mechanic.objects.create(
                    user = user,
                    contact_number = pending_user.contact_number
                )
            
            pending_user.delete()

            return Response({'message' : 'Account created successfully. Please login'}, status = status.HTTP_201_CREATED)
            
        except EmailOTP.DoesNotExist:
            return Response({'error' : 'OTP not found'},status=status.HTTP_404_NOT_FOUND)
        except PendingUser.DoesNotExist:
            return Response({'error' : 'Registration not found'},status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(e)
            return Response({'error' :"An internal error occured while registering"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        role = serializer.validated_data['role']
    
        try:
            pending_user = PendingUser.objects.get(email = email, role = role)
        except PendingUser.DoesNotExist:
            return Response({'error' : 'Pending registration not found'},status=status.HTTP_404_NOT_FOUND)
        
        otp_record , status_ok, message = send_otp_mail(
            email = pending_user.email,
            full_name = pending_user.full_name,
            role = pending_user.role
        )

        if status_ok:
            return Response({"message":message},status=status.HTTP_200_OK)
        else:
            return Response({'error' : message}, status=status.HTTP_400_BAD_REQUEST)
        
class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = CustomTokenObtainPairSerializer
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data = request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            print(e)
            return Response({'error':'Invalid credentials'},status=status.HTTP_401_UNAUTHORIZED)
        
        data = serializer.validated_data

        response = Response(
            {'access' : data['access'],
             'full_name' : data['full_name'],
             'role' : data['role'],
             'email' : data['email']
             },
            status=status.HTTP_200_OK
        )

        response.set_cookie(
            key = settings.SIMPLE_JWT['AUTH_COOKIE'],
            value = data['refresh'],
            expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
            secure = settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
            path = '/'
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
            "profile_picture": request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
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

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = request.user

        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"detail": "Old password is incorrect."}, status=400)

        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response({"detail": "Password updated successfully."}, status=200)

from .serializers import RegistrationSerializer, VerifyOTPSerializer, ResendOTPSerializer, CustomTokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import EmailOTP,PendingUser,User,Workshop,Mechanic
from .utils import send_otp_mail
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings

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
            otp_record = EmailOTP.objects.get(email = email, is_verified = False)
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
    serializer_class = CustomTokenObtainPairSerializer
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data = request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            print(e)
            return Response({'error':'Invalid credentials'},status=status.HTTP_401_UNAUTHORIZED)
        
        data = serializer.validated_data

        refresh_token = request.COOKIES.get('refreshtoken')
        refresh_token = str(self.serializer_class.get_token(serializer.user))

        response = Response(data,status=status.HTTP_200_OK)

        response.set_cookie(
            key = settings.SIMPLE_JWT['AUTH_COOKIE'],
            value = refresh_token,
            expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
            secure = settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
        )

        return response
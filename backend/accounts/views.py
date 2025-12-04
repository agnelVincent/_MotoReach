from .serializers import RegistrationSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class RegisterView(APIView):
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
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
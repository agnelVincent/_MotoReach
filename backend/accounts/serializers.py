from rest_framework import serializers
from django.core.validators import RegexValidator
from .models import PendingUser,User,Workshop
from .utils import send_otp_mail
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import InvalidToken
from django.conf import settings
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth.hashers import make_password

User = get_user_model()

contact_validators = [RegexValidator(
    regex='^\d{10}$',
    message='Contact number must be exactly 10 digits'
)]

class RegistrationSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length = 100)
    email = serializers.EmailField()
    password = serializers.CharField(max_length = 128, style = {'input_type' : 'password'})
    confirm_password = serializers.CharField(max_length = 128, style ={'input_type' : 'password'})
    role = serializers.CharField(max_length = 20)

    workshop_name = serializers.CharField(max_length = 255, allow_blank = True, required = False)
    address_line = serializers.CharField(allow_blank = True, required = False)
    license_number = serializers.CharField(max_length = 255, allow_blank = True, required = False)
    state = serializers.CharField(max_length = 30, allow_blank = True, required = False)
    locality = serializers.CharField(max_length = 255, allow_blank = True, required = False)
    city = serializers.CharField(max_length = 50, allow_blank = True, required = False)
    pincode = serializers.CharField(max_length = 6, allow_blank = True, required = False)
    workshop_type = serializers.CharField(max_length = 20, required = False, allow_blank = True)
    contact_number = serializers.CharField( allow_blank = True, required = False, validators = contact_validators)
    type = serializers.CharField(max_length = 20, allow_blank = True,required = False)
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)

    def validate_role(self, value):
        allowed_roles = ['user','mechanic','workshop_admin']
        if value not in allowed_roles:
            raise serializers.ValidationError('Invalid role selected')
        return value

    def validate_email(self,value):
        if User.objects.filter(email = value).exists():
            raise serializers.ValidationError('An account with this email already exists')
        return value
    
    def validate_password(self,value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must contain atleast 8 letters')
        return value
    
    def validate(self,data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password':'Passwords does not match'})
        role = data.get('role')

        if role == 'workshop_admin':
            required_fields = [
                'workshop_name','license_number','state','city','locality','pincode','address_line','contact_number','workshop_type'
            ]

            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError({field : 'This field is required for Workshop Admin registration'})
                
            if Workshop.objects.filter(license_number = data['license_number']).exists():
                raise serializers.ValidationError({'license_number' : 'A workshop with this license number already registered'})
            
            if data['workshop_type'].upper() not in ['INDIVIDUAL','TEAM']:
                raise serializers.ValidationError({'workshop_type' : 'Invalid workshop type selected'})
            
            data['workshop_type'] = data['workshop_type'].upper()

        elif role == 'mechanic':
            if not data.get('contact_number'):
                raise serializers.ValidationError({"contact_number": "Contact number is required for Mechanic registration."})
            
        data.pop('confirm_password')

        return data
    
    def create(self, validated_data):
        email = validated_data['email']

        try:
            existing_user = PendingUser.objects.get(email = email)
            existing_user.delete()
        except PendingUser.DoesNotExist:
            pass
        hashed_password = make_password(validated_data['password'])
        def clean_optional(value):
            return value if value else None

        pending_user = PendingUser.objects.create(
            email=email,
            full_name=validated_data['full_name'],
            password=hashed_password,
            role=validated_data['role'],

            workshop_name=clean_optional(validated_data.get('workshop_name')),
            license_number=clean_optional(validated_data.get('license_number')),
            address_line=clean_optional(validated_data.get('address_line')),
            state=clean_optional(validated_data.get('state')),
            city=clean_optional(validated_data.get('city')),
            pincode=clean_optional(validated_data.get('pincode')),
            locality=clean_optional(validated_data.get('locality')),
            contact_number=clean_optional(validated_data.get('contact_number')),
            type=clean_optional(validated_data.get('workshop_type')),
            latitude=validated_data.get('latitude'),
            longitude=validated_data.get('longitude')
        )


        pending_user.save()

        otp_record , status, message = send_otp_mail(
            email = validated_data['email'],
            full_name=validated_data['full_name'],
            role = validated_data['role']
        )

        print(f"OTP email result: {message}")

        return pending_user
            
class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length = 6)
    role = serializers.CharField(max_length = 20)

class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.CharField(max_length = 20)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)

        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        data['role'] = self.user.role
        data['full_name'] = self.user.full_name
        data['email'] = self.user.email

        if self.user.role == 'workshop_admin':
            try:
                workshop_status = self.user.workshop.verification_status
                data['workshop_status'] = workshop_status
            except AttributeError:
                data['workshop_status'] = 'NO WORKSHOP FOUND'

        return data
    
class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','email','full_name','role']

class LoginResponseSerializer(serializers.Serializer):
    user = UserRoleSerializer()
    access = serializers.CharField()
    refresh = serializers.CharField()

class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only = True)

class CookieTokenRefreshSerializer(TokenRefreshSerializer):
    refresh = serializers.CharField(required=False, allow_blank=True)
    def validate(self, attrs):

        refresh = self.context['request'].COOKIES.get(
            settings.SIMPLE_JWT['AUTH_COOKIE']
        )

        if not refresh:
            raise InvalidToken('No refresh token in cookie')
        
        attrs['refresh'] = refresh
        
        try:
            data = super().validate(attrs)
            return data
        except TokenError as e:
            print('token error',str(e))
        except Exception as e:
            print(str(e))

class ForgotPasswordSendOtpSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class ForgotPasswordVerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, required=True)

class ForgotPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    new_password = serializers.CharField(min_length=8, required=True)
    
    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        return value

class ProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, max_length=100)
    profile_picture = serializers.ImageField(required=False)
    contact_number = serializers.CharField(required=False, allow_blank=True)
    availability = serializers.CharField(required=False)

    def validate_full_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Full name must have at least 3 characters.")
        return value

    def validate_contact_number(self, value):
        if value and (not value.isdigit() or len(value) != 10):
            raise serializers.ValidationError("Contact number must be digits and 10characters long.")
        return value
    
    def validate_availability(self, value):
        allowed = ['AVAILABLE', 'BUSY']
        if value not in allowed:
            raise serializers.ValidationError("Availability must be AVAILABLE or BUSY.")
        return value

    def update(self, user, validated_data):
        user.full_name = validated_data.get("full_name", user.full_name)

        if "profile_picture" in validated_data:
            user.profile_picture = validated_data["profile_picture"]

        user.save()

        role = user.role  

        if role == "mechanic":
            mechanic = user.mechanic
            if "contact_number" in validated_data:
                mechanic.contact_number = validated_data["contact_number"]

            if "availability" in validated_data:
                mechanic.availability = validated_data["availability"]

            mechanic.save()

        elif role == "workshop_admin":
            workshop = user.workshop
            if "contact_number" in validated_data:
                workshop.contact_number = validated_data["contact_number"]
                workshop.save()

        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_new_password"]:
            raise serializers.ValidationError("New passwords do not match.")
        return data

    def validate_new_password(self, value):
        validate_password(value)
        return value

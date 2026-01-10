from rest_framework import serializers
from django.core.validators import RegexValidator
from .models import PendingUser,User,Workshop,Mechanic
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

contact_validators = [
    RegexValidator(
        regex=r'^\d{10}$',
        message='Contact number must be exactly 10 digits'
    )
]

class BaseRegistrationSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length = 100)
    email = serializers.EmailField()
    password = serializers.CharField(max_length = 128, style = {'input_type' : 'password'})
    confirm_password = serializers.CharField(max_length = 128, style ={'input_type' : 'password'})

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists. Please login or use a different email.')
        return value
    
    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long.')
        return value
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match. Please ensure both passwords are identical.'})
        data.pop('confirm_password')
        return data

    def create_pending_user(self, validated_data, role, extra_fields=None):
        email = validated_data['email']

        try:
            existing_user = PendingUser.objects.get(email = email)
            existing_user.delete()
        except PendingUser.DoesNotExist:
            pass
        
        hashed_password = make_password(validated_data['password'])
        
        create_kwargs = {
            'email': email,
            'full_name': validated_data['full_name'],
            'password': hashed_password,
            'role': role
        }

        if extra_fields:
            create_kwargs.update(extra_fields)

        pending_user = PendingUser.objects.create(**create_kwargs)
        pending_user.save()

        otp_record , status, message = send_otp_mail(
            email = validated_data['email'],
            full_name=validated_data['full_name'],
            role = role
        )

        return pending_user

class UserRegistrationSerializer(BaseRegistrationSerializer):
    role = serializers.CharField(default='user', read_only=True)

    def create(self, validated_data):
        return self.create_pending_user(validated_data, role='user')

class MechanicRegistrationSerializer(BaseRegistrationSerializer):
    role = serializers.CharField(default='mechanic', read_only=True)
    contact_number = serializers.CharField(required = True, validators = contact_validators)

    def create(self, validated_data):
        extra_fields = {
            'contact_number': validated_data.get('contact_number')
        }
        return self.create_pending_user(validated_data, role='mechanic', extra_fields=extra_fields)

class WorkshopRegistrationSerializer(BaseRegistrationSerializer):
    role = serializers.CharField(default='workshop_admin', read_only=True)
    workshop_name = serializers.CharField(max_length = 255, required = True)
    address_line = serializers.CharField(required = True)
    license_number = serializers.CharField(max_length = 255, required = True)
    state = serializers.CharField(max_length = 30, required = True)
    locality = serializers.CharField(max_length = 255, required = True)
    city = serializers.CharField(max_length = 50, required = True)
    pincode = serializers.CharField(max_length = 6, required = True)
    workshop_type = serializers.CharField(max_length = 20, required = True)
    contact_number = serializers.CharField(required = True, validators = contact_validators)
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)

    def validate(self, data):
        data = super().validate(data)
        
        if Workshop.objects.filter(license_number = data['license_number']).exists():
            raise serializers.ValidationError({'license_number' : 'A workshop with this license number already registered'})
        
        if data['workshop_type'].upper() not in ['INDIVIDUAL','TEAM']:
            raise serializers.ValidationError({'workshop_type' : 'Invalid workshop type selected'})
        
        data['workshop_type'] = data['workshop_type'].upper()
        return data

    def create(self, validated_data):
        extra_fields = {
            'workshop_name': validated_data.get('workshop_name'),
            'license_number': validated_data.get('license_number'),
            'address_line': validated_data.get('address_line'),
            'state': validated_data.get('state'),
            'city': validated_data.get('city'),
            'pincode': validated_data.get('pincode'),
            'locality': validated_data.get('locality'),
            'contact_number': validated_data.get('contact_number'),
            'type': validated_data.get('workshop_type'),
            'latitude': validated_data.get('latitude'),
            'longitude': validated_data.get('longitude')
        }
        return self.create_pending_user(validated_data, role='workshop_admin', extra_fields=extra_fields)

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

class WorkshopSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workshop
        fields = ['id', 'workshop_name', 'city', 'locality', 'address_line', 'rating_avg', 'contact_number']

class MechanicRequestSerializer(serializers.ModelSerializer):
    mechanic_name = serializers.CharField(source='user.full_name')
    email = serializers.EmailField(source='user.email')
    mechanic_id = serializers.IntegerField(source='id')
    user_id = serializers.IntegerField(source='user.id')

    class Meta:
        model = Mechanic
        fields = ['mechanic_id', 'user_id', 'mechanic_name', 'email', 'contact_number', 'availability', 'joining_status', 'created_at']

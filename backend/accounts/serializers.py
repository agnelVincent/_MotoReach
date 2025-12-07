from rest_framework import serializers
from django.core.validators import RegexValidator
from .models import EmailOTP,PendingUser,User,Workshop,Mechanic
from .utils import send_otp_mail

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

        pending_user = PendingUser.objects.create(
            email = email,
            full_name = validated_data['full_name'],
            password = validated_data['password'],
            role = validated_data['role'],

            workshop_name = validated_data.get('workshop_name'),
            license_number = validated_data.get('license_number'),
            address_line = validated_data.get('address_line'),
            state = validated_data.get('state'),
            city = validated_data.get('city'),
            pincode = validated_data.get('pincode'),
            locality = validated_data.get('locality'),
            contact_number = validated_data.get('contact_number'),
            type = validated_data.get('workshop_type')
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
        



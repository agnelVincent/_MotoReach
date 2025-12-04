import random
from django.utils import timezone
from .models import EmailOTP, PendingUser

def generate_otp_code(length = 6):
    return str(random.randint(10**(length-1), (10**length) - 1))

def send_otp_mail(email, full_name, role):
    
    try:
        otp_record = EmailOTP.objects.get(email = email)

        if not otp_record:
            return otp_record,False,"Resend limit reached or cooldown period active"
        
        otp_record.resend_count += 1
        otp_record.last_sent = timezone.now()
        otp_record.is_verified = False

    except EmailOTP.DoesNotExist:
        otp_record = EmailOTP(email = email)

    otp_code = generate_otp_code()
    otp_record.otp = otp_code
    otp_record.created_at = timezone.now()
    otp_record.save()

    print(f'email : {email}, full name : {full_name}, otp : {otp_code}')

    return otp_record, True, "OTP sent successfully"
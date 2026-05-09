import random
from django.utils import timezone
from .models import EmailOTP
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

def generate_otp_code(length = 6):
    return str(random.randint(10**(length-1), (10**length) - 1))

def send_otp_mail(email, full_name, role):
    try:
        otp_record = EmailOTP.objects.get(email=email, purpose='registration')

        if (timezone.now() - otp_record.last_sent) >= otp_record.RESEND_DECAY_PERIOD:
            otp_record.resend_count = 0

        if not otp_record.can_resend():
            logger.info(f"OTP resend limit reached for {email}")
            return otp_record, False, "Resend limit reached or cooldown period active"

        otp_record.resend_count += 1
        otp_record.last_sent = timezone.now()
        otp_record.is_verified = False

    except EmailOTP.DoesNotExist:
        otp_record = EmailOTP(email=email, purpose='registration')

    otp_code = generate_otp_code()
    otp_record.otp = otp_code
    otp_record.created_at = timezone.now()
    otp_record.save()

    subject = f"Your Verification code for {settings.DEFAULT_FROM_EMAIL}"
    message = (
        f"Hello {full_name},\n\n"
        f'Thank you for registering as a {role}. '
        f'Your One-Time-Password for account verification is:\n\n'
        f'OTP: {otp_code}\n\n'
        f'This code will expire in 1 minute. If you did not request this, please ignore this email.\n\n'
        f'Thanks,\n{settings.DEFAULT_FROM_EMAIL} Team'
    )
    recipient_list = [email]

    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list, fail_silently=False)
        logger.info(f"OTP sent successfully to {email}")
        return otp_record, True, "OTP sent successfully"
    except Exception as e:
        logger.exception(f"Failed to send OTP mail to {email}")
        return otp_record, False, "Failed to send OTP mail due to server error"


def send_password_reset_otp(email):
    if not User.objects.filter(email=email).exists():
        logger.info(f"Password reset requested for non-existent email {email}")
        return None, False, "If the email is registered, an OTP has been sent."

    try:
        otp_record = EmailOTP.objects.get(email=email, purpose='forgot_password')

        # Reset resend count if cooldown period passed
        if (timezone.now() - otp_record.last_sent) >= otp_record.RESEND_DECAY_PERIOD:
            otp_record.resend_count = 0

        if not otp_record.can_resend():
            logger.info(f"Password reset OTP resend limit reached for {email}")
            return otp_record, False, "Resend limit reached or cooldown period (60s) active."

        otp_record.resend_count += 1
        otp_record.last_sent = timezone.now()
        otp_record.is_verified = False

    except EmailOTP.DoesNotExist:
        otp_record = EmailOTP(email=email, resend_count=0, purpose='forgot_password')

    otp_code = generate_otp_code()
    otp_record.otp = otp_code
    otp_record.created_at = timezone.now()
    if otp_record.resend_count == 0:
        otp_record.last_sent = timezone.now()
    otp_record.save()

    try:
        user = User.objects.get(email=email)
        full_name = getattr(user, 'full_name', email)
    except User.DoesNotExist:
        full_name = email

    subject = f"Password Reset Verification Code for {settings.DEFAULT_FROM_EMAIL}"
    message = (
        f"Hello {full_name},\n\n"
        f'You requested a password reset. Your One-Time-Password is:\n\n'
        f'OTP: {otp_code}\n\n'
        f'This code will expire in 1 minute. If you did not request this, please ignore this email.\n\n'
        f'Thanks,\n{settings.DEFAULT_FROM_EMAIL} Team'
    )
    recipient_list = [email]

    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list, fail_silently=False)
        logger.info(f"Password reset OTP sent successfully to {email}")
        return otp_record, True, "OTP sent successfully. Check your inbox."
    except Exception as e:
        logger.exception(f"Failed to send password reset OTP to {email}")
        return otp_record, False, "Failed to send OTP mail due to server error."
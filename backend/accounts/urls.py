from django.urls import path
from .views import RegisterView,VerifyOTPView, ResendOTPView, LoginView,LogoutView, GoogleAuthView, ForgotPasswordVerifyOtpView, ForgotPasswordResetView, ForgotPasswordSendOtpView, ProfileView, ChangePasswordView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/',RegisterView.as_view(), name = 'register'),
    path('verify-otp/', VerifyOTPView.as_view(),name = 'verify-otp'),
    path('resend-otp/',ResendOTPView.as_view(),name = 'resend-otp'),
    path('login/', LoginView.as_view(), name = 'token_obtain_pair'),
    path('token/refresh',TokenRefreshView.as_view(), name='token_refresh'),
    path('google/', GoogleAuthView.as_view(), name='google-login'),
    path('logout/',LogoutView.as_view(), name = 'auth_logout'),
    path('forgot-password/send-otp/', ForgotPasswordSendOtpView.as_view(), name='forgot_password_send_otp'),
    path('forgot-password/verify-otp/', ForgotPasswordVerifyOtpView.as_view(), name='forgot_password_verify_otp'),
    path('forgot-password/reset/', ForgotPasswordResetView.as_view(), name='forgot_password_reset'),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password")
]

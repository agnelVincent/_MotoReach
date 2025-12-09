from django.urls import path
from .views import RegisterView,VerifyOTPView, ResendOTPView, LoginView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/',RegisterView.as_view(), name = 'register'),
    path('verify-otp/', VerifyOTPView.as_view(),name = 'verify-otp'),
    path('resend-otp/',ResendOTPView.as_view(),name = 'resend-otp'),
    path('login/', LoginView.as_view(), name = 'token_obtain_pair'),
    path('token/refresh',TokenRefreshView.as_view(), name='token_refresh')
]

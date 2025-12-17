from django.urls import path
from .views import AdminDashboardStatsView,WorkshopVerificationView

urlpatterns = [
    path('stats/', AdminDashboardStatsView.as_view(), name='stats'),
    path('workshops/<int:workshop_id>/verify/', WorkshopVerificationView.as_view(), name='verify-workshop')
]

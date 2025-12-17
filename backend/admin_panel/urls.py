from django.urls import path
from .views import AdminDashboardStatsView,WorkshopVerificationView, AdminMechanicListView,AdminUserListView,AdminWorkshopListView, ToggleUserBlockView

urlpatterns = [
    path('stats/', AdminDashboardStatsView.as_view(), name='stats'),
    path('workshops/<int:workshop_id>/verify/', WorkshopVerificationView.as_view(), name='verify-workshop'),
    path('users/', AdminUserListView.as_view(), name='admin-users'),
    path('workshops/', AdminWorkshopListView.as_view(), name='admin-workshops'),
    path('mechanics/', AdminMechanicListView.as_view(), name='admin-mechanics'),
    path('users/<int:user_id>/toggle-block/', ToggleUserBlockView.as_view(), name='toggle-block'),
]

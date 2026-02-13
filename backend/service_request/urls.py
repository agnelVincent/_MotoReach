from django.urls import path
from .views import (
    CreateServiceRequestView,
    ServiceRequestDetailView,
    UserServiceRequestListView,
    ConnectWorkshopView,
    WorkshopConnectionRequestsView,
    AcceptConnectionRequestView,
    RejectConnectionRequestView,
    CancelConnectionRequestView,
    UserCancelConnectionView,
    DeleteServiceRequestView,
    WorkshopMechanicsView,
    AssignMechanicView,
    RemoveMechanicView,
    MechanicAssignedServicesView,
    CreateEstimateView,
    UpdateEstimateView,
    SendEstimateView,
    ResendEstimateView,
    ApproveEstimateView,
    RejectEstimateView,
    GetEstimateView,
    ListEstimatesView,
    DeleteEstimateView,
    GenerateServiceOTPView,
    VerifyServiceOTPView,
)

urlpatterns = [
    path('create/', CreateServiceRequestView.as_view(), name='service-request-initiation'),
    path('<int:pk>/', ServiceRequestDetailView.as_view(), name='service-request-detail'),
    path('<int:pk>/nearby/', ServiceRequestDetailView.as_view(), name='request-nearby'),
    path('user-requests/', UserServiceRequestListView.as_view(), name='user-requests'),
    path('<int:pk>/connect/', ConnectWorkshopView.as_view(), name='connect-workshop'),
    path('<int:pk>/delete/', DeleteServiceRequestView.as_view(), name='delete-service-request'),
    path('connection/<int:pk>/cancel/', UserCancelConnectionView.as_view(), name='user-cancel-connection'),
    path('workshop/connection-requests/', WorkshopConnectionRequestsView.as_view(), name='workshop-connection-requests'),
    path('workshop/connection-requests/<int:pk>/accept/', AcceptConnectionRequestView.as_view(), name='accept-connection'),
    path('workshop/connection-requests/<int:pk>/reject/', RejectConnectionRequestView.as_view(), name='reject-connection'),
    path('workshop/connection-requests/<int:pk>/cancel/', CancelConnectionRequestView.as_view(), name='cancel-connection'),
    
    # Mechanic Assignment
    path('workshop/my-mechanics/', WorkshopMechanicsView.as_view(), name='workshop-my-mechanics'),
    path('execution/<int:pk>/assign/', AssignMechanicView.as_view(), name='assign-mechanic'),
    path('execution/<int:pk>/remove/', RemoveMechanicView.as_view(), name='remove-mechanic'),
    # Mechanic assigned services
    path('mechanic/assigned-services/', MechanicAssignedServicesView.as_view(), name='mechanic-assigned-services'),
    
    # Estimate Management
    path('connection/<int:connection_id>/estimates/', ListEstimatesView.as_view(), name='list-estimates'),
    path('connection/<int:connection_id>/estimates/create/', CreateEstimateView.as_view(), name='create-estimate'),
    path('estimates/<int:estimate_id>/', GetEstimateView.as_view(), name='get-estimate'),
    path('estimates/<int:estimate_id>/update/', UpdateEstimateView.as_view(), name='update-estimate'),
    path('estimates/<int:estimate_id>/send/', SendEstimateView.as_view(), name='send-estimate'),
    path('estimates/<int:estimate_id>/approve/', ApproveEstimateView.as_view(), name='approve-estimate'),
    path('estimates/<int:estimate_id>/reject/', RejectEstimateView.as_view(), name='reject-estimate'),
    path('estimates/<int:estimate_id>/resend/', ResendEstimateView.as_view(), name='resend-estimate'),
    path('estimates/<int:estimate_id>/delete/', DeleteEstimateView.as_view(), name='delete-estimate'),
    # Service OTP (workshop/mechanic generates, user verifies)
    path('execution/<int:pk>/generate-otp/', GenerateServiceOTPView.as_view(), name='generate-service-otp'),
    path('execution/<int:pk>/verify-otp/', VerifyServiceOTPView.as_view(), name='verify-service-otp'),
]

from django.urls import path
from .views import (
    CreateServiceRequestView, 
    ServiceRequestDetailView, 
    UserServiceRequestListView,
    ConnectWorkshopView,
    WorkshopRequestListView,
    UpdateServiceRequestStatusView
)

urlpatterns = [
    path('create/', CreateServiceRequestView.as_view(), name='service-request-initiation'),
    path('<int:pk>/nearby/', ServiceRequestDetailView.as_view(), name='request-nearby'),
    path('my-requests/', UserServiceRequestListView.as_view(), name='user-requests-list'),
    path('<int:pk>/connect/', ConnectWorkshopView.as_view(), name='request-connect'),
    path('workshop/requests/', WorkshopRequestListView.as_view(), name='workshop-requests-list'),
    path('<int:pk>/update-status/', UpdateServiceRequestStatusView.as_view(), name='request-status-update'),
]

from django.urls import path
from .views import CreateServiceRequestView, ServiceRequestDetailView

urlpatterns = [
    path('create/', CreateServiceRequestView.as_view(), name='service-request-initiation'),
    path('<int:pk>/nearby/', ServiceRequestDetailView.as_view(), name='request-nearby'),
]

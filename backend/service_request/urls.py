from django.urls import path
from .views import CreateServiceRequestView

urlpatterns = [
    path('create/', CreateServiceRequestView.as_view(), name='service-request-initiation')
]

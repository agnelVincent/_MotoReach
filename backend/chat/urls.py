from django.urls import path
from .views import ChatImageUploadView


urlpatterns = [
    path('upload-image/<int:service_request_id>/', ChatImageUploadView.as_view(), name='chat-image-upload'),
]

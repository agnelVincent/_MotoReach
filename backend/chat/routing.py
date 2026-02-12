from django.urls import re_path

from . import consumers


websocket_urlpatterns = [
    # Per-service-request chat between user and workshop admin
    re_path(
        r"ws/chat/(?P<service_request_id>\d+)/$",
        consumers.ChatConsumer.as_asgi(),
        name="chat_ws",
    ),
    # Per-user notification stream for unread chat messages
    re_path(
        r"ws/notifications/$",
        consumers.NotificationConsumer.as_asgi(),
        name="notifications_ws",
    ),
]


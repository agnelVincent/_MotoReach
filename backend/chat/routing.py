from django.urls import re_path

from . import consumers


websocket_urlpatterns = [
    re_path(
        r"ws/chat/(?P<service_request_id>\d+)/$",
        consumers.ChatConsumer.as_asgi(),
        name="chat_ws",
    ),
    re_path(
        r"ws/service-flow/(?P<service_request_id>\d+)/$",
        consumers.ServiceFlowConsumer.as_asgi(),
        name="service_flow_ws",
    ),
    re_path(
        r"ws/notifications/$",
        consumers.NotificationConsumer.as_asgi(),
        name="notifications_ws",
    ),
]


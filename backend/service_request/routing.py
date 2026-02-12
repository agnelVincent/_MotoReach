from django.urls import re_path

from . import consumers


websocket_urlpatterns = [
    # Chat between user and workshop for a specific service request
    re_path(r'ws/service-chat/(?P<service_request_id>\d+)/$', consumers.ChatConsumer.as_asgi()),

    # Per-user / per-workshop notifications (unread counts, new message badges, etc.)
    re_path(r'ws/notifications/$', consumers.NotificationsConsumer.as_asgi()),
]


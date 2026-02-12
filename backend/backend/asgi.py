"""
ASGI config for backend project with Django Channels support.

This configuration routes HTTP traffic to the standard Django ASGI
application and WebSocket traffic through Django Channels.
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django_asgi_app = get_asgi_application()

import chat.routing  # noqa: E402
from chat.middleware import JWTAuthMiddleware  # noqa: E402


def JWTAuthMiddlewareStack(inner):
    """
    Simple wrapper that applies JWT authentication on top of the
    default AuthMiddlewareStack for WebSocket connections.
    """
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))


application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            JWTAuthMiddlewareStack(
                URLRouter(chat.routing.websocket_urlpatterns)
            )
        ),
    }
)

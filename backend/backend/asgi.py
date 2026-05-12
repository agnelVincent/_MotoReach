"""
ASGI config for backend project with Django Channels support.

This configuration routes HTTP traffic to the standard Django ASGI
application and WebSocket traffic through Django Channels.

Note: AllowedHostsOriginValidator is intentionally NOT used here.
In channels 4.3.x it has a bug (passes raw str to match_allowed_origin
which expects a ParseResult), causing every WebSocket to be rejected
with 403 regardless of ALLOWED_HOSTS. Security is enforced by:
  1. JWTAuthMiddleware  — closes unauthenticated connections
  2. Consumer.connect() — re-validates user + permissions per endpoint
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter

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
    return AuthMiddlewareStack(JWTAuthMiddleware(inner))


application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddlewareStack(
            URLRouter(chat.routing.websocket_urlpatterns)
        ),
    }
)

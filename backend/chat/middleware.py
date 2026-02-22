from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication


User = get_user_model()


@database_sync_to_async
def _get_user_from_token(token: str):
    jwt_auth = JWTAuthentication()
    validated_token = jwt_auth.get_validated_token(token)
    return jwt_auth.get_user(validated_token)


class JWTAuthMiddleware:

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)

        token_list = query_params.get("token")
        if token_list:
            token = token_list[0]
            try:
                user = await _get_user_from_token(token)
                scope["user"] = user
            except Exception:
                # Invalid or expired tokens fall back to AnonymousUser if previously set, or stay as is
                pass

        return await self.inner(scope, receive, send)


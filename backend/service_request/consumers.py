import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import ServiceRequest, WorkshopConnection, ServiceExecution, ServiceMessage
from .serializers import ServiceMessageSerializer
from rest_framework_simplejwt.tokens import AccessToken


User = get_user_model()


class BaseJWTConsumer(AsyncWebsocketConsumer):
    """
    Base consumer that supports authenticating a user either via the standard
    Django session (scope['user']) or via a JWT access token passed as a
    `token` query parameter.
    """

    async def get_authenticated_user(self):
        user = self.scope.get("user")
        if user and getattr(user, "is_authenticated", False):
            return user

        # Fallback to JWT token passed as query param: ?token=<access_token>
        query_string = self.scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        tokens = params.get("token") or params.get("access") or []
        if not tokens:
            return None

        token_str = tokens[0]

        try:
            access_token = AccessToken(token_str)
            user_id = access_token.get("user_id")
        except Exception as e:
            print("JWT ERROR:", e)
            return None


        if not user_id:
            return None

        return await self._get_user_by_id(user_id)

    @database_sync_to_async
    def _get_user_by_id(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None


class ChatConsumer(BaseJWTConsumer):
    """
    WebSocket consumer handling real-time chat between a user and the workshop
    team for a specific service request.

    Connection URL: ws/service-chat/<service_request_id>/
    """

    async def connect(self):
        user = await self.get_authenticated_user()
        if not user:
            await self.close(code=4401)  # Unauthorized
            return

        self.user = user

        self.service_request_id = self.scope["url_route"]["kwargs"]["service_request_id"]
        self.room_group_name = f"service_chat_{self.service_request_id}"

        can_join = await self._user_can_access_room(user, self.service_request_id)
        if not can_join:
            await self.close(code=4403)  # Forbidden
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        user = getattr(self, "user", None)
        if not user:
            await self.close(code=4401)
            return

        if not text_data:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        content = (data.get("content") or "").strip()
        if not content:
            return

        message = await self._create_message(
            user=user,
            service_request_id=self.service_request_id,
            content=content,
        )

        if not message:
            return

        serialized = ServiceMessageSerializer(message).data

        # Send to chat room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": serialized,
            },
        )

        # Send notification updates to relevant parties
        await self._send_notification_updates(message)

    async def chat_message(self, event):
        """
        Handler for messages sent to the group from REST or other sockets.
        """
        await self.send(text_data=json.dumps(event["message"]))

    # ---------------------------------------------------------------------
    # Database helpers
    # ---------------------------------------------------------------------

    @database_sync_to_async
    def _user_can_access_room(self, user, service_request_id: str) -> bool:
        try:
            service_request = ServiceRequest.objects.get(id=service_request_id)
        except ServiceRequest.DoesNotExist:
            return False

        if user.role == "user":
            return service_request.user_id == user.id

        if user.role == "workshop_admin":
            workshop = getattr(user, "workshop", None)
            if not workshop:
                return False
            # Check if workshop has an active connection or execution for this request
            return WorkshopConnection.objects.filter(
                service_request=service_request,
                workshop=workshop,
                status='ACCEPTED'
            ).exists() or ServiceExecution.objects.filter(
                service_request=service_request,
                workshop=workshop
            ).exists()

        return False

    @database_sync_to_async
    def _create_message(self, user, service_request_id: str, content: str):
        try:
            service_request = ServiceRequest.objects.get(id=service_request_id)
        except ServiceRequest.DoesNotExist:
            return None

        if user.role == "user":
            return ServiceMessage.objects.create(
                service_request=service_request,
                sender_type='USER',
                sender_user=user,
                sender_workshop=None,
                content=content,
                read_by_user=True,  # User's own message is read by them
                read_by_workshop=False,
            )
        elif user.role == "workshop_admin":
            workshop = getattr(user, "workshop", None)
            if not workshop:
                return None
            return ServiceMessage.objects.create(
                service_request=service_request,
                sender_type='WORKSHOP',
                sender_user=None,
                sender_workshop=workshop,
                content=content,
                read_by_user=False,
                read_by_workshop=True,  # Workshop's own message is read by them
            )
        else:
            return None

    @database_sync_to_async
    def _send_notification_updates(self, message):
        """Send unread count updates to user and workshop notification groups"""
        from .views import UnreadMessagesSummaryView
        
        # Get updated unread summaries for both parties
        service_request = message.service_request
        
        # Send to user notification group
        user_group_name = f"notifications_user_{service_request.user_id}"
        user_summary = UnreadMessagesSummaryView._get_unread_summary_for_user(service_request.user)
        
        if user_summary:
            await self.channel_layer.group_send(
                user_group_name,
                {
                    "type": "notification.message",
                    "event": "notifications.update",
                    "data": user_summary
                }
            )
        
        # Send to workshop notification group if workshop is connected
        try:
            # Find the connected workshop
            connection = WorkshopConnection.objects.filter(
                service_request=service_request,
                status='ACCEPTED'
            ).first()
            
            if connection:
                workshop_group_name = f"notifications_workshop_{connection.workshop_id}"
                workshop_summary = UnreadMessagesSummaryView._get_unread_summary_for_workshop(connection.workshop)
                
                if workshop_summary:
                    await self.channel_layer.group_send(
                        workshop_group_name,
                        {
                            "type": "notification.message",
                            "event": "notifications.update", 
                            "data": workshop_summary
                        }
                    )
        except Exception:
            pass  # If no workshop connected, skip


class NotificationsConsumer(BaseJWTConsumer):
    """
    Lightweight notifications channel for unread message counts / badges.

    Connection URL: ws/notifications/
    - For normal users, attaches to group "notifications_user_<user_id>"
    - For workshop admins, attaches to group "notifications_workshop_<workshop_id>"
    """

    async def connect(self):
        user = await self.get_authenticated_user()
        if not user:
            await self.close(code=4401)
            return

        self.user = user

        group_name = await self._resolve_group_name(user)
        if not group_name:
            await self.close(code=4403)
            return

        self.group_name = group_name

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notification_message(self, event):
        """
        Generic passthrough for notification events coming from REST layer.
        """
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def _resolve_group_name(self, user) -> str | None:
        if user.role == "user":
            return f"notifications_user_{user.id}"

        if user.role == "workshop_admin":
            workshop = getattr(user, "workshop", None)
            if not workshop:
                return None
            return f"notifications_workshop_{workshop.id}"

        return None


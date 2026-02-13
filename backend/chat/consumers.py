from typing import Any, Dict, List, Tuple
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model

from service_request.models import ServiceRequest, WorkshopConnection
from .models import ChatMessage


User = get_user_model()


@database_sync_to_async
def _get_service_request(service_request_id: int) -> ServiceRequest | None:
    try:
        return ServiceRequest.objects.get(pk=service_request_id)
    except ServiceRequest.DoesNotExist:
        return None


@database_sync_to_async
def _user_has_active_connection(user: User, service_request: ServiceRequest) -> bool:
    """
    Check that the given user is either the service request owner or the
    connected workshop admin for this request, and that the connection
    is active (not cancelled / expired).
    """
    if service_request.status in ["EXPIRED", "CANCELLED"]:
        return False

    # Primary user on the request
    if service_request.user_id == user.id:
        return WorkshopConnection.objects.filter(
            service_request=service_request,
            status="ACCEPTED",
        ).exists()

    # Workshop admin side
    if user.role == "workshop_admin" and hasattr(user, "workshop"):
        return WorkshopConnection.objects.filter(
            service_request=service_request,
            workshop=user.workshop,
            status="ACCEPTED",
        ).exists()

    return False


@database_sync_to_async
def _get_chat_history(
    service_request: ServiceRequest, limit: int = 50
) -> List[Dict[str, Any]]:
    messages = (
        ChatMessage.objects.filter(service_request=service_request)
        .select_related("sender")
        .order_by("-created_at")[:limit]
    )
    # Return in chronological order
    messages = list(reversed(messages))

    return [
        {
            "id": m.id,
            "service_request_id": m.service_request_id,
            "sender_id": m.sender_id,
            "sender_name": m.sender.full_name,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


@database_sync_to_async
def _create_message(
    user: User, service_request: ServiceRequest, content: str
) -> Tuple[Dict[str, Any], int]:
    """
    Persist a new chat message and return its serialized representation
    plus the receiver's user ID.
    """
    # Validate that there is an active accepted connection
    connection = WorkshopConnection.objects.filter(
        service_request=service_request,
        status="ACCEPTED",
    ).first()

    if not connection:
        raise PermissionError("No active connection for this service request.")

    if user.id == service_request.user_id:
        receiver = connection.workshop.user
    elif user.role == "workshop_admin" and hasattr(user, "workshop"):
        if connection.workshop_id != user.workshop.id:
            raise PermissionError("Not authorized for this service request.")
        receiver = service_request.user
    else:
        raise PermissionError("Not authorized for this service request.")

    if service_request.status in ["EXPIRED", "CANCELLED"]:
        raise PermissionError("Service request is no longer active.")

    msg = ChatMessage.objects.create(
        service_request=service_request,
        sender=user,
        receiver=receiver,
        content=content,
    )

    data = {
        "id": msg.id,
        "service_request_id": msg.service_request_id,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender.full_name,
        "content": msg.content,
        "created_at": msg.created_at.isoformat(),
    }
    return data, receiver.id


@database_sync_to_async
def _mark_messages_as_read(user: User, service_request: ServiceRequest) -> None:
    ChatMessage.objects.filter(
        service_request=service_request,
        receiver=user,
        is_read=False,
    ).update(is_read=True)


def _build_unread_summary_item_sync(
    receiver: User, service_request: ServiceRequest
) -> Dict[str, Any]:
    """
    Build a notification summary item for a single service request:
    how many unread messages the receiver has and who the counterpart is.
    """
    unread_qs = ChatMessage.objects.filter(
        service_request=service_request,
        receiver=receiver,
        is_read=False,
    ).select_related("sender", "service_request__user")

    count = unread_qs.count()
    if count == 0:
        return {
            "service_request_id": service_request.id,
            "unread_count": 0,
            "counterpart_name": "",
        }

    # Use the last sender as the counterpart for display
    last_msg = unread_qs.order_by("-created_at").first()
    counterpart_name = last_msg.sender.full_name

    return {
        "service_request_id": service_request.id,
        "unread_count": count,
        "counterpart_name": counterpart_name,
    }


@database_sync_to_async
def _build_unread_summary_item(
    receiver: User, service_request: ServiceRequest
) -> Dict[str, Any]:
    """
    Async wrapper around the sync summary builder for a single service request.
    """
    return _build_unread_summary_item_sync(receiver, service_request)


@database_sync_to_async
def _get_unread_summaries_for_user(user: User) -> List[Dict[str, Any]]:
    """
    Aggregate unread messages per service request for a given user.
    """
    service_request_ids = (
        ChatMessage.objects.filter(receiver=user, is_read=False)
        .values_list("service_request_id", flat=True)
        .distinct()
    )
    summaries: List[Dict[str, Any]] = []
    for sr_id in service_request_ids:
        try:
            sr = ServiceRequest.objects.get(pk=sr_id)
        except ServiceRequest.DoesNotExist:
            continue
        item = _build_unread_summary_item_sync(user, sr)
        summaries.append(item)
    return summaries


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer handling real-time chat for a single ServiceRequest.
    """

    async def connect(self):
        self.service_request_id = int(
            self.scope["url_route"]["kwargs"]["service_request_id"]
        )
        self.room_group_name = f"chat_{self.service_request_id}"

        user: User = self.scope.get("user")  # type: ignore[assignment]
        if not user or not user.is_authenticated:
            await self.close()
            return

        service_request = await _get_service_request(self.service_request_id)
        if not service_request:
            await self.close()
            return

        allowed = await _user_has_active_connection(user, service_request)
        if not allowed:
            await self.close()
            return

        self.service_request = service_request

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Send recent history on connect
        history = await _get_chat_history(service_request)
        await self.send_json({"type": "chat.history", "messages": history})

        # Mark messages as read for this user once they open the chat
        await _mark_messages_as_read(user, service_request)
        await self._notify_unread_update(user)

    async def disconnect(self, code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content: Dict[str, Any], **kwargs):
        msg_type = content.get("type")
        user: User = self.scope.get("user")  # type: ignore[assignment]

        if msg_type == "message":
            raw_message = (content.get("message") or "").strip()
            if not raw_message:
                return

            try:
                message_data, receiver_id = await _create_message(
                    user, self.service_request, raw_message
                )
            except PermissionError:
                # Silently close or notify client about invalid state
                await self.send_json(
                    {"type": "chat.error", "message": "Chat not available."}
                )
                return

            # Broadcast to everyone in this chat room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat.message",
                    "message": message_data,
                },
            )

            # Push notification to receiver
            await self._send_notification_to_user(receiver_id)

        elif msg_type == "mark_read":
            await _mark_messages_as_read(user, self.service_request)
            await self._notify_unread_update(user)

    async def chat_message(self, event: Dict[str, Any]):
        await self.send_json({"type": "chat.message", "message": event["message"]})

    async def _send_notification_to_user(self, user_id: int):
        """
        Send an updated unread-count notification for this service request
        to the given user via their notification group.
        """
        sr = self.service_request
        try:
            receiver = await database_sync_to_async(User.objects.get)(pk=user_id)
        except User.DoesNotExist:
            return

        summary = await _build_unread_summary_item(receiver, sr)
        group_name = f"notifications_user_{user_id}"

        await self.channel_layer.group_send(
            group_name,
            {
                "type": "notification.update",
                "item": summary,
            },
        )

    async def _notify_unread_update(self, user: User):
        """
        Convenience method to refresh unread count for the current user
        and service request.
        """
        summary = await _build_unread_summary_item(user, self.service_request)
        group_name = f"notifications_user_{user.id}"
        await self.channel_layer.group_send(
            group_name,
            {
                "type": "notification.update",
                "item": summary,
            },
        )


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    Per-user notification stream for unread chat messages.
    """

    async def connect(self):
        user: User = self.scope.get("user")  # type: ignore[assignment]
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.user = user
        self.user_group_name = f"notifications_user_{user.id}"

        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
        await self.accept()

        # Send initial unread summary on connect
        summaries = await _get_unread_summaries_for_user(user)
        await self.send_json(
            {
                "type": "notifications.initial",
                "items": summaries,
            }
        )

    async def disconnect(self, code):
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def notification_update(self, event: Dict[str, Any]):
        """
        Receive updates from chat consumers and forward to the connected client.
        """
        await self.send_json(
            {
                "type": "notifications.update",
                "item": event["item"],
            }
        )


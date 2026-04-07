from typing import Any, Dict, List, Tuple
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from django.db import DatabaseError
from service_request.models import ServiceRequest, WorkshopConnection
from .models import ChatMessage, ChatMessageRecipient


User = get_user_model()


@database_sync_to_async
def _user_can_subscribe_service_flow(user: User, service_request_id: int) -> bool:
    try:
        sr = ServiceRequest.objects.get(pk=service_request_id)
    except ServiceRequest.DoesNotExist:
        return False
    except DatabaseError:
        return False

    try:
        if sr.user_id == user.id:   
            return True
        if user.role == "workshop_admin" and hasattr(user, "workshop"):
            if WorkshopConnection.objects.filter(
                service_request=sr, workshop=user.workshop, status="ACCEPTED"
            ).exists():
                return True
        if user.role == "mechanic" and hasattr(user, "mechanic"):
            if hasattr(sr, "execution") and sr.execution:
                return sr.execution.mechanics.filter(user=user).exists()
    except DatabaseError as e:
        print('came from checking user subscribe service flow', e)
        return False
    return False


@database_sync_to_async
def _get_service_request(service_request_id: int) -> ServiceRequest | None:
    try:
        return ServiceRequest.objects.get(pk=service_request_id)
    except ServiceRequest.DoesNotExist:
        return None
    except DatabaseError as e:
        print('came from getting service request', e)
        return None


@database_sync_to_async
def _user_has_active_connection(user: User, service_request: ServiceRequest) -> bool:
    if service_request.status in ["EXPIRED", "CANCELLED"]:
        return False
    
    try:

        if service_request.user_id == user.id:
            return WorkshopConnection.objects.filter(
                service_request=service_request,
                status="ACCEPTED",
            ).exists()

        if user.role == "workshop_admin" and hasattr(user, "workshop"):
            return WorkshopConnection.objects.filter(
                service_request=service_request,
                workshop=user.workshop,
                status="ACCEPTED",
            ).exists()
        
        if user.role == "mechanic" and hasattr(user, "mechanic"):
            if hasattr(service_request, "execution") and service_request.execution:
                return service_request.execution.mechanics.filter(user=user).exists()
    
    except DatabaseError as e:
        print('came from user active connection', e)
        return False

    return False


@database_sync_to_async
def _get_chat_history(
    service_request: ServiceRequest, limit: int = 50, before_id: int | None = None
) -> List[Dict[str, Any]]:
    
    try:
        qs = ChatMessage.objects.filter(service_request=service_request).select_related("sender")
        if before_id is not None:
            qs = qs.filter(id__lt=before_id)
        messages = list(reversed(list(qs.order_by("-id")[:limit])))
    
    except DatabaseError as e:
        print(e)
        return []

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
    
    try:
        connection = WorkshopConnection.objects.filter(
            service_request=service_request,
            status="ACCEPTED",
        ).first()

    except DatabaseError as e:
        print(e)
        raise PermissionError("Cannot verify connection at this moment")
    
    if not connection:
        raise PermissionError('No active connection for this service')


    if service_request.status in ["EXPIRED", "CANCELLED"]:
        raise PermissionError("Service request is no longer active.")

    try:
        msg = ChatMessage.objects.create(
            service_request=service_request,
            sender=user,
            content=content,
        )

        participants = []

        if service_request.user:
            participants.append(service_request.user)

        if hasattr(connection.workshop, 'user'):
            participants.append(connection.workshop.user)

        if hasattr(service_request, "execution") and service_request.execution:
            for mechanic in service_request.execution.mechanics.all():
                if hasattr(mechanic, 'user'):
                    participants.append(mechanic.user)

        receiver_ids = []

        for p in set(participants):
            if p.id != user.id:
                ChatMessageRecipient.objects.create(message=msg, user=p, is_read=False)
                receiver_ids.append(p.id)

    except DatabaseError as e:
        print(e)
        raise PermissionError('Failed to create message at this time')

    data = {
        "id": msg.id,
        "service_request_id": msg.service_request_id,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender.full_name,
        "content": msg.content,
        "created_at": msg.created_at.isoformat(),
    }
    return data, receiver_ids


@database_sync_to_async
def _mark_messages_as_read(user: User, service_request: ServiceRequest) -> None:
    try:
        ChatMessageRecipient.objects.filter(
            message__service_request = service_request,
            user = user,
            is_read = False,
        ).update(is_read = True)
    except DatabaseError as e:
        print('happened while marking as read',e)


def _build_unread_summary_item_sync(
    receiver: User, service_request: ServiceRequest
) -> Dict[str, Any]:
    
    unread_qs = ChatMessageRecipient.objects.filter(
        message__service_request=service_request,
        user=receiver,
        is_read=False,
    ).select_related("message__sender")

    count = unread_qs.count()
    if count == 0:
        return {
            "service_request_id": service_request.id,
            "unread_count": 0,
            "counterpart_name": "",
        }


    last_receipt = unread_qs.order_by("-message__created_at").first()
    counterpart_name = last_receipt.message.sender.full_name

    return {
        "service_request_id": service_request.id,
        "unread_count": count,
        "counterpart_name": counterpart_name,
    }


@database_sync_to_async
def _build_unread_summary_item(
    receiver: User, service_request: ServiceRequest
) -> Dict[str, Any]:
    return _build_unread_summary_item_sync(receiver, service_request)


@database_sync_to_async
def _get_unread_summaries_for_user(user: User) -> List[Dict[str, Any]]:
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

    async def connect(self):
        self.service_request_id = int(
            self.scope["url_route"]["kwargs"]["service_request_id"]
        )
        self.room_group_name = f"chat_{self.service_request_id}"

        user: User = self.scope.get("user")  
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

        history = await _get_chat_history(service_request)
        await self.send_json({"type": "chat.history", "messages": history})

        await _mark_messages_as_read(user, service_request)
        await self._notify_unread_update(user)

    async def disconnect(self, code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content: Dict[str, Any], **kwargs):
        msg_type = content.get("type")
        user: User = self.scope.get("user") 

        if msg_type == "message":
            raw_message = (content.get("message") or "").strip()
            if not raw_message:
                return

            try:
                message_data, receiver_ids = await _create_message(
                    user, self.service_request, raw_message
                )
            except PermissionError:
                await self.send_json(
                    {"type": "chat.error", "message": "Chat not available."}
                )
                return

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat.message",
                    "message": message_data,
                },
            )

            for rid in receiver_ids:
                await self._send_notification_to_user(rid)

        elif msg_type == "fetch_history":

            before_id = content.get("before_id")
            if before_id is None:
                return
            older_messages = await _get_chat_history(
                self.service_request, limit=50, before_id=int(before_id)
            )

            await self.send_json({
                "type": "chat.history_page",
                "messages": older_messages,
                "has_more": len(older_messages) == 50,
            })

        elif msg_type == "mark_read":
            await _mark_messages_as_read(user, self.service_request)
            await self._notify_unread_update(user)

    async def chat_message(self, event: Dict[str, Any]):
        await self.send_json({"type": "chat.message", "message": event["message"]})

    async def _send_notification_to_user(self, user_id: int):

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


class ServiceFlowConsumer(AsyncJsonWebsocketConsumer):


    async def connect(self):
        try:
            self.service_request_id = int(
                self.scope["url_route"]["kwargs"]["service_request_id"]
            )
        except (KeyError, TypeError, ValueError):
            await self.close()
            return

        user: User = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close()
            return

        allowed = await _user_can_subscribe_service_flow(user, self.service_request_id)
        if not allowed:
            await self.close()
            return

        self.room_group_name = f"service_flow_{self.service_request_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

    async def service_flow_update(self, event: Dict[str, Any]):

        await self.send_json({
            "type": "service_flow.update",
            "event": event.get("event", "update"),
        })


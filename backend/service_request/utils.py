from django.utils import timezone
from payments.utils import check_and_process_refund
from math import radians, cos, sin, asin, sqrt
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from chat.models import ChatMessageRecipient
from service_request.models import WorkshopConnection, ServiceExecution
import logging
from accounts.models import Workshop


logger = logging.getLogger(__name__)

def notify_service_flow_update(service_request_id: int, event: str = "update") -> None:

    def send_notification():
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                logger.warning("Channel layer not configured. Notification skipped.")
                return

            async_to_sync(channel_layer.group_send)(
                f"service_flow_{service_request_id}",
                {"type": "service_flow.update", "event": event},
            )
            logger.info(f"Service flow update notification sent for ServiceRequest #{service_request_id}, event: {event}")

        except Exception as e:
            logger.exception(f"Failed to send service flow update notification for ServiceRequest #{service_request_id}")

    transaction.on_commit(send_notification)


def push_connection_count_to_workshop(workshop_user_id: int) -> None:

    def send():
        try:
            count = WorkshopConnection.objects.filter(
                workshop__user_id=workshop_user_id,
                status='REQUESTED'
            ).count()

            channel_layer = get_channel_layer()
            if not channel_layer:
                logger.warning(f"Channel layer not configured. Cannot push connection count for workshop_user_id {workshop_user_id}.")
                return

            async_to_sync(channel_layer.group_send)(
                f'notifications_user_{workshop_user_id}',
                {'type': 'connection_count.update', 'count': count}
            )

            logger.info(f"Pushed connection count ({count}) to workshop_user_id {workshop_user_id}")

        except Exception as e:
            logger.exception(f"Failed to push connection count for workshop_user_id {workshop_user_id}")

    transaction.on_commit(send)



def push_assigned_task_count_to_mechanic(mechanic_user_id: int) -> None:

    def send():
        service_status = [
            'CONNECTED', 'ESTIMATE_SHARED',
            'SERVICE_AMOUNT_PAID', 'IN_PROGRESS'
        ]

        try:
            count = ServiceExecution.objects.filter(
                mechanics__user_id=mechanic_user_id,
                service_request__status__in=service_status
            ).count()

            channel_layer = get_channel_layer()
            if not channel_layer:
                logger.warning(f"Channel layer not configured. Cannot push assigned task count for mechanic_user_id {mechanic_user_id}.")
                return

            async_to_sync(channel_layer.group_send)(
                f'notifications_user_{mechanic_user_id}',
                {'type': 'assigned_task_count.update', 'count': count}
            )

            logger.info(f"Pushed assigned task count ({count}) to mechanic_user_id {mechanic_user_id}")

        except Exception as e:
            logger.exception(f"Failed to push assigned task count for mechanic_user_id {mechanic_user_id}")

    transaction.on_commit(send)




def calculate_distance(lat1, long1, lat2, long2):
    if lat1 is None or long1 is None or lat2 is None or long2 is None:
        return float('inf')
    
    try:
        lat1, long1, lat2, long2 = map(float, [lat1, long1, lat2, long2])
    except ValueError:
        return float('inf')
    
    R = 6371 
    dlat = radians(lat2 - lat1)
    dlong = radians(long2 - long1)
    a = sin(dlat/2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlong/2)**2
    c = 2 * asin(sqrt(a))
    
    return R * c

def get_nearby_workshops(user_lat, user_lon, radius_km=20):
    if user_lat is None or user_lon is None:
        logger.warning("Latitude or longitude not provided. Returning empty list.")
        return []

    try:
        user_lat = float(user_lat)
        user_lon = float(user_lon)
    except (ValueError, TypeError) as e:
        logger.warning(f"Invalid latitude or longitude values: {e}")
        return []

    try:
        lat_change = radius_km / 111.0
        lon_change = 360 if abs(user_lat) > 89 else radius_km / (111.0 * abs(cos(radians(user_lat))))

        min_lat, max_lat = user_lat - lat_change, user_lat + lat_change
        min_lon, max_lon = user_lon - lon_change, user_lon + lon_change

        candidates = Workshop.objects.filter(
            verification_status='APPROVED',
            latitude__range=(min_lat, max_lat),
            longitude__range=(min_lon, max_lon)
        ).exclude(latitude__isnull=True)

        nearby_workshops = []
        for ws in candidates:
            dist = calculate_distance(user_lat, user_lon, ws.latitude, ws.longitude)
            if dist <= radius_km:
                ws.distance = round(dist, 2)
                nearby_workshops.append(ws)

        nearby_workshops.sort(key=lambda x: x.distance)
        return nearby_workshops

    except Exception as e:
        logger.exception("Failed to fetch nearby workshops")
        return []


def check_request_expiration(service_request):

    if service_request.status in ['COMPLETED', 'CANCELLED', 'EXPIRED', 'VERIFIED']:
        return False

    if not service_request.expires_at or service_request.expires_at >= timezone.now():
        return False

    try:
        is_refunded, msg = check_and_process_refund(service_request)
        if is_refunded:
            logger.info(f"Refund processed for ServiceRequest #{service_request.id}: {msg}")
        else:
            logger.warning(f"Refund failed or not applicable for ServiceRequest #{service_request.id}: {msg}")

        service_request.status = 'EXPIRED'
        service_request.save()

        # Mark chat messages as read
        ChatMessageRecipient.objects.filter(
            message__service_request=service_request,
            is_read=False
        ).update(is_read=True)

        notify_service_flow_update(service_request.id)

        try:
            execution = service_request.execution
            if execution:
                for mechanic in execution.mechanics.all():
                    mechanic.availability = 'AVAILABLE'
                    mechanic.save()
                execution.delete()
        except ServiceExecution.DoesNotExist:
            logger.warning(f"No execution found for expired ServiceRequest #{service_request.id}")

        return True

    except Exception as e:
        logger.exception(f"Error while processing expiration for ServiceRequest #{service_request.id}")
        return False
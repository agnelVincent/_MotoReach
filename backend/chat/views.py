import cloudinary.uploader
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from service_request.models import ServiceRequest, WorkshopConnection
from .models import ChatMessage, ChatMessageRecipient
from django.contrib.auth import get_user_model
import logging
from django.db import DatabaseError

logger = logging.getLogger(__name__)

User = get_user_model()


class ChatImageUploadView(APIView):

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, service_request_id):

        user = request.user

        logger.info(
            "Chat image upload initiated. "
            "user_id=%s service_request_id=%s",
            user.id,
            service_request_id
        )

        image_file = request.FILES.get('image')

        # =========================================================
        # Validate image existence
        # =========================================================
        if not image_file:

            logger.warning(
                "No image provided in chat upload request. "
                "user_id=%s service_request_id=%s",
                user.id,
                service_request_id
            )

            return Response(
                {'error': 'No image provided.'},
                status=400
            )

        # =========================================================
        # Validate content type
        # =========================================================
        if not image_file.content_type.startswith('image/'):

            logger.warning(
                "Invalid file type uploaded in chat. "
                "user_id=%s service_request_id=%s",
                user.id,
                service_request_id
            )

            return Response(
                {'error': 'File must be an image.'},
                status=400
            )

        # =========================================================
        # Validate file size
        # =========================================================
        MAX_SIZE = 5 * 1024 * 1024

        if image_file.size > MAX_SIZE:

            logger.warning(
                "Chat image exceeds size limit. "
                "user_id=%s service_request_id=%s",
                user.id,
                service_request_id
            )

            return Response(
                {'error': 'Image must be under 5 MB.'},
                status=400
            )

        # =========================================================
        # Fetch Service Request
        # =========================================================
        try:
            sr = ServiceRequest.objects.get(
                pk=service_request_id
            )

        except ServiceRequest.DoesNotExist:

            logger.warning(
                "ServiceRequest not found for chat image "
                "upload. service_request_id=%s",
                service_request_id
            )

            return Response(
                {'error': 'Service request not found.'},
                status=404
            )

        except Exception:

            logger.exception(
                "Unexpected error while fetching "
                "ServiceRequest for chat upload. "
                "service_request_id=%s",
                service_request_id
            )

            return Response(
                {'error': 'Failed to fetch service request.'},
                status=500
            )

        # =========================================================
        # Authorization check
        # =========================================================
        if not self._user_can_chat(user, sr):

            logger.warning(
                "Unauthorized chat image upload attempt. "
                "user_id=%s service_request_id=%s",
                user.id,
                service_request_id
            )

            return Response(
                {'error': 'Not authorized.'},
                status=403
            )

        # =========================================================
        # Service request status validation
        # =========================================================
        if sr.status in ['EXPIRED', 'CANCELLED']:

            logger.warning(
                "Chat image upload attempted on inactive "
                "service request. service_request_id=%s",
                service_request_id
            )

            return Response(
                {
                    'error': (
                        'Service request is no longer active.'
                    )
                },
                status=403
            )

        # =========================================================
        # Upload image to Cloudinary
        # =========================================================
        try:
            upload_result = cloudinary.uploader.upload(
                image_file,
                folder='chat_images',
                resource_type='image',
            )

            image_url = upload_result['secure_url']

            logger.info(
                "Chat image uploaded successfully to "
                "Cloudinary. service_request_id=%s",
                service_request_id
            )

        except Exception:

            logger.exception(
                "Cloudinary upload failed for chat image. "
                "service_request_id=%s",
                service_request_id
            )

            return Response(
                {'error': 'Failed to upload image.'},
                status=500
            )

        # =========================================================
        # Create Chat Message
        # =========================================================
        try:
            msg = ChatMessage.objects.create(
                service_request=sr,
                sender=user,
                content='',
                image_url=image_url,
                message_type='image',
            )

            logger.info(
                "Chat image message created successfully. "
                "message_id=%s",
                msg.id
            )

        except DatabaseError:

            logger.exception(
                "Database error while creating chat image "
                "message. service_request_id=%s",
                service_request_id
            )

            return Response(
                {'error': 'Failed to save chat message.'},
                status=500
            )

        except Exception:

            logger.exception(
                "Unexpected error while creating chat "
                "image message. service_request_id=%s",
                service_request_id
            )

            return Response(
                {'error': 'Unexpected error occurred.'},
                status=500
            )

        # =========================================================
        # Find participants
        # =========================================================
        try:
            connection = WorkshopConnection.objects.filter(
                service_request=sr,
                status='ACCEPTED'
            ).first()

            participants = []

            if sr.user:
                participants.append(sr.user)

            if (
                connection
                and hasattr(connection.workshop, 'user')
            ):
                participants.append(
                    connection.workshop.user
                )

            if hasattr(sr, 'execution') and sr.execution:

                for mechanic in (
                    sr.execution.mechanics.all()
                ):
                    if hasattr(mechanic, 'user'):
                        participants.append(
                            mechanic.user
                        )

            receiver_ids = []

            for p in set(participants):

                if p.id != user.id:

                    ChatMessageRecipient.objects.create(
                        message=msg,
                        user=p,
                        is_read=False
                    )

                    receiver_ids.append(p.id)

            logger.info(
                "Chat recipients created successfully. "
                "message_id=%s recipient_count=%s",
                msg.id,
                len(receiver_ids)
            )

        except Exception:

            logger.exception(
                "Failed to create chat recipients. "
                "message_id=%s",
                msg.id
            )

        # =========================================================
        # Prepare websocket payload
        # =========================================================
        message_data = {
            'id': msg.id,
            'service_request_id': msg.service_request_id,
            'sender_id': msg.sender_id,
            'sender_name': msg.sender.full_name,
            'content': msg.content,
            'image_url': msg.image_url,
            'message_type': msg.message_type,
            'created_at': msg.created_at.isoformat(),
        }

        # =========================================================
        # Send websocket event
        # =========================================================
        try:
            channel_layer = get_channel_layer()

            async_to_sync(channel_layer.group_send)(
                f'chat_{service_request_id}',
                {
                    'type': 'chat.message',
                    'message': message_data
                }
            )

            logger.info(
                "WebSocket chat image event sent "
                "successfully. message_id=%s",
                msg.id
            )

        except Exception:

            logger.exception(
                "Failed to send WebSocket chat image "
                "event. message_id=%s",
                msg.id
            )

        return Response(message_data, status=201)

    def _user_can_chat(self, user, sr):

        try:
            if sr.user_id == user.id:

                return WorkshopConnection.objects.filter(
                    service_request=sr,
                    status='ACCEPTED'
                ).exists()

            if (
                user.role == 'workshop_admin'
                and hasattr(user, 'workshop')
            ):

                return WorkshopConnection.objects.filter(
                    service_request=sr,
                    workshop=user.workshop,
                    status='ACCEPTED'
                ).exists()

            if (
                user.role == 'mechanic'
                and hasattr(user, 'mechanic')
            ):

                if hasattr(sr, 'execution') and sr.execution:

                    return sr.execution.mechanics.filter(
                        user=user
                    ).exists()

            return False

        except Exception:

            logger.exception(
                "Error while validating chat permission. "
                "user_id=%s service_request_id=%s",
                user.id,
                sr.id
            )

            return False
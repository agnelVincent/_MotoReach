import cloudinary.uploader
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from service_request.models import ServiceRequest, WorkshopConnection
from .models import ChatMessage, ChatMessageRecipient
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatImageUploadView(APIView):

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, service_request_id):
        user = request.user
        image_file = request.FILES.get('image')

        if not image_file:
            return Response({'error': 'No image provided.'}, status=400)

        if not image_file.content_type.startswith('image/'):
            return Response({'error': 'File must be an image.'}, status=400)

        MAX_SIZE = 5 * 1024 * 1024
        if image_file.size > MAX_SIZE:
            return Response({'error': 'Image must be under 5 MB.'}, status=400)
        
        try:
            sr = ServiceRequest.objects.get(pk=service_request_id)
        except ServiceRequest.DoesNotExist:
            return Response({'error': 'Service request not found.'}, status=404)

        if not self._user_can_chat(user, sr):
            return Response({'error': 'Not authorized.'}, status=403)
        
        if sr.status in ['EXPIRED', 'CANCELLED']:
            return Response({'error': 'Service request is no longer active.'}, status=403)


        upload_result = cloudinary.uploader.upload(
            image_file,
            folder='chat_images',     
            resource_type='image',
        )
        image_url = upload_result['secure_url']

        msg = ChatMessage.objects.create(
            service_request=sr,
            sender=user,
            content='',
            image_url=image_url,
            message_type='image',
        )

        connection = WorkshopConnection.objects.filter(
            service_request=sr, status='ACCEPTED'
        ).first()

        participants = []

        if sr.user:
            participants.append(sr.user)

        if connection and hasattr(connection.workshop, 'user'):
            participants.append(connection.workshop.user)

        if hasattr(sr, 'execution') and sr.execution:
            for mechanic in sr.execution.mechanics.all():
                if hasattr(mechanic, 'user'):
                    participants.append(mechanic.user)

        receiver_ids = []
        for p in set(participants):
            if p.id != user.id:
                ChatMessageRecipient.objects.create(message=msg, user=p, is_read=False)
                receiver_ids.append(p.id)

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

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{service_request_id}',
            {'type': 'chat.message', 'message': message_data}
        )


        return Response(message_data, status=201)
    

    def _user_can_chat(self, user, sr):

        if sr.user_id == user.id:
            return WorkshopConnection.objects.filter(
                service_request=sr, status='ACCEPTED'
            ).exists()
        
        if user.role == 'workshop_admin' and hasattr(user, 'workshop'):
            return WorkshopConnection.objects.filter(
                service_request=sr, workshop=user.workshop, status='ACCEPTED'
            ).exists()
        
        if user.role == 'mechanic' and hasattr(user, 'mechanic'):
            if hasattr(sr, 'execution') and sr.execution:
                return sr.execution.mechanics.filter(user=user).exists()
        return False

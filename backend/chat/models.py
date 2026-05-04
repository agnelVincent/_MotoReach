from django.conf import settings
from django.db import models


class ChatMessage(models.Model):

    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text'),
        ('image', 'Image'),
    ]
    service_request = models.ForeignKey(
        "service_request.ServiceRequest",
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_chat_messages",
    )
    content = models.TextField(blank=True, default='')
    image_url = models.URLField(blank=True, default='')
    message_type = models.CharField(
        max_length=10,
        choices=MESSAGE_TYPE_CHOICES,
        default='text'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["service_request", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"[SR#{self.service_request_id}] {self.sender_id} -> {self.receiver_id}: {self.content[:30]}"


class ChatMessageRecipient(models.Model):

    message = models.ForeignKey(
        ChatMessage, 
        on_delete=models.CASCADE, 
        related_name="recipients"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="chat_receipts"
    )

    is_read = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["user", "is_read"]),
        ]

        

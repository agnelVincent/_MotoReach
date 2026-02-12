from django.conf import settings
from django.db import models


class ChatMessage(models.Model):
    """
    Single message in a 1:1 chat between a user and a workshop admin,
    scoped to a specific ServiceRequest.
    """

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
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_chat_messages",
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["service_request", "created_at"]),
            models.Index(fields=["receiver", "is_read"]),
        ]

    def __str__(self) -> str:
        return f"[SR#{self.service_request_id}] {self.sender_id} -> {self.receiver_id}: {self.content[:30]}"

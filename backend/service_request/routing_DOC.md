# 🌐 The Chat Switchboard: Routing.py

This file is like `urls.py` but for WebSockets.

## 🌟 How it Works
When a client (browser) tries to open a WebSocket connection (`ws://...`), Django Channels looks at this file to decide which "Consumer" (Python class) should handle the request.

---

## 🏗 The Routes

### 1. `ws/service-chat/(?P<service_request_id>\d+)/`
- **Purpose**: Connects users to the chat room for specific Service Request.
- **Consumer**: `consumers.ChatConsumer`
- **Example**: `ws://localhost:8000/ws/service-chat/42/` -> Handles chat for Service Request #42.
- **Auth**: Requires a valid JWT token (`?token=XYZ`).

### 2. `ws/notifications/`
- **Purpose**: For receiving real-time alerts (new message badges, status updates).
- **Consumer**: `consumers.NotificationsConsumer`
- **Example**: `ws://localhost:8000/ws/notifications/?token=XYZ` -> Connects to user's personal alert channel.
- **Auth**: Requires a valid JWT token.

---

## 🛠 Important Note

The routes here use Django's `re_path` (Regular Expression Path).
- `(?P<service_request_id>\d+)`: This captures the number (ID) from the URL and passes it to the Consumer as `self.scope['url_route']['kwargs']['service_request_id']`.
- This is critical! Without it, `ChatConsumer` wouldn't know which chat room to join.

---
*Documentation generated for MotoReach Chat Implementation*

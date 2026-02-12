# 🧠 The Brain of the Chat: Consumers

Welcome to `consumers.py`. This is where all the chat magic happens on the server side.

## 🌟 What is a Consumer?
In Django, a **View** handles HTTP requests. In Django Channels (WebSockets), a **Consumer** handles WebSocket connections.
Ideally, it "consumes" events (connect, receive, disconnect) from the WebSocket.

---

## 🏗 The Architecture

This file contains three main classes:

### 1. `BaseJWTConsumer` (The Bouncer)
**"How do we know who you are?"**
- **Problem**: Browsers don't support sending custom `Authorization: Bearer <token>` headers on WebSocket handshakes easily.
- **Solution**: We pass the JWT token in the query string (`ws://...?token=XYZ`).
- **Mechanism**:
    1.  Django's `AuthMiddlewareStack` (in `asgi.py`) tries to find a session cookie. It usually fails for our JWT setup.
    2.  **Fallback**: This class overrides `get_authenticated_user`.
    3.  It parses `self.scope['query_string']` to find `token=...`.
    4.  It decodes the JWT using `rest_framework_simplejwt`.
    5.  If valid, `self.scope['user']` is set to the correct User. If not, the connection is rejected.

### 2. `ChatConsumer` (The Conversation)
This handles the actual chat for a specific Service Request.

- **`connect()`**:
    - **Step 1**: Authenticate (via `BaseJWTConsumer`).
    - **Step 2**: Get `service_request_id` from URL.
    - **Step 3**: Permissions Check (`_user_can_access_room`).
        - Only the Request Owner or the Assigned Workshop Admin can join.
    - **Step 4**: Join Group (`service_chat_<id>`).
    - **Step 5**: Accept Connection.

- **`receive(text_data)`**:
    - **Step 1**: Parse JSON.
    - **Step 2**: **Persist**. Saves the message to Postgres (`ServiceMessage` model).
    - **Step 3**: **Broadcast**. Sends the message payload to the `service_chat_<id>` group.

- **`chat_message(event)`**:
    - Handler for group messages.
    - Forwards the payload to the actual WebSocket client (`self.send`).

### 3. `NotificationsConsumer` (The Alerts)
This handles live updates for things like unread message counts.

- **Group Name**:
    - Users join `notifications_user_<user_id>`.
    - Workshops join `notifications_workshop_<workshop_id>`.
- **Function**: Listen for `notification.message` events and forward them to the frontend to trigger a data refresh.

---

## 🛠 Key Helpers

- **`_user_can_access_room`**: Security gate. Prevents unauthorized users from listening to others' chats.
- **`_create_message`**: Database interface. Creates `ServiceMessage` entries.

---
*Documentation generated for MotoReach Chat Implementation*

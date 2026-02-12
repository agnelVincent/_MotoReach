# 🎓 Connection & Data Flow Deep Dive

This document specifically addresses the "fragmented knowledge" and corrects misconceptions about the MotoReach Chat System.

## 1. The Handshake & Connection Timing

**User Question:** *"When is the handshake firstly happening? when the user logged in or when opening the service flow page?"*

**Answer:**
It happens at **two different times** for two different purposes:

1.  **Global Notifications Connection**:
    -   **When**: Immediately after **Login**, when the Dashboard/Navbar loads.
    -   **Component**: `useChatNotifications` hook (used in Navbars).
    -   **URL**: `ws://.../ws/notifications/`
    -   **Purpose**: To listen for red dot updates even when you are browsing other pages.

2.  **Chat Room Connection**:
    -   **When**: Only when you **open a specific Service Request page** (e.g., Service Tracking).
    -   **Component**: `Chat.jsx`.
    -   **URL**: `ws://.../ws/service-chat/<request_id>/`
    -   **Purpose**: To send/receive messages for *that specific* conversation. Connection closes when you leave the page.

---

## 2. Authentication: The "Query Parameter" Mystery

**User Theory:** *"asgi will be handling... if it's websocket, the authmiddlewarestack comes into play.. it will authenticate the access token contained in the query parameter"*

**Correction:**
-   **Partially True**: `asgi.py` does wrap the router in `AuthMiddlewareStack`.
-   **The Catch**: `AuthMiddlewareStack` is designed for **Cookies/Sessions**. It does *not* natively look at query parameters (`?token=...`).
-   **The Real Hero**: The **`BaseJWTConsumer`** class in `consumers.py`.
    -   Inside the `connect()` method, this class manually looks at the URL query string.
    -   It extracts the `token`.
    -   It uses the JWT library to validate it.
    -   Use `AuthMiddlewareStack` mainly to set up the `scope`, but the actual *verification* of your JWT happens inside the Consumer code.

---

## 3. The Message Lifecycle (Corrected)

**User Theory:** *"consumer instance... will add us to a group... receive method... checks and verifies... send method used to put that message in group... message is shown"*

**Corrected Flow:**

1.  **User Sends**: Browser sends JSON via WebSocket.
2.  **`receive()`**: `ChatConsumer` gets the JSON.
3.  **Verification**: Checks if user is still authenticated.
4.  **Database Save (Crucial Step)**:
    -   The consumer calls `_create_message`.
    -   This saves a new `ServiceMessage` row in the Postgres database.
    -   **Why?** So that if you refresh the page, the history is there.
5.  **Group Broadcast**:
    -   `channel_layer.group_send("service_chat_123", ...)` sends the event to the "Room".
6.  **Distribution**:
    -   Django Channels finds all active connections (User + Workshop) in that room.
    -   It calls `chat_message()` on each connection.
7.  **Delivery**:
    -   `chat_message()` calls `self.send()` to push text to the User's browser.

---

## 4. Notifications vs. Chat

It is important to understand that **Chat** and **Notifications** are two parallel systems:

1.  **Chat System**:
    -   **High Traffic**: Lots of messages.
    -   **Focused**: Only updates the people currently looking at the chat screen.
    -   **Mechanism**: `ChatConsumer` -> `service_chat` Group.

2.  **Notification System**:
    -   **Low Traffic**: Just "You have 1 unread message".
    -   **Global**: Updates people anywhere in the app.
    -   **Mechanism**: Rest API / `NotificationsConsumer` -> `notifications_user` Group.

**Current Architectural Note**:
In the current code, when sending via WebSocket, the system prioritizes the **Chat Room** update. The global notification (red dot) might wait until the next page refresh or API poll to update, specifically if the WebSocket consumer doesn't explicitly trigger the notification group.

---

*This document serves to bridge the technical gaps in understanding the MotoReach real-time infrastructure.*

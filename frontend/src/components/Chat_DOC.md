# 💬 The Chat UI: Chat.jsx

This component is the user interface for the actual chat conversation.

## 🌟 What does this file do?
It handles **sending messages**, **receiving messages**, **loading message history**, and **marking messages as read**.

---

## 🏗 Key Features

### 1. Connection (The Handshake)
- **`useEffect` (WebSocket connection)**:
    - Creates a new `WebSocket` connection when the component mounts (i.e., when user opens the page).
    - URL: `ws://backend/ws/service-chat/<requestId>/?token=<jwt>`
    - **Authentication**: Passes the JWT token in the query string because standard headers aren't supported by the WebSocket API.

### 2. Loading History
- **`useEffect` (Fetch initial messages)**:
    - Calls `axiosInstance.get('service-request/execution/<id>/messages/')`
    - Why? WebSockets are for *live* updates. We fetch persistent history from the DB (`ServiceMessage` table) first so the chat isn't empty.

### 3. Sending Messages
- **`handleSend`**:
    - **Primary Path**: Sends via WebSocket: `wsRef.current.send(...)`.
    - **Fallback**: If WS is disconnected (e.g., network blip), uses REST API (`POST .../messages/`).
    - **Optimistic UI**: Updates the local state immediately to make the app feel fast.

### 4. Reading Messages (Blue Ticks)
- **`useEffect` (Mark as Read)**:
    - Checks if there are unread messages from the *other* person.
    - If yes, calls `POST .../read/`.
    - Backend updates `is_read_by_user` or `is_read_by_workshop` to `True`.

---

## 🛠 User Interface Details

- **Input Area**: Textarea with send button.
- **Message List**:
    - **Bubble Logic**: Right-aligned (Blue) for me, Left-aligned (White) for them.
    - **Status Indicators**:
        - "Sent": Saved to DB.
        - "Seen": Other party has marked it as read.
    - **Live Updates**: New messages slide in at the bottom.

- **Theme**: Supports 'user' (Blue) and 'workshop' (Purple) themes via props.

---
*Documentation generated for MotoReach Chat Implementation*

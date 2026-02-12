# 🔌 The Entry Point: asgi.py

This file is the "Main Door" for your entire Django application.

## 🌟 What is ASGI?
ASGI = **Asynchronous Server Gateway Interface**.
Traditional Django (WSGI) handles requests one at a time.
ASGI (Channels) handles thousands of connections at once (like WebSockets).

---

## 🏗 The Job
This file tells the server:
1.  Initialize Django (`os.environ.setdefault...`).
2.  Route traffic based on protocol:
    - **HTTP (Normal Web Req)**: Send to standard Django view.
    - **WebSocket (Chat)**: Send to `channels.routing.ProtocolTypeRouter`.

### How it Works
```python
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                service_request.routing.websocket_urlpatterns
            )
        )
    ),
})
```

- **`ProtocolTypeRouter`**: The switchboard.
- **`AuthMiddlewareStack`**: Wraps the request in authentication middleware (adds `scope['user']`).
- **`URLRouter`**: Hands off the WebSocket request to your app's routing file (`service_request/routing.py`).

---
*Documentation generated for MotoReach Chat Implementation*

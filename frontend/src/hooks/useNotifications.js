import { useEffect, useState } from 'react';

const ACCESS_TOKEN_KEY = 'accessToken';

const getWebSocketBase = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}`;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return;

    const wsBase = getWebSocketBase();
    const wsUrl = `${wsBase}/ws/notifications/?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'notifications.initial') {
          const items = data.items || [];
          setNotifications(items.filter((n) => n.unread_count > 0));
          setHasUnread(items.some((n) => n.unread_count > 0));
        } else if (data.type === 'notifications.update') {
          const item = data.item;
          if (!item) return;

          setNotifications((prev) => {
            const others = prev.filter(
              (n) => n.service_request_id !== item.service_request_id
            );

            if (item.unread_count <= 0) {
              return others;
            }

            return [...others, item];
          });

          setHasUnread(item.unread_count > 0);
        }
      } catch (error) {
        console.error('Failed to parse notification message', error);
      }
    };

    socket.onclose = () => {
      // Silent close; hook will be re-run on next mount/login if needed
    };

    socket.onerror = () => {
      // Ignore errors for now; notifications are a progressive enhancement
    };

    return () => {
      socket.close();
    };
  }, []);

  const clearForServiceRequest = (serviceRequestId) => {
    setNotifications((prev) =>
      prev.filter((n) => n.service_request_id !== Number(serviceRequestId))
    );
    setHasUnread((prev) => {
      const remaining = notifications.filter(
        (n) => n.service_request_id !== Number(serviceRequestId)
      );
      return remaining.some((n) => n.unread_count > 0);
    });
  };

  return {
    notifications,
    hasUnread,
    clearForServiceRequest,
  };
};


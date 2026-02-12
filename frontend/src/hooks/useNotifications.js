import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const ACCESS_TOKEN_KEY = 'accessToken';

const getWebSocketBase = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}`;
};

export const useNotifications = (currentServiceRequestId) => {
  // Store raw items from the server (may include entries for the
  // currently open service request; we will filter those out for UI).
  const [items, setItems] = useState([]);

  const { accessToken, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only connect when the user is authenticated and we have a token.
    if (!isAuthenticated || !accessToken) {
      setItems([]);
      return;
    }

    const wsBase = getWebSocketBase();
    const wsUrl = `${wsBase}/ws/notifications/?token=${encodeURIComponent(accessToken)}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      // Connection established
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'notifications.initial') {
          const serverItems = data.items || [];
          setItems(serverItems);
        } else if (data.type === 'notifications.update') {
          const item = data.item;
          if (!item) return;

          setItems((prev) => {
            const others = prev.filter(
              (n) => n.service_request_id !== item.service_request_id
            );

            if (item.unread_count <= 0) {
              return others;
            }

            return [...others, item];
          });
        }
      } catch (error) {
        console.error('Failed to parse notification message', error);
      }
    };

    socket.onclose = () => {
      // Connection closed; will reconnect if still authenticated
    };

    socket.onerror = (error) => {
      console.error('Notification WebSocket error:', error);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [isAuthenticated, accessToken]);

  // Derive the visible notifications for the current UI context:
  // - Only keep entries with unread_count > 0
  // - Hide entries for the service request that is currently open in a chat view
  const visibleNotifications = items.filter((n) => {
    if (!n || typeof n.unread_count === 'undefined') return false;
    if (n.unread_count <= 0) return false;

    if (currentServiceRequestId) {
      const currentIdNum = Number(currentServiceRequestId);
      if (Number(n.service_request_id) === currentIdNum) {
        return false;
      }
    }

    return true;
  });

  return {
    notifications: visibleNotifications,
    hasUnread: visibleNotifications.length > 0,
  };
};


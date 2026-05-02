import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const ACCESS_TOKEN_KEY = 'accessToken';

const getWebSocketBase = () => {
  const envBase = import.meta.env.VITE_WS_BASE
  if(envBase){
    return envBase;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://localhost:8000`;
};

export const useNotifications = (currentServiceRequestId) => {

  const [items, setItems] = useState([]);
  const [assignedTaskCount, setAssignedTaskCount] = useState(0);

  const { accessToken, isAuthenticated } = useSelector((state) => state.auth);
  const [connectionRequestCount, setConnectionRequestCount] = useState(0);


  useEffect(() => {

    if (!isAuthenticated || !accessToken) {
      setItems([]);
      setConnectionRequestCount(0);
      setAssignedTaskCount(0);
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
          setAssignedTaskCount(data.assigned_task_count || 0);
          setConnectionRequestCount(data.connection_request_count || 0);
        } 
        else if (data.type === 'notifications.assigned_task_count') {  // ← NEW
          setAssignedTaskCount(data.count || 0);
        } 
        else if (data.type === 'notifications.connection_count') {          // ← NEW
          setConnectionRequestCount(data.count || 0);
        }
        else if (data.type === 'notifications.update') {
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

  const dismissNotification = (serviceRequestId) => {
    setItems(prev => prev.filter(n => n.service_request_id !== serviceRequestId));
  };

  return {
    notifications: visibleNotifications,
    hasUnread: visibleNotifications.length > 0 || connectionRequestCount > 0 || assignedTaskCount > 0,
    connectionRequestCount,
    assignedTaskCount,
    dismissNotification
  };
};


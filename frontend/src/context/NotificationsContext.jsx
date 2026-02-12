import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState({
    total_unread_count: 0,
    items: []
  });
  const [socketConnected, setSocketConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // Load initial notifications
  const loadNotifications = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        'http://localhost:8000/api/messages/unread-summary/',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Connect to notifications WebSocket
  const connectNotificationsSocket = () => {
    const token = getAuthToken();
    if (!token) {
      return;
    }

    // Try different ports for WebSocket connection
    const wsPorts = [8000, 8001];
    let currentPortIndex = 0;

    const tryConnect = () => {
      const port = wsPorts[currentPortIndex];
      const wsUrl = `ws://localhost:${port}/ws/notifications/?token=${token}`;
      
      console.log(`Attempting notifications WebSocket connection on port ${port}...`);
      
      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log(`Notifications WebSocket connected on port ${port}`);
          setSocketConnected(true);
          
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle different message formats
            if (data.event === 'notifications.update' && data.data) {
              setNotifications(data.data);
            } else if (data.total_unread_count !== undefined) {
              // Direct notification update
              setNotifications(data);
            }
          } catch (error) {
            console.error('Error parsing notification message:', error);
          }
        };

        socket.onclose = (event) => {
          console.log('Notifications WebSocket disconnected:', event.code, event.reason);
          setSocketConnected(false);
          
          // Try next port if this one failed and we haven't tried all ports
          if (event.code !== 1000 && currentPortIndex < wsPorts.length - 1 && !reconnectTimeoutRef.current) {
            currentPortIndex++;
            console.log(`Trying next port ${wsPorts[currentPortIndex]}...`);
            setTimeout(tryConnect, 1000);
          }
          // Attempt to reconnect after 5 seconds if not a normal closure
          else if (event.code !== 1000 && !reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Attempting to reconnect notifications...');
              currentPortIndex = 0; // Reset to first port
              tryConnect();
            }, 5000);
          }
        };

        socket.onerror = (error) => {
          console.error(`Notifications WebSocket error on port ${port}:`, error);
          setSocketConnected(false);
        };

      } catch (error) {
        console.error(`Error creating notifications WebSocket on port ${port}:`, error);
        
        // Try next port
        if (currentPortIndex < wsPorts.length - 1) {
          currentPortIndex++;
          setTimeout(tryConnect, 1000);
        }
      }
    };

    tryConnect();
  };

  // Initialize on mount
  useEffect(() => {
    loadNotifications();
    connectNotificationsSocket();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Refresh notifications manually
  const refreshNotifications = () => {
    loadNotifications();
  };

  const value = {
    notifications,
    socketConnected,
    loading,
    refreshNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

import { useEffect, useRef } from 'react';

const getWebSocketBase = () => {
  const envBase = import.meta.env.VITE_WS_BASE;
  if (envBase) return envBase;
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}`;
};

/**
 * Subscribe to live service-flow updates via WebSocket. When the backend
 * notifies that the service request changed, onUpdate is called (e.g. to refetch).
 * No polling; only refetches when the server pushes an update.
 *
 * @param {string|number|null} requestId - Service request ID (falsy = no connection)
 * @param {() => void} onUpdate - Callback when server sends service_flow.update (e.g. dispatch refetch)
 */
export function useServiceFlowSocket(requestId, onUpdate) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!requestId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const wsBase = getWebSocketBase();
    const wsUrl = `${wsBase}/ws/service-flow/${requestId}/?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'service_flow.update') {
          onUpdateRef.current?.();
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [requestId]);
}

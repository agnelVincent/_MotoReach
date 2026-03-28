import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const getWebSocketBase = () => {
  const envBase = import.meta.env.VITE_WS_BASE;
  if (envBase) return envBase;
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}`;
};

/**
 * Subscribe to live service-flow updates via WebSocket.
 *
 * When the backend notifies that the service request changed, `onUpdate` is
 * called so the component can dispatch a refetch. Targeted toasts are shown
 * for specific event types (e.g. otp_generated, estimate_sent) while still
 * always triggering onUpdate so the UI stays in sync.
 *
 * @param {string|number|null} requestId  - Service request ID (falsy = no connection)
 * @param {(event: string) => void} onUpdate - Callback fired on every update; receives the event name
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
          const eventName = data.event || 'update';

          // Show targeted toast for specific events
          if (eventName === 'otp_generated') {
            toast.info('Check your email — the workshop has sent an OTP!');
          } else if (eventName === 'estimate_sent') {
            toast.info('The workshop has shared a new estimate. Review it below.');
          } else if (eventName === 'estimate_resent') {
            toast.info('The workshop has updated and resent the estimate.');
          } else if (eventName === 'estimate_approved') {
            toast.success('Estimate approved! Please proceed with payment.');
          } else if (eventName === 'estimate_rejected') {
            toast.info('Estimate was rejected. Waiting for a new one.');
          } else if (eventName === 'mechanic_assigned') {
            toast.success('A mechanic has been assigned to your service.');
          } else if (eventName === 'mechanic_removed') {
            toast.info('A mechanic has been removed from your service.');
          }

          // Always call onUpdate so the component refetches fresh data
          onUpdateRef.current?.(eventName);
        }
      } catch (err) {
        console.error('[ServiceFlowSocket] Failed to parse message:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('[ServiceFlowSocket] WebSocket error:', err);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [requestId]);
}

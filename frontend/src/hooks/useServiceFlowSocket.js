import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getWebSocketBase } from '../config/ws';

/**
 * Subscribe to live service-flow updates via WebSocket.
 *
 * @param {string|number|null} requestId  - Service request ID (falsy = no connection)
 * @param {(event: string) => void} onUpdate - Callback fired on every update; receives the event name
 * @param {'user'|'workshop'|'mechanic'} role - The role of the currently logged-in viewer.
 *   Toasts are shown only to the party that DIDN'T trigger the event, preventing duplicate toasts.
 *   - Events triggered by workshop  → toast shown only to 'user' and 'mechanic'
 *   - Events triggered by user      → toast shown only to 'workshop'
 */
export function useServiceFlowSocket(requestId, onUpdate, role = 'user') {
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

          // ─── Events triggered by the WORKSHOP ───────────────────────────
          // Only show these toasts to the user/mechanic (not the workshop who acted)
          if (role !== 'workshop') {
            if (eventName === 'otp_generated') {
              toast('Check your email — the workshop has sent an OTP!', { id: 'socket-otp-generated' });
            } else if (eventName === 'estimate_sent') {
              toast('The workshop has shared a new estimate. Review it below.', { id: 'socket-estimate-sent' });
            } else if (eventName === 'estimate_resent') {
              toast('The workshop has updated and resent the estimate.', { id: 'socket-estimate-resent' });
            } else if (eventName === 'mechanic_assigned') {
              toast('A mechanic has been assigned to your service.', { id: 'socket-mechanic-assigned' });
            } else if (eventName === 'mechanic_removed') {
              toast('A mechanic has been removed from your service.', { id: 'socket-mechanic-removed' });
            } else if (eventName === 'service_started') {
              toast.success('The service has officially started!', {
                id: 'socket-service-started',
                icon: '🔧',
              });
            } else if (eventName === 'service_completed') {
              toast.success('Service completed! Awaiting final OTP verification.', {
                id: 'socket-service-completed',
                icon: '🎉',
              });
            }
          }

          // ─── Events triggered by the USER ───────────────────────────────
          // Only show these toasts to the workshop (not the user who acted)
          if (role === 'workshop') {
            if (eventName === 'estimate_approved') {
              toast.success('Customer approved the estimate. Awaiting payment.', { id: 'socket-estimate-approved' });
            } else if (eventName === 'estimate_rejected') {
              toast('Customer rejected the estimate. Please send a revised one.', { id: 'socket-estimate-rejected' });
            }
          }

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


export const getWebSocketBase = () => {
  const envBase = import.meta.env.VITE_WS_BASE;
  if (envBase) return envBase;

  if (window.location.protocol === 'https:') {
    return `wss://${window.location.host}`;
  }

  return `ws://${window.location.host}`;
};
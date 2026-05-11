export const getWebSocketBase = () => {
  const envBase = import.meta.env.VITE_WS_BASE;
  if (envBase) return envBase;

  if (window.location.hostname === 'moto-reach.vercel.app') {
    return 'wss://motoreach.duckdns.org';
  }

  return 'ws://localhost:8000';
};
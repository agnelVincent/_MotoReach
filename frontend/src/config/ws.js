export const getWebSocketBase = () => {
  const envBase = import.meta.env.VITE_WS_BASE;

  if (envBase) return envBase;

  // fallback (ONLY for local dev)
  return window.location.protocol === 'https:'
    ? 'wss://motoreach.duckdns.org'  
    : 'ws://localhost:8000';
};
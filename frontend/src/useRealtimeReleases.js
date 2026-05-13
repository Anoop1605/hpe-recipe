import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api';
const WS_URL = `ws://${window.location.hostname}:8082/api/ws/releases`;

export default function useRealtimeReleases() {
  const [helmReleases, setHelmReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const fetchReleases = useCallback(() => {
    setLoading(true);
    return fetch(`${API_BASE}/helm-releases`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => { setHelmReleases(Array.isArray(data) ? data : []); setError(null); })
      .catch(() => setError('Failed to load helm releases. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const connectWs = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) return; // already open/connecting

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        setLastEvent(msg);
        // Refetch on any change — simple and always consistent
        fetchReleases();
      } catch (e) { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected, reconnecting in 3s...');
      reconnectTimer.current = setTimeout(connectWs, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [fetchReleases]);

  useEffect(() => {
    fetchReleases();
    connectWs();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [fetchReleases, connectWs]);

  return { helmReleases, loading, error, lastEvent, refetch: fetchReleases };
}

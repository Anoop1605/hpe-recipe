import { useEffect, useState } from 'react';

const API_BASE = '/api';

export default function useClusterOptions() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetch(`${API_BASE}/kubernetes/clusters`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setClusters(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setClusters([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { clusters, loading };
}
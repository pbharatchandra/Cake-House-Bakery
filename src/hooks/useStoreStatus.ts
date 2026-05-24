import { useState, _useEffect, useEffect } from 'react';

export function useStoreStatus() {
  const [storeStatus, setStoreStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/settings/store_status');
      if (res.ok) {
        const data = await res.json();
        setStoreStatus(data.value);
      }
    } catch (e) {
      console.error("Failed to fetch store status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds to keep UI synced across all users
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (status: 'OPEN' | 'CLOSED') => {
    try {
      const res = await fetch('/api/settings/store_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ value: status })
      });
      if (res.ok) {
        setStoreStatus(status);
        return true;
      }
    } catch (e) {
      console.error("Failed to update store status", e);
    }
    return false;
  };

  return { storeStatus, loading, updateStatus };
}

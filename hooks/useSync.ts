import { useEffect, useState } from 'react';
import { processSyncQueue } from '@/lib/sync';

export function useSync() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      console.log('Back online! Processing sync queue...');
      processSyncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Went offline.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

'use client';

import { useSync } from '@/hooks/useSync';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const isOnline = useSync();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse z-50">
      <WifiOff size={18} />
      <span className="text-sm font-medium">Offline Mode</span>
    </div>
  );
}

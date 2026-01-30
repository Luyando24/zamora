'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Radio, Check } from 'lucide-react';
import { useNotifications } from '@/app/dashboard/context/NotificationContext';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, markAsRead, soundEnabled, toggleSound, requestPushPermission } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handlePushEnable = async () => {
    const granted = await requestPushPermission();
    if (granted) alert('Notifications enabled!');
    else alert('Permission denied. Please check your browser settings.');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setIsOpen(false);
    if (notification.type === 'food') {
      router.push('/dashboard/orders');
    } else {
      router.push('/dashboard/bar-orders');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Notifications</h3>
            <div className="flex gap-2">
              <button
                onClick={handlePushEnable}
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
                title="Enable Push Notifications"
              >
                <Radio size={16} />
              </button>
               <button 
                onClick={toggleSound}
                className={`p-1.5 rounded-lg transition-colors ${soundEnabled ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-slate-400 hover:bg-slate-100'}`}
                title={soundEnabled ? "Mute sound" : "Enable sound"}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-3 ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`h-2 w-2 mt-2 rounded-full shrink-0 ${
                      !notification.read ? 'bg-primary' : 'bg-slate-200'
                    }`} />
                    <div>
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' • '}
                        <span className="capitalize">{notification.type}</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

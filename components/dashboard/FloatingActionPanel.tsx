'use client';

import { useState } from 'react';
import { useNotifications } from '@/app/dashboard/context/NotificationContext';
import { Bell, X, Calendar, Utensils, Wine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingActionPanel() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.type === 'food') router.push('/dashboard/orders');
    else if (notification.type === 'bar') router.push('/dashboard/bar-orders');
    else if (notification.type === 'booking') router.push('/dashboard/inventory');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'food': return <Utensils size={16} />;
      case 'bar': return <Wine size={16} />;
      case 'booking': return <Calendar size={16} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div className="fixed bottom-6 left-6 md:left-80 z-50 flex flex-col-reverse items-start gap-4">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300
          ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'}
          text-white
        `}
      >
        {isOpen ? <X size={24} /> : <Bell size={24} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900">Live Feed</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                   <span className="text-xs text-slate-500 font-medium">Listening for updates...</span>
                </div>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">No new activity</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`
                      w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left
                      ${n.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50 border border-blue-100'}
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg shrink-0
                      ${n.type === 'food' ? 'bg-blue-100 text-blue-600' : 
                        n.type === 'bar' ? 'bg-purple-100 text-purple-600' : 
                        'bg-emerald-100 text-emerald-600'}
                    `}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                          {n.type}
                        </span>
                        <span className="text-xs text-slate-400">
                           {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {!n.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

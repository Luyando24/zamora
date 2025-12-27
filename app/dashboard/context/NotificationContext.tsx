'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from './PropertyContext';

export interface Notification {
  id: string;
  type: 'food' | 'bar' | 'booking';
  message: string;
  created_at: string;
  read: boolean;
  orderId: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  requestPushPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { selectedPropertyId } = useProperty();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const supabase = createClient();

  // Load sound preference
  useEffect(() => {
    const savedSound = localStorage.getItem('zamora_sound_enabled');
    if (savedSound !== null) {
      setSoundEnabled(JSON.parse(savedSound));
    }
  }, []);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('zamora_sound_enabled', JSON.stringify(newState));
    if (newState) {
      playNotificationSound("Voice notifications enabled");
    }
  };

  const playNotificationSound = useCallback((text = "New order received") => {
    if (!soundEnabled) return;

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        let voices = window.speechSynthesis.getVoices();
        
        const selectVoice = () => {
          const preferredVoice = voices.find(v => 
            (v.name.includes('Google US English') || 
             v.name.includes('Microsoft Zira') ||
             v.name.includes('Samantha')) && 
             v.lang.startsWith('en')
          ) || voices.find(v => v.lang.startsWith('en'));

          if (preferredVoice) utterance.voice = preferredVoice;
          
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          window.speechSynthesis.speak(utterance);
        };

        if (voices.length === 0) {
           window.speechSynthesis.onvoiceschanged = () => {
              voices = window.speechSynthesis.getVoices();
              selectVoice();
           };
        } else {
           selectVoice();
        }
      } else {
        // Fallback to simple beep
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.error('Audio play failed', e);
    }
  }, [soundEnabled]);

  const addNotification = useCallback((type: 'food' | 'bar' | 'booking', orderId: string, message: string) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      type,
      message,
      created_at: new Date().toISOString(),
      read: false,
      orderId
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    playNotificationSound(message);
  }, [playNotificationSound]);

  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        const vapidPublicKey = 'BEO6-6HlAhJeC64bwpWmHQEPo77yyOc9imC4h0qbBrUumhbfcI-8WtClPrbEoNVI3Y4-VL5ZULrNlAgmryRnyBo';
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      console.log('Push subscription successful');
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }, []);

  // Helper function for VAPID key conversion
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Register SW on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
             console.log('Service Worker registered', reg);
             // Attempt to subscribe if permission is already granted
             if (Notification.permission === 'granted') {
                subscribeToPush();
             }
        })
        .catch(err => console.error('Service Worker registration failed', err));
    }
  }, [subscribeToPush]); // Re-check if property changes? Mostly just once is fine.

  const requestPushPermission = async () => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
          subscribeToPush();
          return true;
      }
      return false;
  };

  useEffect(() => {
    if (!selectedPropertyId) return;

    // Initial fetch of pending orders to populate notifications if desired? 
    // Or just start empty and listen for new ones?
    // User asked for "order announcements", implies real-time.
    // Let's just listen for new ones for now to avoid spamming on reload.

    const foodChannel = supabase
      .channel(`global-orders-food-${selectedPropertyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `property_id=eq.${selectedPropertyId}` },
        (payload) => {
          addNotification('food', payload.new.id, 'New food order received');
        }
      )
      .subscribe();

    const barChannel = supabase
      .channel(`global-orders-bar-${selectedPropertyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bar_orders', filter: `property_id=eq.${selectedPropertyId}` },
        (payload) => {
          addNotification('bar', payload.new.id, 'New bar order received');
        }
      )
      .subscribe();

    const bookingChannel = supabase
      .channel(`global-bookings-${selectedPropertyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings', filter: `property_id=eq.${selectedPropertyId}` },
        (payload) => {
          addNotification('booking', payload.new.id, 'New booking received');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(foodChannel);
      supabase.removeChannel(barChannel);
      supabase.removeChannel(bookingChannel);
    };
  }, [selectedPropertyId, soundEnabled, addNotification, supabase]); // Re-sub if property changes. Sound pref doesn't need re-sub but used in addNotification callback if closure issues.

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        soundEnabled,
        toggleSound,
        requestPushPermission
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { nanoid } from 'nanoid';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Use a ref to prevent double logging in React Strict Mode or rapid re-renders
  const loggedPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Basic device detection
    const getDeviceType = () => {
      const ua = navigator.userAgent;
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
      }
      if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile';
      }
      return 'desktop';
    };

    const getBrowser = () => {
      const ua = navigator.userAgent;
      if (ua.indexOf("Chrome") > -1 && ua.indexOf("Safari") > -1) return "Chrome";
      if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) return "Safari";
      if (ua.indexOf("Firefox") > -1) return "Firefox";
      if (ua.indexOf("MSIE") > -1 || ua.indexOf("Trident") > -1) return "IE"; 
      return "Unknown";
    };

    const logPageView = async () => {
      try {
        // Manage session ID
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
          sessionId = nanoid();
          sessionStorage.setItem('analytics_session_id', sessionId);
        }

        const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        
        // Prevent duplicate logging for same path in short succession (optional, but good for Strict Mode)
        if (loggedPathRef.current === fullPath) return;
        loggedPathRef.current = fullPath;

        // Use API route to bypass RLS issues for anonymous users
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'page_view',
            page_path: fullPath,
            referrer: document.referrer || null,
            device_type: getDeviceType(),
            browser: getBrowser(),
            session_id: sessionId
          }),
        });

      } catch (err) {
        // Fail silently to not impact user experience
        console.error('Analytics error:', err);
      }
    };

    logPageView();
    
  }, [pathname, searchParams]);

  return null; // Render nothing
}

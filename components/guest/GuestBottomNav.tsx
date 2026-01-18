'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, FileText, User } from 'lucide-react';

export default function GuestBottomNav() {
  const pathname = usePathname();

  const isSavedActive = pathname.startsWith('/account/saved');
  const isOrdersActive = pathname.startsWith('/account/orders');
  // Profile is active for /account root and settings, but not other subpaths that have their own tabs
  const isProfileActive = pathname === '/account' || pathname.startsWith('/account/settings');
  const isHomeActive = pathname === '/explore';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-6 pb-safe pt-2">
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/explore"
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              isHomeActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <Home size={24} strokeWidth={isHomeActive ? 2.5 : 2} />
            <span className={`text-[10px] font-bold ${
              isHomeActive ? 'text-slate-900' : 'text-slate-500'
            }`}>
              Home
            </span>
          </Link>

          <Link 
            href="/account/saved"
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              isSavedActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <Heart size={24} strokeWidth={isSavedActive ? 2.5 : 2} />
            <span className={`text-[10px] font-bold ${
              isSavedActive ? 'text-slate-900' : 'text-slate-500'
            }`}>
              Saved
            </span>
          </Link>

          <Link 
            href="/account/orders"
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              isOrdersActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText size={24} strokeWidth={isOrdersActive ? 2.5 : 2} />
            <span className={`text-[10px] font-bold ${
              isOrdersActive ? 'text-slate-900' : 'text-slate-500'
            }`}>
              Orders
            </span>
          </Link>

          <Link 
            href="/account"
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              isProfileActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <User size={24} strokeWidth={isProfileActive ? 2.5 : 2} />
            <span className={`text-[10px] font-bold ${
              isProfileActive ? 'text-slate-900' : 'text-slate-500'
            }`}>
              Profile
            </span>
          </Link>
        </div>
      </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  LayoutDashboard, CalendarDays, BedDouble, FileText, 
  Settings, LogOut, DoorOpen, Utensils, Building2, 
  ChevronRight, User, Wine
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Grouped Navigation
const navigationGroups = [
  {
    title: 'Main',
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: 'Room Bookings', href: '/dashboard/inventory', icon: CalendarDays },
      { name: 'Food Orders', href: '/dashboard/orders', icon: Utensils },
      { name: 'Food Menu', href: '/dashboard/menu', icon: Utensils },
      { name: 'Bar Orders', href: '/dashboard/bar-orders', icon: Wine },
      { name: 'Bar Menu', href: '/dashboard/bar-menu', icon: Wine },
      { name: 'Housekeeping', href: '/housekeeping', icon: BedDouble },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Properties', href: '/dashboard/properties', icon: Building2 },
      { name: 'Rooms Setup', href: '/dashboard/rooms', icon: DoorOpen },
      { name: 'ZRA Reports', href: '/dashboard/zra', icon: FileText },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>('User');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email.split('@')[0]); // Simple display name
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-full w-72 flex-col bg-white border-r border-slate-200 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] pt-4">
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 custom-scrollbar">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={`h-5 w-5 flex-shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {item.name}
                    </div>
                    {isActive && <ChevronRight size={14} className="text-white/50" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm">
            <User size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{userEmail}</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

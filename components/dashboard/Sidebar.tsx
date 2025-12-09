'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  LayoutDashboard, CalendarDays, BedDouble, FileText, 
  Settings, LogOut, DoorOpen, Utensils, Building2, 
  ChevronRight, User
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
      { name: 'Inventory Grid', href: '/dashboard/inventory', icon: CalendarDays },
      { name: 'Kitchen Orders', href: '/dashboard/orders', icon: Utensils },
      { name: 'Food & Beverage', href: '/dashboard/menu', icon: Utensils },
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
    <div className="flex h-full w-72 flex-col bg-white border-r border-slate-100 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex h-20 items-center px-8">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black shadow-lg shadow-slate-900/20">
             Z
           </div>
           <div>
             <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">ZAMORA</h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Hospitality OS</p>
           </div>
        </div>
      </div>
      
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

      {/* User Profile / Footer */}
      <div className="p-4 border-t border-slate-50">
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-900 border border-slate-200 shadow-sm">
            <User size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate capitalize">{userEmail}</p>
            <p className="text-xs text-slate-500 truncate">Manager</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

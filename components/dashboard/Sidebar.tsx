'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LayoutDashboard, CalendarDays, BedDouble, FileText, Settings, LogOut, DoorOpen, Utensils, Building2 } from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Properties', href: '/dashboard/properties', icon: Building2 },
  { name: 'Inventory Grid', href: '/dashboard/inventory', icon: CalendarDays },
  { name: 'Rooms Management', href: '/dashboard/rooms', icon: DoorOpen },
  { name: 'Kitchen Orders', href: '/dashboard/orders', icon: Utensils },
  { name: 'Food & Beverage', href: '/dashboard/menu', icon: Utensils },
  { name: 'Housekeeping', href: '/housekeeping', icon: BedDouble }, // Separate module, but linked here
  { name: 'ZRA Reports', href: '/dashboard/zra', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white text-slate-900 border-r border-slate-200 shadow-sm">
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded bg-zambia-blue flex items-center justify-center text-white font-bold">Z</div>
           <h1 className="text-lg font-bold tracking-wide text-slate-900">ZAMORA</h1>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-slate-100 text-zambia-blue shadow-sm border-l-4 border-zambia-blue'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-zambia-blue' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <button 
          onClick={handleSignOut}
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-600" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

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
    <div className="flex h-full w-64 flex-col bg-zambia-blue text-white shadow-xl">
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded bg-white flex items-center justify-center text-zambia-blue font-bold">Z</div>
           <h1 className="text-lg font-bold tracking-wide">ZAMORA</h1>
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
                  ? 'bg-white/10 text-white shadow-sm border-l-4 border-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-white/60 group-hover:text-white'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button 
          onClick={handleSignOut}
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-white/60 group-hover:text-white" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

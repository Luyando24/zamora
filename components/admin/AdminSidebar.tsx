'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Building2, Users, CreditCard, 
  Settings, LogOut, BarChart3, ShieldCheck 
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Properties', href: '/admin/hotels', icon: Building2 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Revenue', href: '/admin/revenue', icon: CreditCard },
  { name: 'System Health', href: '/admin/health', icon: BarChart3 },
  { name: 'Global Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl">
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">S</div>
           <h1 className="text-lg font-bold tracking-wide">SUPER ADMIN</h1>
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
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <LogOut className="mr-3 h-5 w-5 text-slate-500 group-hover:text-white" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

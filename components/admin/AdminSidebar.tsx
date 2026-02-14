'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import { 
  LayoutDashboard, Building2, Users, CreditCard, 
  Settings, LogOut, BarChart3, ShieldCheck, Activity,
  Monitor
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Analytics', href: '/admin/analytics', icon: Activity },
  { name: 'Properties', href: '/admin/hotels', icon: Building2 },
  { name: 'Licenses', href: '/admin/licenses', icon: ShieldCheck },
  { name: 'Software', href: '/admin/software', icon: Monitor },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Revenue', href: '/admin/revenue', icon: CreditCard },
  { name: 'System Health', href: '/admin/health', icon: BarChart3 },
  { name: 'Global Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white text-slate-900 border-r border-slate-100 shadow-sm">
      <div className="flex h-16 items-center px-6 border-b border-slate-50">
        <div className="flex flex-col">
             <h1 className="text-xl font-black tracking-[0.2em] text-primary leading-none uppercase">ZAMORA</h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Super Admin</p>
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
                  ? 'bg-primary text-white shadow-md shadow-primary/10'
                  : 'text-slate-500 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-50 p-4">
        <button 
          onClick={handleLogout}
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-red-600" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

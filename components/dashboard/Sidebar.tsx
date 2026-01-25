'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '@/app/dashboard/context/PropertyContext';
import {
  LayoutDashboard, CalendarDays, BedDouble, FileText,
  Settings, LogOut, DoorOpen, Utensils, Building2,
  ChevronRight, User, Wine, Users, History, Package, Truck, ChefHat, LayoutGrid
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

// Grouped Navigation
export const navigationGroups = [
  {
    title: 'Main',
    roles: ['admin', 'manager', 'cashier', 'waiter', 'chef'],
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Kitchen Dashboard', href: '/dashboard/kitchen', icon: ChefHat },
    ]
  },
  {
    title: 'Operations',
    roles: ['admin', 'manager', 'cashier', 'waiter', 'chef'],
    items: [
      { name: 'Room Bookings', href: '/dashboard/inventory', icon: CalendarDays },
      { name: 'Stock Management', href: '/dashboard/stock', icon: Package },
      { name: 'Suppliers', href: '/dashboard/suppliers', icon: Truck },
      { name: 'Food & Bar Orders', href: '/dashboard/orders', icon: Utensils },
      { name: 'Order History', href: '/dashboard/order-history', icon: History },
      { name: 'Food & Bar Menu', href: '/dashboard/menu', icon: Utensils },
      { name: 'Housekeeping', href: '/housekeeping', icon: BedDouble },
    ]
  },
  {
    title: 'Management',
    roles: ['admin', 'manager'],
    items: [
      { name: 'Properties', href: '/dashboard/properties', icon: Building2 },
      { name: 'Rooms Setup', href: '/dashboard/rooms', icon: DoorOpen },
      { name: 'Tables', href: '/dashboard/tables', icon: LayoutGrid },
      { name: 'Team Members', href: '/dashboard/users', icon: Users },
      { name: 'ZRA Reports', href: '/dashboard/zra', icon: FileText },
    ]
  },
  {
    title: 'System',
    roles: ['admin', 'manager'],
    items: [
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]
  }
];

export default function Sidebar({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { selectedProperty } = useProperty();
  const [userEmail, setUserEmail] = useState<string>('User');
  const [userRole, setUserRole] = useState<string>('cashier');

  const getUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (user.email) {
        setUserEmail(user.email.split('@')[0]); // Simple display name
      }

      // Fetch role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role) {
        setUserRole(profile.role);
      }
    }
  }, [supabase]);

  useEffect(() => {
    getUser();
  }, [getUser]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-full w-full md:w-72 flex-col bg-white border-r border-slate-200 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] pt-4">

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 custom-scrollbar">
        {navigationGroups
          .filter(group => group.roles.includes(userRole))
          .map((group) => {
            // Filter items based on property type
            const filteredItems = group.items.filter(item => {
              if (selectedProperty?.type === 'restaurant') {
                const hotelOnlyItems = ['Room Bookings', 'Housekeeping', 'Rooms Setup', 'ZRA Reports'];
                if (hotelOnlyItems.includes(item.name)) return false;
              } else {
                // For Hotels (or others), hide Restaurant-specific setup if needed
                // But hotels can have tables too, so maybe we show both? 
                // Let's assume for now Hotels might want tables. 
                // But if strict, we could hide 'Tables Setup' for pure hotels.
                // For now, let's keep it visible or hide if it's strictly a hotel without restaurant features.
                // Let's hide 'Tables Setup' if it's strictly a hotel? No, keep it flexible.
              }

              // Filter items for waiters (regardless of property type)
              if (userRole === 'waiter') {
                const waiterAllowedItems = ['Food & Bar Orders', 'Order History', 'Food & Bar Menu'];
                return waiterAllowedItems.includes(item.name);
              }

              // Filter items for chefs
              if (userRole === 'chef') {
                const chefAllowedItems = ['Kitchen Dashboard', 'Order History', 'Food & Bar Menu'];
                if (item.name === 'Overview') return false; // Hide Overview for chefs as they redirect
                return chefAllowedItems.includes(item.name);
              }

              // Filter items for cashiers
              if (userRole.toLowerCase() === 'cashier') {
                const cashierAllowedItems = ['Food & Bar Orders', 'Order History', 'Food & Bar Menu'];
                return cashierAllowedItems.includes(item.name);
              }

              // Hide Kitchen Dashboard for other roles (except admin/manager)
              if (item.name === 'Kitchen Dashboard' && !['admin', 'manager', 'chef'].includes(userRole)) {
                return false;
              }

              return true;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.title}>
                <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onLinkClick}
                        className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${isActive
                          ? 'bg-blue-900 text-white shadow-md shadow-blue-900/10'
                          : 'text-slate-500 hover:bg-blue-50 hover:text-blue-900'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon
                            className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
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
            );
          })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm">
            <User size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{userEmail}</p>
            <p className="text-xs text-slate-500 capitalize">{userRole}</p>
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

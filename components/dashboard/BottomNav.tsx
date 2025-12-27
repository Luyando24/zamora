'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CalendarDays,
    Utensils,
    BedDouble,
    User
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function BottomNav() {
    const pathname = usePathname();
    const supabase = createClient();
    const [userRole, setUserRole] = useState<string>('staff');

    const getRole = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
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
        getRole();
    }, [getRole]);

    const navItems = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
        { name: 'Bookings', href: '/dashboard/inventory', icon: CalendarDays, roles: ['admin', 'manager', 'staff'] },
        { name: 'Menu', href: '/dashboard/menu', icon: Utensils, roles: ['admin', 'manager', 'staff'] },
        { name: 'Cleaning', href: '/housekeeping', icon: BedDouble, roles: ['admin', 'manager', 'staff'] },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex justify-around items-center px-2 py-1 z-40 safe-area-pb">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                if (!item.roles.includes(userRole)) return null;

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <item.icon
                            size={20}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={`transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400'}`}
                        />
                        <span className={`text-[10px] font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                            {item.name}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}

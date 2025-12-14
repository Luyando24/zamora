'use client';

import { 
  BedDouble, CalendarCheck, FileCheck, Users, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Clock,
  Utensils, Wine
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('User');
  const [stats, setStats] = useState([
    { name: 'Today\'s Check-ins', value: '0', change: '+0%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Occupancy Rate', value: '0%', change: '+0%', icon: BedDouble, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Pending Folios', value: '0', change: '0', icon: FileCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
    { name: 'Available Rooms', value: '0', change: '-0', icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Food & Bar Orders', value: '0', change: '0', icon: Utensils, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.first_name) {
        setUserName(user.user_metadata.first_name);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }
    };
    getUser();

    const fetchStats = async () => {
        const today = new Date().toISOString().split('T')[0];
        const startOfDay = new Date(today).toISOString();
        
        // 1. Total Rooms
        const { count: totalRooms } = await supabase
            .from('rooms')
            .select('*', { count: 'exact', head: true });

        // 2. Maintenance Rooms
        const { count: maintenanceRooms } = await supabase
            .from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'maintenance');
            
        // 3. Today's Check-ins
        const { count: checkIns } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('check_in_date', today)
            .in('status', ['confirmed', 'checked_in']);

        // 4. Occupied Rooms (Active Bookings)
        // Logic: check_in <= today AND check_out > today
        const { count: occupied } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .lte('check_in_date', today)
            .gt('check_out_date', today)
            .in('status', ['confirmed', 'checked_in']);
            
        // 5. Pending Folios
        const { count: pendingFolios } = await supabase
            .from('folios')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

        // 6. Today's Food Orders
        const { count: foodOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay);

        // 7. Today's Bar Orders
        const { count: barOrders } = await supabase
            .from('bar_orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay);

        const safeTotalRooms = totalRooms || 0;
        const safeMaintenance = maintenanceRooms || 0;
        const safeOccupied = occupied || 0;
        const totalOrders = (foodOrders || 0) + (barOrders || 0);
        
        const occupancyRate = safeTotalRooms > 0 
            ? Math.round((safeOccupied / safeTotalRooms) * 100) 
            : 0;
            
        const availableRooms = Math.max(0, safeTotalRooms - safeOccupied - safeMaintenance);

        setStats([
            { name: 'Today\'s Check-ins', value: (checkIns || 0).toString(), change: '', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { name: 'Occupancy Rate', value: `${occupancyRate}%`, change: '', icon: BedDouble, color: 'text-amber-600', bg: 'bg-amber-50' },
            { name: 'Pending Folios', value: (pendingFolios || 0).toString(), change: '', icon: FileCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
            { name: 'Available Rooms', value: availableRooms.toString(), change: '', icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { name: 'Food & Bar Orders', value: totalOrders.toString(), change: '', icon: Utensils, color: 'text-purple-600', bg: 'bg-purple-50' },
        ]);
    };

    const fetchRecentActivity = async () => {
        // Fetch latest bookings
        const { data: bookings } = await supabase
            .from('bookings')
            .select('*, guests(first_name, last_name), rooms(room_number)')
            .order('created_at', { ascending: false })
            .limit(5);

        // Fetch latest food orders
        const { data: foodOrders } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        // Fetch latest bar orders
        const { data: barOrders } = await supabase
            .from('bar_orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        const activities: any[] = [];

        // Process Bookings
        bookings?.forEach(b => {
            const guestName = b.guests ? `${b.guests.first_name} ${b.guests.last_name}` : 'Guest';
            const roomNum = b.rooms?.room_number ? `Room ${b.rooms.room_number}` : 'Unassigned Room';
            activities.push({
                id: `booking-${b.id}`,
                title: 'New Booking',
                desc: `${guestName} booked ${roomNum}`,
                time: formatDistanceToNow(new Date(b.created_at), { addSuffix: true }),
                originalTime: new Date(b.created_at),
                icon: CalendarCheck,
                color: 'text-blue-600 bg-blue-50'
            });
        });

        // Process Food Orders
        foodOrders?.forEach(o => {
            const location = o.guest_room_number ? `to Room ${o.guest_room_number}` : '';
            activities.push({
                id: `food-${o.id}`,
                title: 'Room Service',
                desc: `Order #${o.id.slice(0, 8)} ${location}`,
                time: formatDistanceToNow(new Date(o.created_at), { addSuffix: true }),
                originalTime: new Date(o.created_at),
                icon: Utensils,
                color: 'text-amber-600 bg-amber-50'
            });
        });

        // Process Bar Orders
        barOrders?.forEach(o => {
            const location = o.guest_room_number ? `to Room ${o.guest_room_number}` : '';
            activities.push({
                id: `bar-${o.id}`,
                title: 'Bar Service',
                desc: `Order #${o.id.slice(0, 8)} ${location}`,
                time: formatDistanceToNow(new Date(o.created_at), { addSuffix: true }),
                originalTime: new Date(o.created_at),
                icon: Wine,
                color: 'text-purple-600 bg-purple-50'
            });
        });

        // Sort by time descending and take top 5
        activities.sort((a, b) => b.originalTime.getTime() - a.originalTime.getTime());
        setRecentActivity(activities.slice(0, 5));
    };

    fetchStats();
    fetchRecentActivity();

    const channels = supabase.channel('dashboard-stats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => { fetchStats(); fetchRecentActivity(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'folios' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchRecentActivity)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bar_orders' }, fetchRecentActivity)
        .subscribe();

    return () => {
        supabase.removeChannel(channels);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hello {userName}</h1>
        <p className="text-slate-500 mt-1">Overview</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="truncate text-sm font-medium text-slate-500">{item.name}</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight mt-1">{item.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 rounded-xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                <button className="text-sm text-blue-600 font-semibold hover:underline">View All</button>
            </div>
            <div className="-mx-5">
               {/* Activity Feed */}
               <div className="divide-y divide-slate-200">
                  {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                              <div className={`p-2 rounded-lg shrink-0 ${activity.color}`}>
                                  <activity.icon size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                                  <p className="text-sm text-slate-500 truncate">{activity.desc}</p>
                              </div>
                              <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{activity.time}</span>
                          </div>
                      ))
                  ) : (
                      <div className="px-5 py-8 text-center text-slate-500">
                          No recent activity found.
                      </div>
                  )}
               </div>
            </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col">
             <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1">
                <Link href="/dashboard/inventory" className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group gap-1">
                    <CalendarCheck size={22} className="text-slate-500 group-hover:text-blue-600" />
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-blue-700">New Booking</span>
                </Link>
                <Link href="/dashboard/inventory" className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors group gap-1">
                    <Users size={22} className="text-slate-500 group-hover:text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-emerald-700">Check In</span>
                </Link>
                <Link href="/dashboard/rooms" className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-colors group gap-1">
                    <BedDouble size={22} className="text-slate-500 group-hover:text-amber-600" />
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-amber-700">Room Status</span>
                </Link>
                <Link href="/dashboard/zra" className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-colors group gap-1">
                    <FileCheck size={22} className="text-slate-500 group-hover:text-purple-600" />
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-purple-700">Reports</span>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}

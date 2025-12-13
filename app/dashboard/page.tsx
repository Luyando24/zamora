'use client';

import { 
  BedDouble, CalendarCheck, FileCheck, Users, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Clock
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('User');
  const [stats, setStats] = useState([
    { name: 'Today\'s Check-ins', value: '0', change: '+0%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Occupancy Rate', value: '0%', change: '+0%', icon: BedDouble, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Pending Folios', value: '0', change: '0', icon: FileCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
    { name: 'Available Rooms', value: '0', change: '-0', icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]);

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

        const safeTotalRooms = totalRooms || 0;
        const safeMaintenance = maintenanceRooms || 0;
        const safeOccupied = occupied || 0;
        
        const occupancyRate = safeTotalRooms > 0 
            ? Math.round((safeOccupied / safeTotalRooms) * 100) 
            : 0;
            
        const availableRooms = Math.max(0, safeTotalRooms - safeOccupied - safeMaintenance);

        setStats([
            { name: 'Today\'s Check-ins', value: (checkIns || 0).toString(), change: '', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { name: 'Occupancy Rate', value: `${occupancyRate}%`, change: '', icon: BedDouble, color: 'text-amber-600', bg: 'bg-amber-50' },
            { name: 'Pending Folios', value: (pendingFolios || 0).toString(), change: '', icon: FileCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
            { name: 'Available Rooms', value: availableRooms.toString(), change: '', icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ]);
    };

    fetchStats();

    const channels = supabase.channel('dashboard-stats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'folios' }, fetchStats)
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
               {/* Placeholder Activity Feed */}
               <div className="divide-y divide-slate-200">
                  {[
                      { title: 'New Booking', desc: 'Alice Johnson booked Room 104', time: '2m ago', icon: CalendarCheck, color: 'text-blue-600 bg-blue-50' },
                      { title: 'Check-in', desc: 'Guest in Room 205', time: '15m ago', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
                      { title: 'Room Service', desc: 'Order #1234 to Room 301', time: '1h ago', icon: Clock, color: 'text-amber-600 bg-amber-50' },
                      { title: 'Housekeeping', desc: 'Room 102 is now Clean', time: '2h ago', icon: BedDouble, color: 'text-slate-500 bg-slate-100' },
                  ].map((activity, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className={`p-2 rounded-lg shrink-0 ${activity.color}`}>
                              <activity.icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                              <p className="text-sm text-slate-500 truncate">{activity.desc}</p>
                          </div>
                          <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{activity.time}</span>
                      </div>
                  ))}
               </div>
            </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col">
             <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1">
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group gap-1">
                    <CalendarCheck size={22} className="text-slate-500 group-hover:text-blue-600" />
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-blue-700">New Booking</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors group gap-1">
                    <Users size={22} className="text-slate-500 group-hover:text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-emerald-700">Check In</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-colors group gap-1">
                    <BedDouble size={22} className="text-slate-500 group-hover:text-amber-600" />
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-amber-700">Room Status</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-colors group gap-1">
                    <FileCheck size={22} className="text-slate-500 group-hover:text-purple-600" />
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-purple-700">Reports</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

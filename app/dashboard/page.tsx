'use client';

import { 
  BedDouble, CalendarCheck, FileCheck, Users, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Clock,
  Utensils, Wine, DollarSign, BarChart3
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { formatDistanceToNow, startOfWeek, startOfMonth, subDays, format, isSameDay, parseISO, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('User');
  const [stats, setStats] = useState([
    { name: 'Today\'s Check-ins', value: '0', change: '+0%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Occupancy Rate', value: '0%', change: '+0%', icon: BedDouble, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Pending Folios', value: '0', change: '0', icon: FileCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
    { name: 'Available Rooms', value: '0', change: '-0', icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Food & Bar Orders', value: '0', change: '0', icon: Utensils, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]);
  const [financialStats, setFinancialStats] = useState({
    today: 0,
    week: 0,
    month: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
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

    const fetchFinancials = async () => {
        const today = new Date();
        const startOfToday = new Date(today.setHours(0,0,0,0)).toISOString();
        const startOfThisWeek = startOfWeek(new Date()).toISOString();
        const startOfThisMonth = startOfMonth(new Date()).toISOString();
        const last30Days = subDays(new Date(), 30).toISOString();

        // Fetch Orders (Food)
        const { data: foodOrders } = await supabase
            .from('orders')
            .select('total_amount, created_at')
            .gte('created_at', last30Days);

        // Fetch Bar Orders
        const { data: barOrders } = await supabase
            .from('bar_orders')
            .select('total_amount, created_at')
            .gte('created_at', last30Days);

        // Fetch Bookings (with Room Price)
        // We estimate revenue based on check-in date for simplicity in this view
        const { data: bookings } = await supabase
            .from('bookings')
            .select(`
                check_in_date,
                check_out_date,
                rooms (
                    room_types (
                        base_price
                    )
                )
            `)
            .gte('check_in_date', last30Days.split('T')[0])
            .neq('status', 'cancelled');

        // Helper to calculate booking value
        const getBookingValue = (b: any) => {
            const price = b.rooms?.room_types?.base_price || 0;
            const nights = differenceInDays(parseISO(b.check_out_date), parseISO(b.check_in_date)) || 1;
            return price * nights;
        };

        // Calculate Totals
        let todayRev = 0;
        let weekRev = 0;
        let monthRev = 0;

        // Process Orders
        foodOrders?.forEach(o => {
            const date = new Date(o.created_at);
            const amount = o.total_amount || 0;
            if (date >= new Date(startOfToday)) todayRev += amount;
            if (date >= new Date(startOfThisWeek)) weekRev += amount;
            if (date >= new Date(startOfThisMonth)) monthRev += amount;
        });

        barOrders?.forEach(o => {
            const date = new Date(o.created_at);
            const amount = o.total_amount || 0;
            if (date >= new Date(startOfToday)) todayRev += amount;
            if (date >= new Date(startOfThisWeek)) weekRev += amount;
            if (date >= new Date(startOfThisMonth)) monthRev += amount;
        });

        bookings?.forEach(b => {
            const date = parseISO(b.check_in_date);
            const amount = getBookingValue(b);
            // Comparison for dates (ignoring time for bookings as they are YYYY-MM-DD)
            const dateStr = b.check_in_date;
            
            if (dateStr === format(new Date(), 'yyyy-MM-dd')) todayRev += amount;
            if (date >= new Date(startOfThisWeek)) weekRev += amount;
            if (date >= new Date(startOfThisMonth)) monthRev += amount;
        });

        setFinancialStats({ today: todayRev, week: weekRev, month: monthRev });

        // Prepare Chart Data (Last 7 Days)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateStr = format(date, 'yyyy-MM-dd'); // For bookings
            const dateLabel = format(date, 'MMM dd');
            
            let dailyFood = 0;
            let dailyBar = 0;
            let dailyRoom = 0;

            foodOrders?.forEach(o => {
                if (isSameDay(new Date(o.created_at), date)) dailyFood += (o.total_amount || 0);
            });

            barOrders?.forEach(o => {
                if (isSameDay(new Date(o.created_at), date)) dailyBar += (o.total_amount || 0);
            });

            bookings?.forEach(b => {
                if (b.check_in_date === dateStr) dailyRoom += getBookingValue(b);
            });

            chartData.push({
                name: dateLabel,
                Food: dailyFood,
                Bar: dailyBar,
                Rooms: dailyRoom,
                Total: dailyFood + dailyBar + dailyRoom
            });
        }
        setRevenueData(chartData);
    };

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
    fetchFinancials();

    const channels = supabase.channel('dashboard-stats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => { fetchStats(); fetchRecentActivity(); fetchFinancials(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'folios' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { fetchRecentActivity(); fetchFinancials(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bar_orders' }, () => { fetchRecentActivity(); fetchFinancials(); })
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

      {/* Financial Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Financial Performance
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Stats Cards */}
            <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Revenue Today</p>
                        <p className="text-2xl font-bold text-slate-900">K{financialStats.today.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <TrendingUp size={20} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Revenue This Week</p>
                        <p className="text-2xl font-bold text-slate-900">K{financialStats.week.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <BarChart3 size={20} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Revenue This Month</p>
                        <p className="text-2xl font-bold text-slate-900">K{financialStats.month.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <CalendarCheck size={20} />
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">Revenue Trend (Last 7 Days)</h4>
                    <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Rooms</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded-sm"></div> Food</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-600 rounded-sm"></div> Bar</div>
                    </div>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(value) => `K${value}`} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f8fafc' }}
                            />
                            <Bar dataKey="Rooms" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Food" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Bar" stackId="a" fill="#9333ea" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
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

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, Building2, CalendarDays, TrendingUp, Activity, 
  ArrowUpRight, ArrowDownRight, CreditCard, Eye, Smartphone, Monitor
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    users: 0,
    properties: 0,
    bookings: 0,
    revenue: 0
  });
  
  // New Analytics State
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    uniqueSessions: 0,
    activeUsers: 0,
    topPages: [] as { path: string, count: number }[],
    devices: [] as { name: string, value: number }[],
    viewsHistory: [] as any[]
  });

  // Data for charts
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  
  const supabase = createClient();

  const fetchCounts = useCallback(async () => {
    // Parallel fetching for speed
    const [
      { count: userCount },
      { count: propertyCount },
      { count: bookingCount }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true })
    ]);

    setMetrics(prev => ({
      ...prev,
      users: userCount || 0,
      properties: propertyCount || 0,
      bookings: bookingCount || 0
    }));
  }, [supabase]);

  const fetchBookingHistory = useCallback(async () => {
    // Get bookings from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: bookings } = await supabase
      .from('bookings')
      .select('created_at, total_amount')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (bookings) {
      // Process data for chart
      const dailyData: Record<string, { date: string, count: number, revenue: number }> = {};
      
      // Initialize last 30 days with 0
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyData[dateStr] = { date: dateStr, count: 0, revenue: 0 };
      }

      let totalRev = 0;
      bookings.forEach(b => {
        const dateStr = new Date(b.created_at).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].count += 1;
          dailyData[dateStr].revenue += (b.total_amount || 0);
        }
        totalRev += (b.total_amount || 0);
      });

      // Sort by date
      const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
      
      setBookingHistory(chartData);
      setMetrics(prev => ({ ...prev, revenue: totalRev }));
    }
  }, [supabase]);

  const fetchWebAnalytics = useCallback(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: events } = await supabase
      .from('analytics_events')
      .select('id, session_id, page_path, device_type, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());
      
    if (events) {
      // 1. Total Views
      const totalViews = events.length;
      
      // 2. Unique Visitors (Sessions)
      const uniqueSessions = new Set(events.map(e => e.session_id)).size;
      
      // 3. Active Users (Last 5 mins)
      const fiveMinsAgo = new Date();
      fiveMinsAgo.setMinutes(fiveMinsAgo.getMinutes() - 5);
      const activeUsers = new Set(
          events.filter(e => new Date(e.created_at) > fiveMinsAgo).map(e => e.session_id)
      ).size;
      
      // 4. Top Pages
      const pageCounts: Record<string, number> = {};
      events.forEach(e => {
          // Normalize path (remove query params for grouping if needed, but analytics usually tracks distinct URLs)
          // Let's strip query params for cleaner "Top Pages" view
          const path = e.page_path?.split('?')[0] || '/';
          pageCounts[path] = (pageCounts[path] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([path, count]) => ({ path, count }));
          
      // 5. Device Breakdown
      const deviceCounts: Record<string, number> = {};
      events.forEach(e => {
          const type = e.device_type || 'desktop'; // Default to desktop if missing
          // Capitalize first letter
          const key = type.charAt(0).toUpperCase() + type.slice(1);
          deviceCounts[key] = (deviceCounts[key] || 0) + 1;
      });
      const devices = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));

      // 6. Daily Views History
      const dailyViews: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyViews[dateStr] = 0;
      }
      events.forEach(e => {
        const dateStr = new Date(e.created_at).toISOString().split('T')[0];
        if (dailyViews[dateStr] !== undefined) {
          dailyViews[dateStr]++;
        }
      });
      const viewsHistory = Object.entries(dailyViews)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      setAnalyticsData({ totalViews, uniqueSessions, activeUsers, topPages, devices, viewsHistory });
    }
  }, [supabase]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCounts(), fetchBookingHistory(), fetchWebAnalytics()]);
    setLoading(false);
  }, [fetchCounts, fetchBookingHistory, fetchWebAnalytics]);

  useEffect(() => {
    fetchData();
    
    // Set up Realtime subscriptions
    const channel = supabase.channel('admin-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchCounts(); // Refresh counts on change
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => {
        fetchCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchCounts();
        fetchBookingHistory(); // Refresh chart
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analytics_events' }, () => {
        fetchWebAnalytics(); // Refresh web analytics
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchData, fetchCounts, fetchBookingHistory, fetchWebAnalytics]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Website Analytics</h1>
        <p className="text-slate-500">Real-time overview of system performance and traffic.</p>
      </div>

      {/* Traffic KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Page Views (30d)" 
          value={analyticsData.totalViews.toLocaleString()} 
          icon={Eye} 
          color="bg-purple-500"
          trend="Traffic"
        />
        <MetricCard 
          title="Unique Visitors" 
          value={analyticsData.uniqueSessions.toLocaleString()} 
          icon={Users} 
          color="bg-blue-500"
          trend="30 days"
        />
        <MetricCard 
          title="Active Users" 
          value={analyticsData.activeUsers} 
          icon={Activity} 
          color="bg-green-500"
          trend="Right now"
          highlight
        />
        <MetricCard 
          title="Total Revenue" 
          value={`K${metrics.revenue.toLocaleString()}`} 
          icon={CreditCard} 
          color="bg-amber-500"
          trend="30 days"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Traffic Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Traffic Overview</h2>
              <p className="text-sm text-slate-500">Daily page views over the last 30 days</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.viewsHistory}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => val.slice(5)} 
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Device Usage</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.devices}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Pages */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Top Visited Pages</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Page Path</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topPages.map((page, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-700">{page.path}</td>
                    <td className="px-4 py-3 text-right text-slate-900 font-bold">{page.count}</td>
                  </tr>
                ))}
                {analyticsData.topPages.length === 0 && (
                   <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400">No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Business Metrics (Existing) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Business Overview</h2>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-100 text-blue-600 rounded">
                      <Building2 size={20} />
                   </div>
                   <div>
                      <p className="text-sm font-medium text-slate-500">Total Properties</p>
                      <p className="text-lg font-bold text-slate-900">{metrics.properties}</p>
                   </div>
                </div>
             </div>
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-100 text-emerald-600 rounded">
                      <CalendarDays size={20} />
                   </div>
                   <div>
                      <p className="text-sm font-medium text-slate-500">Total Bookings</p>
                      <p className="text-lg font-bold text-slate-900">{metrics.bookings}</p>
                   </div>
                </div>
             </div>
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-100 text-indigo-600 rounded">
                      <Users size={20} />
                   </div>
                   <div>
                      <p className="text-sm font-medium text-slate-500">Registered Users</p>
                      <p className="text-lg font-bold text-slate-900">{metrics.users}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, trend, highlight }: any) {
  return (
    <div className={`p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${highlight ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${highlight ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
          <h3 className={`text-2xl font-black mt-2 ${highlight ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
          <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
      </div>
      <div className={`mt-4 flex items-center gap-2 text-xs font-medium ${highlight ? 'text-emerald-400' : 'text-emerald-600'}`}>
        <ArrowUpRight size={14} />
        <span>{trend}</span>
      </div>
    </div>
  );
}

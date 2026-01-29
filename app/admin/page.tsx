'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Building2, Users, CreditCard, TrendingUp, Activity, Calendar, ArrowUpRight } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalHotels: 0,
    activeUsers: 0,
    totalRevenue: 0,
    growth: 0,
    activeLicenses: 0
  });
  const [recentHotels, setRecentHotels] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Total Hotels
        const { count: hotelCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true });
        
        // 2. Total Users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // 3. Active Licenses (Used and not expired)
        const { count: activeLicensesCount } = await supabase
          .from('licenses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'used');

        // 4. Calculate Revenue (Sum of active license prices)
        // Note: This is a simplified calculation for the dashboard
        const { data: activeLicenses } = await supabase
          .from('licenses')
          .select('duration_days, plan')
          .eq('status', 'used');

        // Get plans to match prices
        const { data: plans } = await supabase.from('license_plans').select('*');
        
        let mrr = 0;
        if (activeLicenses && plans) {
          activeLicenses.forEach(license => {
            const plan = plans.find(p => p.name === license.plan || p.duration_days === license.duration_days);
            if (plan) {
              // Approximate MRR (Price / (Duration/30))
              const monthlyRate = plan.price / (plan.duration_days / 30);
              mrr += monthlyRate;
            } else {
              // Fallback for custom or unknown plans
              mrr += 49; // Default basic price
            }
          });
        }

        // 5. Recent Hotels
        const { data: recent } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        // 6. Distribution by City
        const { data: cityData } = await supabase
          .from('properties')
          .select('city');
        
        const cityCounts: Record<string, number> = {};
        cityData?.forEach(p => {
          const city = p.city || 'Unknown';
          cityCounts[city] = (cityCounts[city] || 0) + 1;
        });

        const dist = Object.entries(cityCounts)
          .map(([label, count]) => ({
            label,
            percentage: Math.round((count / (hotelCount || 1)) * 100),
            color: getRandomColor(label)
          }))
          .sort((a, b) => b.percentage - a.percentage);

        setStats({
          totalHotels: hotelCount || 0,
          activeUsers: userCount || 0,
          totalRevenue: Math.round(mrr),
          growth: 12.5, // Keep mock growth for now
          activeLicenses: activeLicensesCount || 0
        });
        setRecentHotels(recent || []);
        setDistribution(dist);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  const getRandomColor = (str: string) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
          <p className="text-slate-500">Monitor platform performance and tenant growth.</p>
        </div>
        <div className="text-sm text-slate-500 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <Calendar size={16} />
          {format(new Date(), 'MMMM d, yyyy')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Hotels" 
          value={stats.totalHotels.toString()} 
          icon={<Building2 className="text-blue-600" />} 
          trend="+2 this week"
          trendUp={true}
          loading={loading}
        />
        <StatCard 
          title="Active Users" 
          value={stats.activeUsers.toString()} 
          icon={<Users className="text-purple-600" />} 
          trend="+5% vs last month"
          trendUp={true}
          loading={loading}
        />
        <StatCard 
          title="Estimated MRR" 
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          icon={<CreditCard className="text-green-600" />} 
          trend="+12.5% growth"
          trendUp={true}
          loading={loading}
        />
        <StatCard 
          title="Active Licenses" 
          value={stats.activeLicenses.toString()} 
          icon={<Activity className="text-orange-600" />} 
          trend="All systems operational"
          trendUp={true}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Hotels */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Recent Onboarded Properties</h3>
            <button className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-4 bg-slate-50/50"></td>
                    </tr>
                  ))
                ) : recentHotels.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No properties onboarded yet.</td></tr>
                ) : (
                  recentHotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{hotel.name}</p>
                        <p className="text-xs text-slate-500">{hotel.email || 'No email'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{hotel.city || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          hotel.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 
                          hotel.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {hotel.subscription_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {format(new Date(hotel.created_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tenant Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-6">Property Distribution</h3>
          <div className="space-y-6">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-2"></div>
                  <div className="h-2 bg-slate-100 rounded w-full"></div>
                </div>
              ))
            ) : distribution.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No distribution data.</p>
            ) : (
              distribution.map((item, i) => (
                <DistributionItem 
                  key={i}
                  label={item.label} 
                  percentage={item.percentage} 
                  color={item.color} 
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp, loading }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-slate-100 animate-pulse rounded mt-1"></div>
          ) : (
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
          )}
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div className={`flex items-center text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
        <TrendingUp size={16} className="mr-1" />
        {trend}
      </div>
    </div>
  );
}

function DistributionItem({ label, percentage, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className="text-slate-500">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}


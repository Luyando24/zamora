'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, Users, CreditCard, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalHotels: 0,
    activeUsers: 0,
    totalRevenue: 0,
    growth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Mocking some data for the SaaS dashboard as we don't have full billing infrastructure yet
      const { count: hotelCount } = await supabase.from('hotels').select('*', { count: 'exact', head: true });
      
      setStats({
        totalHotels: hotelCount || 0,
        activeUsers: (hotelCount || 0) * 3 + 12, // Mock active users based on hotels
        totalRevenue: (hotelCount || 0) * 499, // Mock revenue ($499/mo per hotel)
        growth: 12.5
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
        <p className="text-slate-500">Monitor platform performance and tenant growth.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Hotels" 
          value={stats.totalHotels.toString()} 
          icon={<Building2 className="text-blue-600" />} 
          trend="+2 this week"
          trendUp={true}
        />
        <StatCard 
          title="Active Users" 
          value={stats.activeUsers.toString()} 
          icon={<Users className="text-purple-600" />} 
          trend="+5% vs last month"
          trendUp={true}
        />
        <StatCard 
          title="MRR (Revenue)" 
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          icon={<CreditCard className="text-green-600" />} 
          trend="+12.5% growth"
          trendUp={true}
        />
        <StatCard 
          title="System Health" 
          value="99.99%" 
          icon={<Activity className="text-orange-600" />} 
          trend="All systems operational"
          trendUp={true}
        />
      </div>

      {/* Charts Section (Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Revenue Growth</h3>
            <select className="text-sm border-slate-300 rounded-md text-slate-600">
              <option>Last 12 Months</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64 flex items-end gap-4">
            {[40, 55, 45, 60, 75, 65, 85, 95, 80, 100, 110, 120].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-50 hover:bg-blue-100 rounded-t-lg relative group transition-all">
                <div 
                  className="absolute bottom-0 w-full bg-blue-600 rounded-t-lg transition-all duration-500"
                  style={{ height: `${h}%` }}
                ></div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  ${h * 100}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-slate-400 uppercase font-medium">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-6">Tenant Distribution</h3>
          <div className="space-y-6">
            <DistributionItem label="Lusaka" percentage={45} color="bg-blue-500" />
            <DistributionItem label="Livingstone" percentage={25} color="bg-purple-500" />
            <DistributionItem label="Ndola" percentage={15} color="bg-green-500" />
            <DistributionItem label="Kitwe" percentage={10} color="bg-orange-500" />
            <DistributionItem label="Other" percentage={5} color="bg-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
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
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

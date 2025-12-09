'use client';

import { 
  BedDouble, CalendarCheck, FileCheck, Users, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Clock
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState([
    { name: 'Today\'s Check-ins', value: '0', change: '+0%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Occupancy Rate', value: '0%', change: '+0%', icon: BedDouble, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Pending Folios', value: '0', change: '0', icon: FileCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
    { name: 'Available Rooms', value: '0', change: '-0', icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]);

  const supabase = createClient();

  useEffect(() => {
    // Placeholder for real data fetching
    // In a real app, we would fetch counts here
    setStats([
        { name: 'Today\'s Check-ins', value: '12', change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Occupancy Rate', value: '85%', change: '+5%', icon: BedDouble, color: 'text-amber-600', bg: 'bg-amber-50' },
        { name: 'Pending Folios', value: '3', change: '-2', icon: FileCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
        { name: 'Available Rooms', value: '8', change: '-4', icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ]);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">Welcome back to Zamora. Here's what's happening today.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-3 ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className={`flex items-center text-xs font-bold ${
                item.change.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
              } px-2 py-1 rounded-full`}>
                {item.change.startsWith('+') ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                {item.change}
              </div>
            </div>
            <div className="mt-4">
               <p className="truncate text-sm font-medium text-slate-500">{item.name}</p>
               <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-slate-400" />
                    Recent Activity
                </h3>
                <button className="text-sm text-blue-600 font-bold hover:text-blue-700 hover:underline">View All</button>
            </div>
            <div className="p-0">
               {/* Placeholder Activity Feed */}
               <div className="divide-y divide-slate-50">
                  {[
                      { title: 'New Booking', desc: 'Alice Johnson booked Room 104', time: '2 mins ago', icon: CalendarCheck, color: 'text-blue-600 bg-blue-50' },
                      { title: 'Check-in', desc: 'Guest checked in to Room 205', time: '15 mins ago', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
                      { title: 'Room Service', desc: 'Order #1234 delivered to Room 301', time: '1 hour ago', icon: Clock, color: 'text-amber-600 bg-amber-50' },
                      { title: 'Housekeeping', desc: 'Room 102 marked as Clean', time: '2 hours ago', icon: BedDouble, color: 'text-slate-600 bg-slate-50' },
                  ].map((activity, i) => (
                      <div key={i} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className={`p-2 rounded-full shrink-0 ${activity.color}`}>
                              <activity.icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900">{activity.title}</p>
                              <p className="text-sm text-slate-500 truncate">{activity.desc}</p>
                          </div>
                          <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{activity.time}</span>
                      </div>
                  ))}
               </div>
            </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden flex flex-col">
             <div className="p-6 border-b border-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 flex-1">
                <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-all group gap-2">
                    <CalendarCheck size={24} className="text-slate-400 group-hover:text-blue-600 mb-1" />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-blue-700">New Booking</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all group gap-2">
                    <Users size={24} className="text-slate-400 group-hover:text-emerald-600 mb-1" />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-700">Check In</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 transition-all group gap-2">
                    <BedDouble size={24} className="text-slate-400 group-hover:text-amber-600 mb-1" />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-amber-700">Room Status</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 transition-all group gap-2">
                    <FileCheck size={24} className="text-slate-400 group-hover:text-purple-600 mb-1" />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-purple-700">Reports</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

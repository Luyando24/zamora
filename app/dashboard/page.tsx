import { BedDouble, CalendarCheck, FileCheck, Users } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { name: 'Today\'s Check-ins', value: '12', icon: Users, color: 'bg-blue-500' },
    { name: 'Occupancy Rate', value: '85%', icon: BedDouble, color: 'bg-zambia-copper' },
    { name: 'Pending Folios', value: '3', icon: FileCheck, color: 'bg-zambia-orange' },
    { name: 'Available Rooms', value: '8', icon: CalendarCheck, color: 'bg-zambia-green' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-lg bg-white p-5 shadow sm:px-6 sm:pt-6">
            <dt>
              <div className={`absolute rounded-md p-3 ${item.color}`}>
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent Activity Section Placeholder */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <div className="mt-4 border-t border-gray-100 pt-4">
           <p className="text-sm text-gray-500">No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  menu: 'Menu',
  orders: 'Orders',
  bookings: 'Bookings',
  properties: 'Properties',
  settings: 'Settings',
  inventory: 'Inventory',
  rooms: 'Rooms',
  'bar-menu': 'Bar Menu',
  'bar-orders': 'Bar Orders',
  'order-history': 'Order History',
  places: 'Places',
  users: 'Users',
  setup: 'Setup',
  admin: 'Admin',
  hotels: 'Hotels',
  analytics: 'Analytics',
};

export default function DashboardBreadcrumb() {
  const pathname = usePathname();
  
  if (!pathname || pathname === '/dashboard') return null;

  const segments = pathname.split('/').filter(Boolean);
  
  const items = segments.map((segment, index) => {
    // Construct href for this segment
    const href = '/' + segments.slice(0, index + 1).join('/');
    
    // Check if it's a UUID (simple check)
    const isUuid = segment.length > 30 || (segment.length > 20 && segment.includes('-'));
    
    let label = '';
    if (isUuid) {
      label = 'Details'; 
    } else if (ROUTE_LABELS[segment]) {
      label = ROUTE_LABELS[segment];
    } else {
      // Capitalize first letter and replace dashes
      label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    }
    
    if (segment === 'new') label = 'New';
    if (segment === 'edit') label = 'Edit';

    return {
      label,
      href: index === segments.length - 1 ? undefined : href
    };
  });

  return <Breadcrumb items={items} className="mb-6" />;
}

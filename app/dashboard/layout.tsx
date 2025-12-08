'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { Search, Bell, Moon, AlertTriangle, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasHotel, setHasHotel] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Only run on mount, layout persists across route changes
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Check if user has a property_id
      // First check metadata (fast)
      let propertyId = user.user_metadata?.property_id || user.user_metadata?.hotel_id;

      // If not in metadata, check profile (source of truth)
      if (!propertyId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('property_id, role')
          .eq('id', user.id)
          .single();
        
        propertyId = profile?.property_id;
        
        // Update metadata if found in profile but not metadata
        if (propertyId) {
          await supabase.auth.updateUser({
            data: { property_id: propertyId }
          });
        }
      }

      setHasHotel(!!propertyId);

    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSetupPage = pathname === '/dashboard/setup';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Hide on setup page */}
      {!isSetupPage && (
        <aside className="hidden md:flex md:flex-col z-20">
          <Sidebar />
        </aside>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {!isSetupPage && (
          <header className="flex h-16 items-center justify-between bg-white px-6 shadow-sm z-10 border-b border-gray-100">
            
            {/* Search Bar (Placeholder) */}
            <div className="flex items-center flex-1 max-w-xl">
               <div className="relative w-full max-w-md">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search className="h-4 w-4 text-gray-400" />
                 </div>
                 <input
                   type="text"
                   className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-zambia-blue focus:border-zambia-blue sm:text-sm transition duration-150 ease-in-out"
                   placeholder="Search bookings, guests, or rooms..."
                 />
               </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
                 <Bell size={20} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
                 <Moon size={20} />
              </button>
              <div className="h-8 w-1 border-r border-gray-200 mx-2"></div>
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.first_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || 'Account'}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-zambia-blue flex items-center justify-center text-white font-bold shadow-sm uppercase">
                  {user?.email?.charAt(0) || 'U'}
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {!hasHotel && !isSetupPage && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 shadow-sm rounded-r-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <AlertTriangle className="h-5 w-5 text-orange-500" aria-hidden="true" />
                   </div>
                   <div className="ml-3">
                     <p className="text-sm text-orange-700">
                       <span className="font-bold">Action Required:</span> You haven't set up your property details yet. Features will be limited.
                     </p>
                   </div>
                </div>
                <div>
                   <Link href="/dashboard/setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors">
                     Setup Property <ArrowRight className="ml-2 h-4 w-4" />
                   </Link>
                </div>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

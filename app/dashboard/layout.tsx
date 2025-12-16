'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import BottomNav from '@/components/dashboard/BottomNav';
import { Search, Bell, Moon, AlertTriangle, ArrowRight, Menu, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { PropertyProvider } from './context/PropertyContext';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <PropertyProvider>
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        {!isSetupPage && (
          <header className="relative flex h-16 items-center justify-between bg-white/60 backdrop-blur-xl px-6 z-30 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-4 md:gap-12">
            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black shadow-lg shadow-slate-900/20">
                Z
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">ZAMORA</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Hospitality OS</p>
              </div>
            </div>
          </div>

          {/* Search Bar - Centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-lg leading-5 bg-slate-100 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors shadow-sm"
                placeholder="Search..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              <Bell size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              <Moon size={20} />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-3"></div>

            <button className="flex items-center gap-3 hover:bg-slate-100 rounded-lg p-2 transition-colors">
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold shadow-sm uppercase">
                {user?.email?.charAt(0) || 'U'}
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.user_metadata?.first_name || 'User'}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.email || 'Account'}
                </p>
              </div>
            </button>
          </div>
        </header>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar Container */}
          <div className="relative w-80 h-full bg-white shadow-xl animate-in slide-in-from-left duration-200">
            <div className="absolute top-2 right-2 z-50">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>
            <Sidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Hide on setup page */}
        {!isSetupPage && (
          <aside className="hidden md:flex md:flex-col z-20 h-full">
            <Sidebar />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100 pb-20 md:pb-6">
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
      <BottomNav />
    </div>
    </PropertyProvider>
  );
}

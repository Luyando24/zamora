'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  User, Calendar, MapPin, LogOut, 
  Settings, ChevronRight, BedDouble, Clock, CheckCircle, XCircle, Bookmark, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import GuestBottomNav from '@/components/guest/GuestBottomNav';

interface Booking {
  booking_id: string;
  property_name: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: number;
  room_type_name: string;
  property_slug: string;
  property_cover_image: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchBookings = useCallback(async (email: string) => {
    const { data, error } = await supabase.rpc('get_my_bookings', { p_email: email });
    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login?next=/account');
        return;
      }
      setUser(user);
      fetchBookings(user.email!);
    };

    checkUser();
  }, [router, supabase, fetchBookings]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          <p className="text-slate-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => new Date(b.check_in_date) >= new Date());
  const pastBookings = bookings.filter(b => new Date(b.check_in_date) < new Date());

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tighter text-zambia-red flex items-center gap-2">
            <div className="w-8 h-8 bg-zambia-red rounded-lg flex items-center justify-center text-white">Z</div>
            <span className="hidden md:block">zamora</span>
          </Link>
          <div className="flex items-center gap-4">
             <Link href="/explore" className="text-sm font-bold text-slate-500 hover:text-slate-900">Explore</Link>
             <button onClick={handleSignOut} className="text-sm font-bold text-slate-500 hover:text-red-600 flex items-center gap-2">
                <LogOut size={16} /> Sign Out
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Sidebar */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <User size={48} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">
                {user.user_metadata?.first_name || 'Guest'} {user.user_metadata?.last_name || ''}
              </h1>
              <p className="text-slate-500 text-sm mb-6">{user.email}</p>
              
              <Link href="/account/settings" className="w-full py-3 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Settings size={16} /> Edit Profile
              </Link>
            </div>

            <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100">
               <div className="flex flex-col gap-1">
                 <Link href="/account" className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl text-slate-900 font-bold text-sm">
                    <Calendar size={20} /> My Bookings
                 </Link>
                 <Link href="/account/orders" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors w-full text-left">
                    <Clock size={20} /> My Orders
                 </Link>
                 <Link href="/account/settings" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors w-full text-left">
                    <User size={20} /> Personal Info
                 </Link>
                 <Link href="/account/saved" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors w-full text-left">
                    <Bookmark size={20} /> Saved Items
                 </Link>
               </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-8 space-y-8">
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Trips</p>
                <p className="text-4xl font-black">{bookings.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Upcoming</p>
                <p className="text-4xl font-black text-zambia-red">{upcomingBookings.length}</p>
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock size={20} /> Upcoming Trips
              </h2>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map(booking => (
                    <BookingCard key={booking.booking_id} booking={booking} />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center">
                   <p className="text-slate-500 mb-4">You have no upcoming trips planned.</p>
                   <Link href="/explore" className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors">
                      Start Exploring
                   </Link>
                </div>
              )}
            </div>

            {/* Past Bookings */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle size={20} /> Past Trips
              </h2>
              {pastBookings.length > 0 ? (
                <div className="space-y-4">
                  {pastBookings.map(booking => (
                    <BookingCard key={booking.booking_id} booking={booking} isPast />
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No past trips yet.</p>
              )}
            </div>

          </div>
        </div>
      </main>
      <GuestBottomNav />
    </div>
  );
}

function BookingCard({ booking, isPast }: { booking: Booking, isPast?: boolean }) {
  const statusColors: any = {
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-amber-100 text-amber-800',
    cancelled: 'bg-red-100 text-red-800',
    checked_in: 'bg-blue-100 text-blue-800',
    checked_out: 'bg-slate-100 text-slate-800'
  };

  return (
    <div className={`bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 ${isPast ? 'opacity-75 hover:opacity-100' : ''}`}>
       <div className="w-full md:w-32 h-32 bg-slate-100 rounded-2xl overflow-hidden relative shrink-0">
          {booking.property_cover_image ? (
            <Image 
                src={booking.property_cover_image} 
                className="object-cover" 
                alt={booking.property_name} 
                fill
                unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
               <BedDouble size={32} />
            </div>
          )}
       </div>
       
       <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
               <h3 className="font-bold text-lg text-slate-900">{booking.property_name}</h3>
               <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[booking.status] || 'bg-slate-100 text-slate-800'}`}>
                 {booking.status.replace('_', ' ')}
               </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">{booking.room_type_name}</p>
            <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
               <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{format(new Date(booking.check_in_date), 'MMM d, yyyy')}</span>
                  <span className="text-slate-300 mx-1">→</span>
                  <span>{format(new Date(booking.check_out_date), 'MMM d, yyyy')}</span>
               </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
             <span className="font-bold text-slate-900">K{booking.total_amount}</span>
             <Link href={`/book/${booking.property_slug || '#'}`} className="text-xs font-bold text-slate-500 hover:text-black flex items-center gap-1">
                View Property <ChevronRight size={14} />
             </Link>
          </div>
       </div>
    </div>
  );
}

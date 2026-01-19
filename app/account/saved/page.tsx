'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  User, Calendar, MapPin, CreditCard, LogOut, 
  Settings, ChevronRight, BedDouble, Bookmark, Star, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import GuestBottomNav from '@/components/guest/GuestBottomNav';

interface SavedProperty {
  id: string;
  property_id: string;
  created_at: string;
  properties: {
    id: string;
    name: string;
    city: string;
    country: string;
    address: string;
    cover_image_url: string;
    min_price: number;
    slug: string;
  };
}

export default function SavedItemsPage() {
  const [user, setUser] = useState<any>(null);
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchSavedProperties = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('saved_properties')
      .select(`
        id,
        created_at,
        property_id,
        properties (
          id,
          name,
          city,
          country,
          address,
          cover_image_url,
          min_price,
          slug
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved properties:', error);
    } else {
      // @ts-ignore
      setSavedProperties(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login?next=/account/saved');
        return;
      }
      setUser(user);
      fetchSavedProperties(user.id);
    };

    checkUser();
  }, [router, supabase, fetchSavedProperties]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          <p className="text-slate-500 font-medium">Loading your saved items...</p>
        </div>
      </div>
    );
  }

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
        <div className="mb-8">
            <Link href="/account" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <Bookmark className="text-zambia-red fill-current" /> Saved Items
            </h1>
        </div>

        {savedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((item) => (
                    <Link 
                        key={item.id} 
                        href={`/book/${item.properties.slug || item.properties.id}`}
                        className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col"
                    >
                        <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
                            {item.properties.cover_image_url ? (
                                <Image 
                                    src={item.properties.cover_image_url} 
                                    alt={item.properties.name} 
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <BedDouble size={48} />
                                </div>
                            )}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                                K{item.properties.min_price || '---'} / night
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{item.properties.name}</h3>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-slate-500 mb-4">
                                <MapPin size={14} />
                                {item.properties.city || item.properties.address || item.properties.country}
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400 font-medium">
                                <span>Saved on {format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                                <span className="text-zambia-red font-bold group-hover:underline">View Property</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center max-w-lg mx-auto">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Bookmark size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No saved items yet</h3>
                <p className="text-slate-500 mb-6">Start exploring properties and save your favorites for later.</p>
                <Link href="/explore" className="inline-block px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
                    Explore Properties
                </Link>
            </div>
        )}
      </main>
      <GuestBottomNav />
    </div>
  );
}

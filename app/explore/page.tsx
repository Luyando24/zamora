'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Home, Bed, Utensils, MapPin, Target, Backpack, 
  Menu, Search, Heart, User, FileText, Bookmark,
  Building2, Tent, ShoppingBag, Clock, Star,
  X, Box, Gift, Settings, HelpCircle, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

// Interfaces
interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  cover_image_url: string;
  description: string;
  amenities: string[];
  base_price?: number;
  slug?: string;
  min_price?: number;
  average_rating?: number;
  display_image?: string;
  type?: string;
}

interface Place {
  id: string;
  name: string;
  location: string;
  type: string;
  rating: number;
  image_url: string;
  open_hours: string;
}

const MOCK_PLACES: Place[] = [
  {
    id: '1',
    name: 'East Park Mall',
    location: 'Great East Road',
    type: 'Shopping & Lifestyle',
    rating: 4.8,
    image_url: 'https://images.unsplash.com/photo-1519567241046-7f570eee3c9e?auto=format&fit=crop&q=80&w=800',
    open_hours: '08:00 - 22:00'
  },
  {
    id: '2',
    name: 'Latitude 15 Degrees',
    location: 'Leopold\'s Hill',
    type: 'Boutique Hotel & Art',
    rating: 4.9,
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    open_hours: '24 Hours'
  }
];

// Categories Configuration
const CATEGORIES = [
  { id: 'all', name: 'All', icon: Home, color: 'bg-black text-white' },
  { id: 'stays', name: 'Stays', icon: Bed, color: 'bg-slate-100 text-slate-900' },
  { id: 'food', name: 'Food', icon: Utensils, color: 'bg-slate-100 text-slate-900' },
  { id: 'places', name: 'Places', icon: MapPin, color: 'bg-slate-100 text-slate-900' },
  { id: 'activities', name: 'Activities', icon: Target, color: 'bg-slate-100 text-slate-900' },
  { id: 'tours', name: 'Package Tours', icon: Backpack, color: 'bg-slate-100 text-slate-900' }
];

import GuestBottomNav from '@/components/guest/GuestBottomNav';
import GuestNavbar from '@/components/guest/GuestNavbar';

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<string>>(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Bottom Nav State
  const [activeTab, setActiveTab] = useState('Home');

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const searchQuery = searchParams.get('q') || '';
      
      // 1. Determine Fetch Strategy
      // If no specific search params, prefer public_properties to get ALL types (Activities, Restaurants, etc.)
      // search_properties RPC is strict on "available rooms" which hides non-stay items.
      const useRpc = !!searchQuery; 

      let propertiesData: any[] = [];
      
      if (useRpc) {
         // 1. Try RPC Search
       const { data: rpcData, error: rpcError } = await supabase.rpc('search_properties', {
         p_check_in: null,
         p_check_out: null,
         p_guests: 1,
         p_search_query: searchQuery
       });
 
       if (rpcError) {
         console.error('RPC Error:', rpcError);
       } else {
         propertiesData = rpcData || [];
       }
    }

    // 2. Fallback or Primary Fetch: public_properties view
    if (propertiesData.length === 0) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('public_properties')
        .select('*');
      
      if (fallbackError) {
        console.error('Fetch Error (public_properties):', fallbackError);
        // 3. Last resort: try properties table directly
        const { data: tableData, error: tableError } = await supabase
          .from('properties')
          .select('*');
          
        if (tableError) console.error('Table Error (properties):', tableError);
        else propertiesData = tableData || [];
      } else {
        propertiesData = fallbackData || [];
      }
    }

      // Enhance with prices/images
      if (propertiesData.length > 0) {
        const propertyIds = propertiesData.map((p: any) => p.id);
        const { data: roomTypes } = await supabase
          .from('room_types')
          .select('property_id, image_url, base_price')
          .in('property_id', propertyIds);

        const enhancedProperties = propertiesData.map((p: any) => {
          const pRooms = (roomTypes || []).filter((r: any) => r.property_id === p.id);
          pRooms.sort((a: any, b: any) => a.base_price - b.base_price);
          const bestRoom = pRooms[0];

          // Determine type
          let type = p.type || 'hotel';
          if (type === 'hotel' && pRooms.length === 0) type = 'restaurant'; // Fallback logic

          return {
            ...p,
            type,
            display_image: bestRoom?.image_url || p.cover_image_url,
            min_price: bestRoom?.base_price || p.min_price
          };
        });
        setProperties(enhancedProperties);
      } else {
        setProperties([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching properties:', err);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProperties();
    
    const supabase = createClient();
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('saved_properties')
          .select('property_id')
          .eq('user_id', user.id);
          
        if (data) {
          setSavedPropertyIds(new Set(data.map((item: any) => item.property_id)));
        }
      }
    };
    checkUser();
  }, [fetchProperties]);

  const toggleSave = async (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to save properties');
      router.push('/login?next=/explore');
      return;
    }

    const supabase = createClient();
    const isSaved = savedPropertyIds.has(propertyId);
    const newSavedIds = new Set(savedPropertyIds);

    if (isSaved) {
      newSavedIds.delete(propertyId);
    } else {
      newSavedIds.add(propertyId);
    }
    setSavedPropertyIds(newSavedIds);

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);
          
        if (error) throw error;
        toast.success('Property removed from saved');
      } else {
        const { error } = await supabase
          .from('saved_properties')
          .insert({ user_id: user.id, property_id: propertyId });
          
        if (error) throw error;
        toast.success('Property saved');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      setSavedPropertyIds(savedPropertyIds); // Revert
      toast.error('Failed to update saved status');
    }
  };

  // Helper to format items uniformly
  const formatProperty = (p: any) => ({
    id: p.id,
    title: p.name,
    location: p.city || p.address || p.country,
    subtitle: p.min_price ? `From K${p.min_price} /night` : 'View Details',
    image: p.display_image || p.cover_image_url,
    type: 'stay',
    slug: p.slug
  });

  const formatActivity = (p: any) => ({
    id: p.id,
    title: p.name,
    location: p.city || p.address || p.country,
    subtitle: p.min_price ? `From K${p.min_price}` : 'View Details',
    image: p.display_image || p.cover_image_url,
    type: 'activity',
    slug: p.slug
  });

  const formatPlace = (p: any) => ({
    id: p.id,
    title: p.name,
    location: p.location,
    subtitle: p.type,
    image: p.image_url,
    type: 'place'
  });

  // Filter content based on category
  const getFilteredContent = () => {
    let content: any[] = [];

    if (activeCategory === 'all') {
      // Mix of everything
      content = [
        ...properties.map(formatProperty),
        ...properties.filter(p => p.type === 'activity').map(formatActivity),
        ...MOCK_PLACES.map(formatPlace)
      ];
    } else if (activeCategory === 'stays') {
      content = properties.filter(p => p.type !== 'restaurant' && p.type !== 'activity').map(formatProperty);
    } else if (activeCategory === 'food') {
      content = properties.filter(p => p.type === 'restaurant').map(formatProperty);
    } else if (activeCategory === 'places') {
      content = MOCK_PLACES.map(formatPlace);
    } else if (activeCategory === 'activities' || activeCategory === 'tours') {
      content = properties.filter(p => p.type === 'activity').map(formatActivity);
    }

    return content;
  };

  const filteredContent = getFilteredContent();

  const renderCard = (item: any) => (
    <Link 
      href={item.type === 'stay' ? `/book/${item.slug || item.id}` : '#'} 
      key={item.id} 
      className="block group"
    >
      <div className="relative aspect-[4/3] md:aspect-video overflow-hidden rounded-xl bg-slate-100 mb-4 shadow-sm">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
            <Building2 size={48} />
          </div>
        )}
        {item.type !== 'place' && (
          <button 
            onClick={(e) => toggleSave(e, item.id)}
            className="absolute top-3 right-3 p-2 bg-white/30 backdrop-blur-md rounded-full hover:bg-white/50 transition-colors z-10"
          >
            <Bookmark 
              size={20} 
              className={savedPropertyIds.has(item.id) ? "text-zambia-red fill-zambia-red" : "text-white fill-transparent"} 
            />
          </button>
        )}
      </div>
      
      <div className="space-y-1 px-1">
        <h3 className="font-bold text-slate-900 text-lg leading-tight">{item.title}</h3>
        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
          <MapPin size={14} className="text-slate-400 shrink-0" />
          <span className="truncate flex-1">{item.location}</span>
        </div>
        <p className="text-slate-500 text-sm mt-1">{item.subtitle}</p>
      </div>
    </Link>
  );

  const renderSection = (title: string, items: any[], categoryId: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <button 
            onClick={() => setActiveCategory(categoryId)}
            className="text-sm font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
          >
            View All <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.slice(0, 4).map(renderCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-24">
      
      {/* Desktop Header */}
      <div className="hidden md:block">
        <GuestNavbar />
      </div>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full z-50 bg-white px-6 h-16 flex items-center justify-between border-b border-slate-50">
        <span className="text-2xl font-black tracking-widest uppercase text-slate-900">ZAMORA</span>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 -mr-2 text-slate-900 hover:bg-slate-50 rounded-full transition-colors"
        >
          <Menu size={28} />
        </button>
      </header>

      {/* Drawer Menu */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 h-full w-[300px] bg-white z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
              <span className="font-bold text-lg text-slate-900">Menu</span>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1">
                <Link href="/account" className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <User size={22} className="text-slate-400 group-hover:text-slate-900" />
                    <span className="font-medium text-slate-700 group-hover:text-slate-900">Profile</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
                </Link>

                <Link href="/account/orders" className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <Box size={22} className="text-slate-400 group-hover:text-slate-900" />
                    <span className="font-medium text-slate-700 group-hover:text-slate-900">My Orders</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
                </Link>

                <Link href="/account/saved" className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <Heart size={22} className="text-zambia-red" fill="currentColor" />
                    <span className="font-medium text-slate-700 group-hover:text-slate-900">Saved Stays</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
                </Link>
              </div>

              <div className="h-px bg-slate-100 my-4 mx-6" />

              <div className="space-y-1">
                <Link href="/promotions" className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <Gift size={22} className="text-slate-400 group-hover:text-slate-900" />
                    <span className="font-medium text-slate-700 group-hover:text-slate-900">Promotions</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
                </Link>

                <Link href="/account/settings" className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <Settings size={22} className="text-slate-400 group-hover:text-slate-900" />
                    <span className="font-medium text-slate-700 group-hover:text-slate-900">Settings</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
                </Link>

                <Link href="/support" className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <HelpCircle size={22} className="text-zambia-red" />
                    <span className="font-medium text-slate-700 group-hover:text-slate-900">Help & Support</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
                </Link>
              </div>
            </div>
            
            {/* Drawer Footer (Optional) */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-center text-slate-400">
                Version 1.0.0 • Zamora
              </p>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="pt-20 px-6 max-w-7xl mx-auto">
        
        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                activeCategory === cat.id 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02]' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <cat.icon size={22} strokeWidth={activeCategory === cat.id ? 2.5 : 2} />
              <span className={`text-sm font-bold ${activeCategory === cat.id ? 'text-white' : 'text-slate-600'}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Explore Section */}
        <div>
          {activeCategory !== 'all' && <h2 className="text-2xl font-bold text-slate-900 mb-6">Explore</h2>}
          
          {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="bg-slate-100 rounded-2xl aspect-[4/3] w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : activeCategory === 'all' ? (
             <>
               {renderSection('Stays', properties.filter(p => p.type !== 'restaurant' && p.type !== 'activity').map(formatProperty), 'stays')}
               {renderSection('Food & Drink', properties.filter(p => p.type === 'restaurant').map(formatProperty), 'food')}
               {renderSection('Activities', properties.filter(p => p.type === 'activity').map(formatActivity), 'activities')}
               {renderSection('Places', MOCK_PLACES.map(formatPlace), 'places')}
             </>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredContent.length > 0 ? (
                filteredContent.map(renderCard)
              ) : (
                <div className="col-span-full text-center py-12 text-slate-500">
                  No items found in this category.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12 bg-slate-50 mt-20 mb-16 md:mb-0">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zambia-red flex items-center justify-center font-bold text-sm text-white">Z</div>
            <span className="font-bold tracking-tight uppercase text-slate-900">ZAMORA</span>
          </div>
          <div className="text-sm text-slate-500">
            © 2025 Zamora Systems. Built for Zambia 🇿🇲
          </div>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="text-slate-500 hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="#" className="text-slate-500 hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="#" className="text-slate-500 hover:text-slate-900 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <GuestBottomNav />

    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, MapPin, Star, Menu, User, Globe, SlidersHorizontal, Heart, Building2, ChevronRight, ChevronLeft, Calendar, Users, LogIn, UserPlus, Coffee, ShoppingBag, Tent, Clock, Camera, Palmtree, Utensils, LogOut, MessageSquare, Map, UserCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Breadcrumb from '@/components/ui/Breadcrumb';

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

interface Activity {
  id: string;
  name: string;
  location: string;
  duration: string;
  price: number;
  rating: number;
  image_url: string;
  category: string;
}

interface Place {
  id: string;
  name: string;
  location: string;
  type: string; // Mall, Restaurant, etc.
  rating: number;
  image_url: string;
  open_hours: string;
}

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    name: 'Chaminuka Game Reserve Day Trip',
    location: 'Chongwe (45min from Lusaka)',
    duration: 'Full Day',
    price: 1500,
    rating: 4.9,
    image_url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800',
    category: 'Safari & Nature'
  },
  {
    id: '2',
    name: 'Lilayi Elephant Nursery Visit',
    location: 'Lusaka South',
    duration: '2 hours',
    price: 150,
    rating: 4.9,
    image_url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=80&w=800',
    category: 'Wildlife Conservation'
  },
  {
    id: '3',
    name: 'Lusaka National Park Walking Safari',
    location: 'Lusaka South East',
    duration: '3 hours',
    price: 300,
    rating: 4.7,
    image_url: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&q=80&w=800',
    category: 'Adventure'
  },
  {
    id: '4',
    name: 'Kabwata Cultural Village Tour',
    location: 'Burma Residential, Lusaka',
    duration: '1.5 hours',
    price: 0,
    rating: 4.5,
    image_url: 'https://images.unsplash.com/photo-1590558320853-43f656220808?auto=format&fit=crop&q=80&w=800',
    category: 'Culture & Art'
  },
  {
    id: '5',
    name: 'Tiffany\'s Canyon Boat Cruise',
    location: 'Kafue Road',
    duration: '4 hours',
    price: 400,
    rating: 4.6,
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800',
    category: 'Leisure'
  },
  {
    id: '6',
    name: 'Kalimba Reptile Park Experience',
    location: 'Lusaka East',
    duration: '2 hours',
    price: 200,
    rating: 4.4,
    image_url: 'https://images.unsplash.com/photo-1550953683-14664817a002?auto=format&fit=crop&q=80&w=800',
    category: 'Family Fun'
  },
  {
    id: '7',
    name: 'Lusaka National Museum',
    location: 'Independence Avenue',
    duration: '2 hours',
    price: 50,
    rating: 4.3,
    image_url: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&q=80&w=800',
    category: 'History'
  },
  {
    id: '8',
    name: 'Sugarbush Café & Farm',
    location: 'Leopard\'s Hill',
    duration: '3 hours',
    price: 0,
    rating: 4.8,
    image_url: 'https://images.unsplash.com/photo-1595855749364-77f68c3b7a2d?auto=format&fit=crop&q=80&w=800',
    category: 'Dining & Nature'
  }
];

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
  },
  {
    id: '3',
    name: '37d Gallery',
    location: 'Kabulonga',
    type: 'Contemporary Art',
    rating: 4.7,
    image_url: 'https://images.unsplash.com/photo-1577720580479-7d839d829c73?auto=format&fit=crop&q=80&w=800',
    open_hours: '09:00 - 17:00'
  },
  {
    id: '4',
    name: 'Manda Hill Mall',
    location: 'Great East Road',
    type: 'Shopping Center',
    rating: 4.5,
    image_url: 'https://images.unsplash.com/photo-1567449303078-57a57ea269e9?auto=format&fit=crop&q=80&w=800',
    open_hours: '09:00 - 21:00'
  }
];

const MOCK_FOOD: Place[] = [
  {
    id: '1',
    name: 'The Quorum',
    location: 'Mass Media',
    type: 'Fine Dining',
    rating: 4.9,
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    open_hours: '07:00 - 23:00'
  },
  {
    id: '2',
    name: 'Chicago\'s Reloaded',
    location: 'East Park Mall',
    type: 'Steakhouse & Bar',
    rating: 4.6,
    image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16549766b?auto=format&fit=crop&q=80&w=800',
    open_hours: '11:00 - 02:00'
  },
  {
    id: '3',
    name: 'The Hussar Grill',
    location: 'East Park Mall',
    type: 'Premium Steakhouse',
    rating: 4.8,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
    open_hours: '12:00 - 22:00'
  },
  {
    id: '4',
    name: 'Mint Lounge',
    location: 'Acacia Park',
    type: 'Café & Bistro',
    rating: 4.6,
    image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800',
    open_hours: '07:30 - 21:00'
  },
  {
    id: '5',
    name: 'Sugarbush Café & Farm',
    location: 'Leopard\'s Hill',
    type: 'Farm-to-Table',
    rating: 4.8,
    image_url: 'https://images.unsplash.com/photo-1595855749364-77f68c3b7a2d?auto=format&fit=crop&q=80&w=800',
    open_hours: '08:00 - 17:00'
  },
  {
    id: '6',
    name: 'Marlin Restaurant',
    location: 'Lusaka Club',
    type: 'Premium Steaks',
    rating: 4.7,
    image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800',
    open_hours: '12:00 - 22:00'
  }
];

export default function ExplorePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [activeTab, setActiveTab] = useState('Accommodation');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Tabs Configuration
  const tabs = [
    { name: 'Accommodation', icon: Building2 },
    { name: 'Activities', icon: Tent },
    { name: 'Food', icon: Utensils },
    { name: 'Places', icon: ShoppingBag }, // Shopping malls, etc
  ];



  const fetchProperties = useCallback(async (params?: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    searchQuery?: string;
  }) => {
    setLoading(true);
    const supabase = createClient();
    
    const pCheckIn = params?.checkIn ?? checkIn;
    const pCheckOut = params?.checkOut ?? checkOut;
    const pGuests = params?.guests ?? guestCount;
    const pSearchQuery = params?.searchQuery ?? searchQuery;
    
    let propertiesData: any[] = [];
    
    // Call the search RPC function
    const { data, error } = await supabase.rpc('search_properties', {
      p_check_in: pCheckIn || null,
      p_check_out: pCheckOut || null,
      p_guests: pGuests,
      p_search_query: pSearchQuery
    });
      
    if (error || !data || data.length === 0) {
      if (error) console.error('Error fetching properties (RPC):', error);
      
      // Fallback to basic fetch
      const { data: fallbackData } = await supabase.from('public_properties').select('*');
      if (fallbackData) {
          // Client-side filter as fallback
          propertiesData = fallbackData.filter((p: any) => 
            p.name.toLowerCase().includes(pSearchQuery.toLowerCase()) || 
            p.city?.toLowerCase().includes(pSearchQuery.toLowerCase())
          );
      }
    } else {
      propertiesData = data;
    }

    // Enhance with room prices/images regardless of source
    if (propertiesData.length > 0) {
        const propertyIds = propertiesData.map((p: any) => p.id);
        
        // Parallel fetch for rooms and menu categories
        const [roomTypesResult, menuCategoriesResult] = await Promise.all([
          supabase
            .from('room_types')
            .select('property_id, image_url, base_price')
            .in('property_id', propertyIds),
          supabase
            .from('menu_categories')
            .select('property_id')
            .in('property_id', propertyIds)
        ]);

        const roomTypes = roomTypesResult.data || [];
        const menuCategories = menuCategoriesResult.data || [];

        const enhancedProperties = propertiesData.map((p: any) => {
            const pRooms = roomTypes.filter((r: any) => r.property_id === p.id);
            const pMenus = menuCategories.filter((m: any) => m.property_id === p.id);
            
            // Heuristic for type if missing
            let inferredType = p.type;
            if (!inferredType) {
               if (pRooms.length > 0) {
                  inferredType = 'hotel'; // or lodge, etc.
               } else if (pMenus.length > 0) {
                  inferredType = 'restaurant';
               } else {
                  inferredType = 'hotel'; // Default fallback
               }
            }

            // Sort by price ascending to find the lowest room
            pRooms.sort((a: any, b: any) => a.base_price - b.base_price);
            const bestRoom = pRooms[0];
            
            return {
                ...p,
                type: inferredType,
                // Use room image if available, else fallback to property cover
                display_image: bestRoom?.image_url || p.cover_image_url, 
                // Ensure min_price is accurate from room types if needed
                min_price: bestRoom?.base_price || p.min_price
            };
        });
        setProperties(enhancedProperties);
    } else {
        setProperties([]);
    }
    
    setLoading(false);
  }, [checkIn, checkOut, guestCount, searchQuery]);

  const accommodationProperties = properties.filter(p => p.type?.trim().toLowerCase() !== 'restaurant');
  const restaurantProperties = properties.filter(p => p.type?.trim().toLowerCase() === 'restaurant');

  const fetchPlaces = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('average_rating', { ascending: false });

    if (!error && data) {
      setPlaces(data.map((p: any) => ({
        id: p.id,
        name: p.name,
        location: p.city || p.address,
        type: p.type || p.category,
        rating: p.average_rating || 0,
        image_url: p.cover_image_url,
        open_hours: p.opening_hours || '9 AM - 5 PM'
      })));
    }
  }, []);

  useEffect(() => {
    fetchProperties();
    fetchPlaces();

    // Check user session
    const supabase = createClient();
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      subscription.unsubscribe();
    };
  }, [fetchProperties, fetchPlaces]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
    toast.success('Logged out successfully');
  };

  const handleSearch = () => {
    fetchProperties();
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20">
      
      {/* Simple Header - Just Logo and User Menu */}
      <header className="fixed top-0 w-full z-50 bg-white border-b border-slate-100 h-16 md:h-20 px-4 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-zambia-red hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-zambia-red rounded-lg flex items-center justify-center text-white font-black text-sm md:text-base">Z</div>
            <span className="text-xl font-bold tracking-tight text-zambia-red hidden md:block uppercase">ZAMORA</span>
            </Link>
            <div className="hidden lg:block">
                <Breadcrumb items={[
                    { label: 'Explore', href: '/explore' }
                ]} />
            </div>
        </div>

        {/* Center Tabs - Navigation */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full hidden md:flex items-center gap-2">
           {tabs.map(tab => (
             <button
               key={tab.name}
               onClick={() => setActiveTab(tab.name)}
               className={`relative h-full px-4 flex items-center gap-2 text-sm font-bold transition-colors ${
                 activeTab === tab.name
                 ? 'text-slate-900'
                 : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
               }`}
             >
               <div className="flex items-center gap-2">
                   <tab.icon size={20} className={activeTab === tab.name ? "text-slate-900" : "text-slate-500"} />
                   <span>{tab.name}</span>
               </div>
               {activeTab === tab.name && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-900 rounded-t-full" />
               )}
             </button>
           ))}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
           <Link href="/dashboard" className="text-sm font-bold hover:bg-slate-100 px-4 py-2 rounded-full transition-colors hidden md:block">
              List Your Property
           </Link>
           <button 
             className="p-3 hover:bg-slate-100 rounded-full transition-colors"
             onClick={() => toast('Language & Currency selection coming soon!', { icon: '🌍' })}
           >
              <Globe size={18} />
           </button>
           
           <div className="relative" ref={menuRef}>
              <button 
                className="flex items-center gap-2 border border-slate-300 rounded-full p-1 pl-3 hover:shadow-md transition-shadow"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                 <Menu size={18} />
                 <div className="bg-slate-500 text-white rounded-full p-1">
                    <User size={18} fill="white" />
                 </div>
              </button>

              {userMenuOpen && (
                 <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                             {user.user_metadata?.first_name 
                                ? `Hi, ${user.user_metadata.first_name}` 
                                : user.email}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        
                        <Link href="/messages" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                           <MessageSquare size={18} /> Messages
                        </Link>
                        <Link href="/trips" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                           <Map size={18} /> Trips
                        </Link>
                        <Link href="/wishlists" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                           <Heart size={18} /> Wishlists
                        </Link>
                         <Link href="/account" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                           <UserCircle size={18} /> Account
                        </Link>
                        <div className="h-px bg-slate-100 my-2"></div>
                        <Link href="/dashboard" className="px-4 py-3 hover:bg-slate-50 block text-sm text-slate-600">
                           List your property
                        </Link>
                        <Link href="#" className="px-4 py-3 hover:bg-slate-50 block text-sm text-slate-600">
                           Help Center
                        </Link>
                        <div className="h-px bg-slate-100 my-2"></div>
                        <button 
                           onClick={handleLogout}
                           className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-red-600"
                        >
                           <LogOut size={18} /> Log out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                           <LogIn size={18} /> Log in
                        </Link>
                        <Link href="/signup" className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 font-semibold text-slate-700">
                           <UserPlus size={18} /> Sign up
                        </Link>
                        <div className="h-px bg-slate-100 my-2"></div>
                        <Link href="/dashboard" className="px-4 py-3 hover:bg-slate-50 block text-sm text-slate-600">
                           List your property
                        </Link>
                        <Link href="#" className="px-4 py-3 hover:bg-slate-50 block text-sm text-slate-600">
                           Help Center
                        </Link>
                      </>
                    )}
                 </div>
              )}
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-24 md:pt-28 px-4 md:px-12 max-w-[1600px] mx-auto space-y-8 md:space-y-12">
         <Breadcrumb items={[{ label: 'Explore' }]} />
         
         {/* Search Hero Section */}
         <div className="flex flex-col items-center justify-center space-y-6 md:space-y-8">


            {/* Big Search Bar */}
            <div className="w-full max-w-4xl bg-white rounded-3xl md:rounded-full shadow-lg border border-slate-200 flex flex-col md:flex-row items-center p-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
               <div className="w-full md:flex-1 px-4 md:px-6 py-2 hover:bg-slate-50 rounded-3xl md:rounded-full cursor-pointer transition-colors group relative">
                  <p className="text-xs font-bold text-slate-800 ml-1 mb-0.5">Where</p>
                  <input 
                    type="text" 
                    placeholder="Search destinations" 
                    className="w-full bg-transparent outline-none text-sm text-slate-600 placeholder:text-slate-400 font-medium truncate"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
               </div>
               
               <div className="w-full md:w-auto px-4 md:px-6 py-2 hover:bg-slate-50 rounded-3xl md:rounded-full cursor-pointer transition-colors group">
                  <p className="text-xs font-bold text-slate-800 ml-1 mb-0.5">Check in</p>
                  <input 
                     type="date" 
                     className="bg-transparent outline-none text-sm text-slate-600 placeholder:text-slate-400 font-medium w-full md:w-32"
                     value={checkIn}
                     onChange={(e) => setCheckIn(e.target.value)}
                  />
               </div>

               <div className="w-full md:w-auto px-4 md:px-6 py-2 hover:bg-slate-50 rounded-3xl md:rounded-full cursor-pointer transition-colors group">
                  <p className="text-xs font-bold text-slate-800 ml-1 mb-0.5">Check out</p>
                  <input 
                     type="date" 
                     className="bg-transparent outline-none text-sm text-slate-600 placeholder:text-slate-400 font-medium w-full md:w-32"
                     value={checkOut}
                     onChange={(e) => setCheckOut(e.target.value)}
                  />
               </div>

               <div className="w-full md:w-auto px-4 md:px-6 py-2 hover:bg-slate-50 rounded-3xl md:rounded-full cursor-pointer transition-colors group flex items-center justify-between md:justify-start gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800 ml-1 mb-0.5">Who</p>
                    <input 
                       type="number" 
                       min="1"
                       className="bg-transparent outline-none text-sm text-slate-600 placeholder:text-slate-400 font-medium w-full md:w-20"
                       value={guestCount}
                       onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <button 
                    onClick={handleSearch}
                    className="bg-zambia-red p-3.5 rounded-full text-white hover:bg-red-600 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                     <Search size={20} strokeWidth={3} />
                     <span className="md:hidden font-bold">Search</span>
                  </button>
               </div>
            </div>
         </div>

         {/* Content Sections */}
         {activeTab === 'Accommodation' && (
           <>


              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                   {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse space-y-3">
                         <div className="bg-slate-100 rounded-xl aspect-square w-full"></div>
                         <div className="space-y-2">
                            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                         </div>
                      </div>
                   ))}
                </div>
              ) : properties.length > 0 ? (
                 <div className="space-y-12">
                    
                    {/* Horizontal Scroll Section: Popular */}
                    <section>
                       <div className="flex justify-between items-end mb-6">
                          <h2 className="text-2xl font-bold text-slate-900">Popular in Lusaka</h2>
                          <button className="text-sm font-bold text-slate-900 underline hover:text-slate-600">Show all</button>
                       </div>
                       <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 md:mx-0 md:px-0 snap-x">
                          {accommodationProperties.slice(0, 6).map((property) => (
                             <Link href={`/book/${property.slug || property.id}`} key={`popular-${property.id}`} className="group block cursor-pointer w-[280px] md:w-[320px] flex-none snap-start">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 mb-3">
                                   {property.display_image || property.cover_image_url ? (
                                      <Image 
                                         src={property.display_image || property.cover_image_url} 
                                         alt={property.name} 
                                         fill
                                         className="object-cover group-hover:scale-105 transition-transform duration-500"
                                         unoptimized
                                      />
                                   ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                                         <Building2 size={48} />
                                      </div>
                                   )}
                                   <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow-md text-xs font-bold text-slate-900 border border-white/20">
                                      Guest favorite
                                   </div>
                                   <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 bg-black/10 hover:bg-black/20 rounded-full backdrop-blur-sm">
                                      <Heart size={20} className="text-white fill-black/50 hover:fill-zambia-red hover:text-zambia-red transition-colors" />
                                   </button>
                                </div>
                                <div className="space-y-1">
                                   <div className="flex justify-between items-start">
                                      <h3 className="font-bold text-slate-900 truncate text-lg">{property.name}</h3>
                                      <div className="flex items-center gap-1 text-sm font-bold">
                                         <Star size={14} className={property.average_rating ? "fill-slate-900 text-slate-900" : "text-slate-300"} />
                                         <span>{property.average_rating || 'New'}</span>
                                      </div>
                                   </div>
                                   <p className="text-slate-500 text-sm truncate">
                                     {[property.city, property.country].filter(Boolean).join(', ') || property.address || 'Location unavailable'}
                                  </p>
                                  <div className="flex items-baseline gap-1 mt-1">
                                     {property.min_price ? (
                                        <span className="font-bold text-slate-900 text-sm">
                                           from K{property.min_price}
                                        </span>
                                     ) : (
                                        <span className="font-bold text-slate-500 text-sm">View Details</span>
                                     )}
                                  </div>
                                </div>
                             </Link>
                          ))}
                       </div>
                    </section>

                    {/* Section 2: All Properties Grid */}
                    <section>
                       <h2 className="text-2xl font-bold text-slate-900 mb-6">Explore Accommodation</h2>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                          {accommodationProperties.map((property) => (
                             <Link href={`/book/${property.slug || property.id}`} key={property.id} className="group block cursor-pointer">
                                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 mb-3">
                                   {property.display_image || property.cover_image_url ? (
                                      <Image 
                                         src={property.display_image || property.cover_image_url} 
                                         alt={property.name} 
                                         fill
                                         className="object-cover group-hover:scale-105 transition-transform duration-500"
                                         unoptimized
                                      />
                                   ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                                         <Building2 size={48} />
                                      </div>
                                   )}
                                   
                                   <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10">
                                      <Heart size={24} className="text-white fill-black/50 hover:fill-zambia-red hover:text-zambia-red transition-colors" />
                                   </button>
                                </div>

                                <div className="space-y-1">
                                   <div className="flex justify-between items-start">
                                      <h3 className="font-bold text-slate-900 truncate">{property.name}</h3>
                                      <div className="flex items-center gap-1 text-sm">
                                         <Star size={14} className={property.average_rating ? "fill-slate-900 text-slate-900" : "text-slate-300"} />
                                         <span>{property.average_rating || 'New'}</span>
                                      </div>
                                   </div>
                                   <p className="text-slate-500 text-sm truncate">
                                     {[property.city, property.country].filter(Boolean).join(', ') || property.address || 'Location unavailable'}
                                  </p>
                                  <div className="flex items-baseline gap-1 mt-1">
                                     {property.min_price ? (
                                        <span className="font-bold text-slate-900 text-sm">
                                           from K{property.min_price}
                                        </span>
                                     ) : (
                                        <span className="font-bold text-slate-500 text-sm">View Details</span>
                                     )}
                                  </div>
                                </div>
                             </Link>
                          ))}
                       </div>
                    </section>
                 </div>
               ) : (
                <div className="text-center py-20">
                   <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
                      <Search size={32} className="text-slate-300" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-2">No properties found</h3>
                   <p className="text-slate-500">Try adjusting your search criteria.</p>
                </div>
              )}
           </>
         )}

         {/* Activities Content */}
         {activeTab === 'Activities' && (
            <div className="space-y-12">
                {/* Popular Activities Section */}
                <section>
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Top Experiences</h2>
                        <button className="text-sm font-bold text-slate-900 underline hover:text-slate-600">Show all</button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 md:mx-0 md:px-0 snap-x">
                        {MOCK_ACTIVITIES.slice(0, 4).map((activity) => (
                            <div key={activity.id} className="group block cursor-pointer w-[280px] md:w-[320px] flex-none snap-start">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 mb-3">
                                    <Image 
                                        src={activity.image_url} 
                                        alt={activity.name} 
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow-md text-xs font-bold text-slate-900 border border-white/20">
                                        {activity.category}
                                    </div>
                                    <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 bg-black/10 hover:bg-black/20 rounded-full backdrop-blur-sm">
                                        <Heart size={20} className="text-white fill-black/50 hover:fill-zambia-red hover:text-zambia-red transition-colors" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 truncate text-lg">{activity.name}</h3>
                                        <div className="flex items-center gap-1 text-sm font-bold">
                                            <Star size={14} className="fill-slate-900 text-slate-900" />
                                            <span>{activity.rating}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <MapPin size={14} />
                                        <span>{activity.location}</span>
                                        <span>•</span>
                                        <Clock size={14} />
                                        <span>{activity.duration}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="font-black text-slate-900">
                                            {activity.price > 0 ? `K${activity.price}` : 'Free'}
                                        </span>
                                        <span className="text-slate-500 text-sm">per person</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* All Activities Grid */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Explore All Activities</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                        {MOCK_ACTIVITIES.map((activity) => (
                            <div key={activity.id} className="group block cursor-pointer">
                                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 mb-3">
                                    <Image 
                                        src={activity.image_url} 
                                        alt={activity.name} 
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10">
                                        <Heart size={24} className="text-white fill-black/50 hover:fill-zambia-red hover:text-zambia-red transition-colors" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 truncate">{activity.name}</h3>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Star size={14} className="fill-slate-900 text-slate-900" />
                                            <span>{activity.rating}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-500 text-sm">
                                        <MapPin size={14} />
                                        <span className="truncate">{activity.location}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="font-black text-slate-900">
                                            {activity.price > 0 ? `K${activity.price}` : 'Free'}
                                        </span>
                                        <span className="text-slate-500 text-sm">per person</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
         )}

         {/* Food Content */}
         {activeTab === 'Food' && (
            <div className="space-y-12">
                {/* Popular Food Section */}
                <section>
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Popular Dining</h2>
                        <button className="text-sm font-bold text-slate-900 underline hover:text-slate-600">Show all</button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 md:mx-0 md:px-0 snap-x">
                        {restaurantProperties.length > 0 ? restaurantProperties.slice(0, 4).map((place: any) => (
                            <Link href={`/food/${place.slug || place.id}`} key={place.id} className="group block cursor-pointer w-[280px] md:w-[320px] flex-none snap-start">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 mb-3">
                                    <Image 
                                        src={place.display_image || place.cover_image_url} 
                                        alt={place.name} 
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow-md text-xs font-bold text-slate-900 border border-white/20">
                                        Restaurant
                                    </div>
                                    <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 bg-black/10 hover:bg-black/20 rounded-full backdrop-blur-sm">
                                        <Heart size={20} className="text-white fill-black/50 hover:fill-zambia-red hover:text-zambia-red transition-colors" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 truncate text-lg">{place.name}</h3>
                                        <div className="flex items-center gap-1 text-sm font-bold">
                                            <Star size={14} className={place.average_rating ? "fill-slate-900 text-slate-900" : "text-slate-300"} />
                                            <span>{place.average_rating || 'New'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <MapPin size={14} />
                                        <span>{[place.city, place.country].filter(Boolean).join(', ') || place.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                        <Clock size={14} />
                                        <span className="text-green-600 font-medium">Open {place.settings?.opening_hours || 'Daily'}</span>
                                    </div>
                                </div>
                            </Link>
                        )) : MOCK_FOOD.slice(0, 4).map((place) => (
                            <div key={place.id} className="group block cursor-pointer w-[280px] md:w-[320px] flex-none snap-start">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 mb-3">
                                    <Image 
                                        src={place.image_url} 
                                        alt={place.name} 
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow-md text-xs font-bold text-slate-900 border border-white/20">
                                        {place.type}
                                    </div>
                                    <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 bg-black/10 hover:bg-black/20 rounded-full backdrop-blur-sm">
                                        <Heart size={20} className="text-white fill-black/50 hover:fill-zambia-red hover:text-zambia-red transition-colors" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 truncate text-lg">{place.name}</h3>
                                        <div className="flex items-center gap-1 text-sm font-bold">
                                            <Star size={14} className="fill-slate-900 text-slate-900" />
                                            <span>{place.rating}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <MapPin size={14} />
                                        <span>{place.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                        <Clock size={14} />
                                        <span className="text-green-600 font-medium">Open {place.open_hours}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* All Food Grid */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Explore Food & Drink</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                        {restaurantProperties.map((place: any) => (
                            <Link href={`/food/${place.slug || place.id}`} key={place.id} className="group block cursor-pointer">
                                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 mb-3">
                                    <Image
                      src={place.cover_image_url}
                      alt={place.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                                    <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10">
                                        <Heart size={24} className="text-white fill-black/50 hover:fill-zambia-red hover:text-zambia-red transition-colors" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 truncate">{place.name}</h3>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Star size={14} className="fill-slate-900 text-slate-900" />
                                            <span>{place.average_rating || 'New'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-500 text-sm">
                                        <MapPin size={14} />
                                        <span className="truncate">{place.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                        <Clock size={14} />
                                        <span className="text-green-600 font-medium">Open {place.settings?.opening_hours || 'Daily'}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
         )}

         {/* Places Content */}
         {activeTab === 'Places' && (
            <div className="space-y-12">
                {/* Popular Places Section */}
                <section>
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Must Visit Spots</h2>
                        <button className="text-sm font-bold text-slate-900 underline hover:text-slate-600">Show all</button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 md:mx-0 md:px-0 snap-x">
                        {places.slice(0, 4).map((place) => (
                            <div key={place.id} className="group block cursor-pointer w-[280px] md:w-[320px] flex-none snap-start">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 mb-3">
                                    <Image 
                                        src={place.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'} 
                                        alt={place.name} 
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow-md text-xs font-bold text-slate-900 border border-white/20">
                                        {place.type}
                                    </div>
                                    <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10 bg-black/10 hover:bg-black/20 rounded-full backdrop-blur-sm">
                                        <Heart size={20} className="text-white fill-black/50 hover:fill-zambia-red hover:text-zambia-red transition-colors" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 truncate text-lg">{place.name}</h3>
                                        <div className="flex items-center gap-1 text-sm font-bold">
                                            <Star size={14} className="fill-slate-900 text-slate-900" />
                                            <span>{place.rating}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <MapPin size={14} />
                                        <span>{place.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                        <Clock size={14} />
                                        <span className="text-green-600 font-medium">Open {place.open_hours}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* All Places Grid */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Explore Shopping & Dining</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                        {places.map((place) => (
                            <div key={place.id} className="group block cursor-pointer">
                                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 mb-3">
                                    <Image 
                                        src={place.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'} 
                                        alt={place.name} 
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10">
                                        <Heart size={24} className="text-white fill-black/50 hover:fill-zambia-red hover:text-zambia-red transition-colors" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-900 truncate">{place.name}</h3>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Star size={14} className="fill-slate-900 text-slate-900" />
                                            <span>{place.rating}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-500 text-sm">
                                        <MapPin size={14} />
                                        <span className="truncate">{place.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                        <Clock size={14} />
                                        <span className="text-green-600 font-medium">Open {place.open_hours}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
         )}

      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-6 pb-safe pt-2">
         <div className="flex justify-between items-center h-16">
            {tabs.map(tab => (
               <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                     activeTab === tab.name 
                     ? 'text-zambia-red' 
                     : 'text-slate-400 hover:text-slate-600'
                  }`}
               >
                  <tab.icon size={24} strokeWidth={activeTab === tab.name ? 2.5 : 2} />
                  <span className={`text-[10px] font-bold ${activeTab === tab.name ? 'text-zambia-red' : 'text-slate-500'}`}>
                     {tab.name}
                  </span>
               </button>
            ))}
            <button className="flex flex-col items-center justify-center gap-1 w-full h-full text-slate-400 hover:text-slate-600">
               <User size={24} />
               <span className="text-[10px] font-bold text-slate-500">Profile</span>
            </button>
         </div>
      </div>

    </div>
  );
}

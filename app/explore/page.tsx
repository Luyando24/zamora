'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, MapPin, Star, Menu, User, Globe, SlidersHorizontal, Heart, Building2, ChevronRight, ChevronLeft, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
}

export default function ExplorePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = [
    { name: 'All', icon: Globe },
    { name: 'Hotels', icon: Building2 },
    { name: 'Resorts', icon: Star },
    { name: 'Lodges', icon: MapPin },
  ];

  const fetchProperties = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // Call the search RPC function
    const { data, error } = await supabase.rpc('search_properties', {
      p_check_in: checkIn || null,
      p_check_out: checkOut || null,
      p_guests: guestCount,
      p_search_query: searchQuery
    });
      
    if (error) {
      console.error('Error fetching properties:', error);
      // Fallback to basic fetch if RPC fails
      const { data: fallbackData } = await supabase.from('public_properties').select('*');
      if (fallbackData) {
          // Client-side filter as fallback
          const filtered = fallbackData.filter((p: any) => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.city?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setProperties(filtered);
      }
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSearch = () => {
    fetchProperties();
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* Navbar - Airbnb Style */}
      <header className="fixed top-0 w-full z-50 bg-white border-b border-slate-200 h-20 px-6 md:px-12 flex items-center justify-between transition-all">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-zambia-red hover:opacity-80 transition-opacity">
           <div className="w-8 h-8 bg-zambia-red rounded-lg flex items-center justify-center text-white font-black">Z</div>
           <span className="text-xl font-bold tracking-tight text-zambia-red hidden md:block">zamora</span>
        </Link>

        {/* Search Bar - Centered & Rounded */}
        <div className="hidden md:flex items-center shadow-sm hover:shadow-md border border-slate-300 rounded-full py-2.5 px-4 gap-4 transition-all w-full max-w-2xl mx-4">
           <div className="px-4 border-r border-slate-300 flex-1">
              <p className="text-xs font-bold text-slate-800">Where</p>
              <input 
                type="text" 
                placeholder="Search destinations" 
                className="text-sm text-slate-600 outline-none bg-transparent w-full placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
           </div>
           <div className="px-4 border-r border-slate-300 hidden lg:block">
              <p className="text-xs font-bold text-slate-800">Check in</p>
              <input 
                 type="date" 
                 className="text-sm text-slate-600 outline-none bg-transparent w-full placeholder:text-slate-400"
                 value={checkIn}
                 onChange={(e) => setCheckIn(e.target.value)}
              />
           </div>
           <div className="px-4 border-r border-slate-300 hidden lg:block">
              <p className="text-xs font-bold text-slate-800">Check out</p>
              <input 
                 type="date" 
                 className="text-sm text-slate-600 outline-none bg-transparent w-full placeholder:text-slate-400"
                 value={checkOut}
                 onChange={(e) => setCheckOut(e.target.value)}
              />
           </div>
           <div className="px-4 hidden lg:block w-24">
              <p className="text-xs font-bold text-slate-800">Who</p>
              <input 
                 type="number" 
                 min="1"
                 className="text-sm text-slate-600 outline-none bg-transparent w-full placeholder:text-slate-400"
                 value={guestCount}
                 onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
              />
           </div>
           <button 
             onClick={handleSearch}
             className="bg-zambia-red p-3 rounded-full text-white hover:bg-red-600 transition-colors flex items-center justify-center"
           >
              <Search size={18} strokeWidth={3} />
           </button>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
           <Link href="/dashboard" className="text-sm font-bold hover:bg-slate-100 px-4 py-2 rounded-full transition-colors hidden md:block">
              List Your Property
           </Link>
           <button className="p-3 hover:bg-slate-100 rounded-full transition-colors">
              <Globe size={18} />
           </button>
           <button className="flex items-center gap-2 border border-slate-300 rounded-full p-1 pl-3 hover:shadow-md transition-shadow">
              <Menu size={18} />
              <div className="bg-slate-500 text-white rounded-full p-1">
                 <User size={18} fill="white" />
              </div>
           </button>
        </div>
      </header>

      {/* Mobile Search (Below Header) */}
      <div className="md:hidden fixed top-20 w-full z-40 bg-white border-b border-slate-100 px-4 py-3">
         <div className="flex items-center shadow-sm border border-slate-200 rounded-full py-3 px-4 bg-slate-50">
            <Search size={18} className="text-slate-500 mr-3" />
            <div className="flex-1">
               <p className="text-sm font-bold text-slate-900">Where to?</p>
               <div className="flex gap-2 text-xs text-slate-500">
                  <span>Anywhere</span>•<span>Any week</span>•<span>Add guests</span>
               </div>
            </div>
            <button className="p-2 border border-slate-200 rounded-full bg-white">
               <SlidersHorizontal size={16} />
            </button>
         </div>
      </div>

      {/* Categories Bar */}
      <div className="fixed top-20 md:top-24 w-full z-40 bg-white shadow-sm md:shadow-none pt-4 pb-2 px-6 md:px-12">
         <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide pb-2 max-w-7xl mx-auto">
            {categories.map(cat => (
               <button 
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex flex-col items-center gap-2 min-w-max pb-2 border-b-2 transition-all group ${
                     selectedCategory === cat.name 
                     ? 'border-slate-900 text-slate-900' 
                     : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
               >
                  <cat.icon size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">{cat.name}</span>
               </button>
            ))}
         </div>
      </div>

      {/* Main Content Grid */}
      <main className="pt-48 md:pt-48 px-6 md:px-12 pb-20 max-w-[1800px] mx-auto">
         
         {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
               {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                     <div className="bg-slate-200 rounded-xl aspect-square w-full"></div>
                     <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                     </div>
                  </div>
               ))}
            </div>
         ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
               {properties.map((property) => (
                  <Link href={`/book/${property.slug || property.id}`} key={property.id} className="group block cursor-pointer">
                     <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 mb-3">
                        {property.cover_image_url ? (
                           <img 
                              src={property.cover_image_url} 
                              alt={property.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                           />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Building2 size={48} />
                           </div>
                        )}
                        
                        {/* Favorite Button Overlay */}
                        <button className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform z-10">
                           <Heart size={24} className="text-white fill-black/50 hover:fill-zambia-red hover:text-zambia-red transition-colors" />
                        </button>

                        {/* Guest Favorite Badge (Mock) */}
                        {Math.random() > 0.7 && (
                           <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow-md text-xs font-bold text-slate-900 border border-white/20">
                              Guest favorite
                           </div>
                        )}

                        {/* Carousel Controls (Mock) */}
                        <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-1.5 bg-white/90 rounded-full hover:bg-white hover:scale-105 transition-all shadow-sm">
                              <ChevronLeft size={16} />
                           </button>
                           <button className="p-1.5 bg-white/90 rounded-full hover:bg-white hover:scale-105 transition-all shadow-sm">
                              <ChevronRight size={16} />
                           </button>
                        </div>
                     </div>

                     <div className="space-y-1">
                        <div className="flex justify-between items-start">
                           <h3 className="font-bold text-slate-900 truncate">{property.name}</h3>
                           <div className="flex items-center gap-1 text-sm">
                              <Star size={14} className="fill-slate-900 text-slate-900" />
                              <span>4.8</span>
                           </div>
                        </div>
                        <p className="text-slate-500 text-sm truncate">{property.city}, {property.country}</p>
                        <p className="text-slate-500 text-sm">Hosted by Zamora</p>
                        <div className="flex items-baseline gap-1 mt-1">
                           <span className="font-black text-slate-900">
                             {property.min_price ? `K${property.min_price}` : 'Price Varies'}
                           </span>
                           <span className="text-slate-500 text-sm">night</span>
                        </div>
                     </div>
                  </Link>
               ))}
            </div>
         ) : (
            <div className="text-center py-20">
               <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                  <Search size={32} className="text-slate-400" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">No properties found</h3>
               <p className="text-slate-500">Try adjusting your search criteria or dates.</p>
            </div>
         )}

      </main>

      {/* Floating Map Button (Mobile/Desktop) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
         <button className="bg-slate-900 text-white px-5 py-3.5 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm">
            Show map <MapPin size={16} />
         </button>
      </div>

    </div>
  );
}

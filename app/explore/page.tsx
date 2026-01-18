'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Home, Bed, Utensils, MapPin, Target, Backpack, 
  Menu, Search, Heart, User, FileText, Bookmark,
  Building2, Tent, ShoppingBag, Clock, Star
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
  type: string;
  rating: number;
  image_url: string;
  open_hours: string;
}

// Mock Data
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
    id: '5',
    name: 'Tiffany\'s Canyon Boat Cruise',
    location: 'Kafue Road',
    duration: '4 hours',
    price: 400,
    rating: 4.6,
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800',
    category: 'Leisure'
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

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Bottom Nav State
  const [activeTab, setActiveTab] = useState('Home');

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    
    // Fetch properties
    const { data, error } = await supabase.rpc('search_properties', {
      p_check_in: null,
      p_check_out: null,
      p_guests: 1,
      p_search_query: ''
    });

    let propertiesData = data || [];

    // If RPC fails or returns empty, fallback
    if (!data || data.length === 0) {
        const { data: fallbackData } = await supabase.from('public_properties').select('*');
        propertiesData = fallbackData || [];
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
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProperties();
    
    const supabase = createClient();
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, [fetchProperties]);

  // Filter content based on category
  const getFilteredContent = () => {
    let content: any[] = [];

    // Helper to format items uniformly
    const formatProperty = (p: any) => ({
      id: p.id,
      title: p.name,
      location: p.city || p.country || p.address,
      subtitle: p.min_price ? `Starting Price K${p.min_price} /night` : 'View Details',
      image: p.display_image || p.cover_image_url,
      type: 'stay',
      slug: p.slug
    });

    const formatActivity = (a: any) => ({
      id: a.id,
      title: a.name,
      location: a.location,
      subtitle: `From K${a.price}`,
      image: a.image_url,
      type: 'activity'
    });

    const formatPlace = (p: any) => ({
      id: p.id,
      title: p.name,
      location: p.location,
      subtitle: p.type,
      image: p.image_url,
      type: 'place'
    });

    if (activeCategory === 'all') {
      // Mix of everything
      content = [
        ...properties.map(formatProperty),
        ...MOCK_ACTIVITIES.map(formatActivity),
        ...MOCK_PLACES.map(formatPlace)
      ];
      // Shuffle slightly for "Explore" feel? No, just list them.
    } else if (activeCategory === 'stays') {
      content = properties.filter(p => p.type !== 'restaurant').map(formatProperty);
    } else if (activeCategory === 'food') {
      content = properties.filter(p => p.type === 'restaurant').map(formatProperty);
      // Add mock food places if any
    } else if (activeCategory === 'places') {
      content = MOCK_PLACES.map(formatPlace);
    } else if (activeCategory === 'activities' || activeCategory === 'tours') {
      content = MOCK_ACTIVITIES.map(formatActivity);
    }

    return content;
  };

  const filteredContent = getFilteredContent();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-24">
      
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white px-6 h-16 flex items-center justify-between border-b border-slate-50">
        <span className="text-2xl font-black tracking-widest uppercase text-slate-900">ZAMORA</span>
        <button className="p-2 -mr-2">
          <Menu size={28} className="text-slate-900" />
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-6 max-w-7xl mx-auto">
        
        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
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
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Explore</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // Loading Skeletons
              [...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="bg-slate-100 rounded-2xl aspect-[4/3] w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              ))
            ) : filteredContent.length > 0 ? (
              filteredContent.map((item) => (
                <Link 
                  href={item.type === 'stay' ? `/book/${item.slug || item.id}` : '#'} 
                  key={item.id} 
                  className="block group"
                >
                  <div className="relative aspect-[4/3] md:aspect-video overflow-hidden rounded-2xl bg-slate-100 mb-4 shadow-sm">
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
                    <button className="absolute top-3 right-3 p-2 bg-white/30 backdrop-blur-md rounded-full hover:bg-white/50 transition-colors">
                      <Bookmark size={20} className="text-white fill-transparent" />
                    </button>
                  </div>
                  
                  <div className="space-y-1 px-1">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{item.title}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                      <MapPin size={14} className="text-slate-400" />
                      <span>{item.location}</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">{item.subtitle}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-slate-500">
                No items found in this category.
              </div>
            )}
          </div>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-6 pb-safe pt-2">
        <div className="flex justify-between items-center h-16">
          <button 
            onClick={() => setActiveTab('Home')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              activeTab === 'Home' ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            <Home size={24} strokeWidth={activeTab === 'Home' ? 2.5 : 2} />
            <span className={`text-[10px] font-bold ${activeTab === 'Home' ? 'text-slate-900' : 'text-slate-500'}`}>
              Home
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('Saved')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              activeTab === 'Saved' ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            <Heart size={24} strokeWidth={activeTab === 'Saved' ? 2.5 : 2} />
            <span className={`text-[10px] font-bold ${activeTab === 'Saved' ? 'text-slate-900' : 'text-slate-500'}`}>
              Saved
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('Orders')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              activeTab === 'Orders' ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            <FileText size={24} strokeWidth={activeTab === 'Orders' ? 2.5 : 2} />
            <span className={`text-[10px] font-bold ${activeTab === 'Orders' ? 'text-slate-900' : 'text-slate-500'}`}>
              Orders
            </span>
          </button>

          <button 
            onClick={() => setActiveTab('Profile')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              activeTab === 'Profile' ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            <User size={24} strokeWidth={activeTab === 'Profile' ? 2.5 : 2} />
            <span className={`text-[10px] font-bold ${activeTab === 'Profile' ? 'text-slate-900' : 'text-slate-500'}`}>
              Profile
            </span>
          </button>
        </div>
      </div>

    </div>
  );
}

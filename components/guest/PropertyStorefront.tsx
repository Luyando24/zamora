'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  ShoppingBag, Utensils, BedDouble, Search, Plus, Minus, X, 
  MapPin, Phone, Mail, Clock, CheckCircle, Star, 
  ChevronRight, ArrowRight, Instagram, Facebook, Twitter, Building2, ArrowLeft, Calendar, Info, Home, Coffee, User
} from 'lucide-react';

interface PropertyStorefrontProps {
  property: any;
  roomTypes: any[];
  menuItems: any[];
  categories: any[];
}

export default function PropertyStorefront({ property, roomTypes, menuItems, categories }: PropertyStorefrontProps) {
  const [activeTab, setActiveTab] = useState<'rooms' | 'food' | 'amenities'>('rooms');
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // -- Booking State --
  const [bookingDates, setBookingDates] = useState({ checkIn: '', checkOut: '' });
  const [guestDetails, setGuestDetails] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    specialRequests: '' 
  });
  
  const [availableRoomTypes, setAvailableRoomTypes] = useState<Set<string> | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      if (bookingDates.checkIn && bookingDates.checkOut) {
        setCheckingAvailability(true);
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_room_availability', {
          p_property_id: property.id,
          p_check_in: bookingDates.checkIn,
          p_check_out: bookingDates.checkOut
        });
        
        if (error) {
          console.error('Error checking availability:', error);
        } else {
          const availableIds = new Set(
            (data || []).filter((r: any) => r.available_rooms > 0).map((r: any) => r.room_type_id)
          );
          setAvailableRoomTypes(availableIds);
        }
        setCheckingAvailability(false);
      } else {
        setAvailableRoomTypes(null);
      }
    };
    
    checkAvailability();
  }, [bookingDates, property.id]);

  const nights = bookingDates.checkIn && bookingDates.checkOut 
    ? Math.max(1, Math.ceil((new Date(bookingDates.checkOut).getTime() - new Date(bookingDates.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  // -- Cart Logic --
  const addToCart = (item: any, type: 'room' | 'food') => {
    setCart(prev => {
      // For rooms, we treat each booking configuration as unique if dates are involved
      const itemWithDetails = type === 'room' ? { 
        ...item, 
        bookingDates, 
        guestDetails,
        quantity: 1, // Room booking is usually 1 unit
        calculatedPrice: item.base_price * nights
      } : item;

      // Simple implementation for food items
      if (type === 'food') {
         const existing = prev.find(i => i.id === item.id && i.type === 'food');
         if (existing) {
             return prev.map(i => i.id === item.id && i.type === 'food' ? { ...i, quantity: i.quantity + 1 } : i);
         }
         return [...prev, { ...itemWithDetails, type, quantity: 1 }];
      }

      return [...prev, { ...itemWithDetails, type, quantity: 1, calculatedPrice: itemWithDetails.calculatedPrice }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQ = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => {
    if (item.type === 'room') {
      return sum + (item.calculatedPrice || item.base_price * item.quantity);
    }
    return sum + (item.price || item.base_price) * item.quantity;
  }, 0);

  // -- Filtering --
  const filteredRooms = roomTypes.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      room.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isAvailable = availableRoomTypes ? availableRoomTypes.has(room.id) : true;
    
    return matchesSearch && isAvailable;
  });

  const filteredFood = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredAmenities = (property.amenities || []).filter((amenity: string) => 
    amenity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const roomItems = cart.filter(item => item.type === 'room');
      
      // Process Room Bookings
      for (const item of roomItems) {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomTypeId: item.id,
            propertyId: property.id,
            checkIn: item.bookingDates.checkIn,
            checkOut: item.bookingDates.checkOut,
            guestDetails: item.guestDetails
          })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to book room');
        }
      }
      
      // Clear cart on success
      setCart([]);
      setIsCartOpen(false);
      alert('Booking confirmed! We look forward to your stay.');
      setActiveTab('rooms');
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(`Checkout failed: ${error.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSearchClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        searchInputRef.current?.focus();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-black selection:text-white pb-20 md:pb-0 relative">
      
      {/* Subtle Theme Background Accent */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-slate-200/60 to-transparent pointer-events-none" />

      {/* 1. Navbar - Fixed Top */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-center md:justify-between gap-4">
            {/* Property Name/Logo */}
            <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-3 shrink-0 text-center md:text-left">
                <div className="font-black text-2xl tracking-tighter leading-none text-slate-900">
                    ZAMORA
                </div>
                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                <div className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest max-w-[200px] truncate">
                    {property.name}
                </div>
            </div>

            {/* Search Bar */}
            {!activeRoom && (
              <div className="flex-1 max-w-md mx-auto hidden md:block">
                  <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Search size={18} className="text-slate-400 group-focus-within:text-black transition-colors" />
                      </div>
                      <input
                          ref={searchInputRef}
                          type="text"
                          placeholder={activeTab === 'rooms' ? "Search rooms..." : activeTab === 'food' ? "Search menu..." : "Search amenities..."}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 border border-slate-200 rounded-full focus:outline-none focus:border-black/30 focus:bg-white focus:ring-4 focus:ring-black/5 transition-all font-medium placeholder:text-slate-400 text-sm"
                      />
                  </div>
              </div>
            )}

            {/* Cart & Actions */}
            <div className="flex items-center gap-2 shrink-0 hidden md:flex">
                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-3 text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-300 group border border-transparent hover:border-slate-200"
                >
                    <ShoppingBag size={22} className="group-hover:scale-110 transition-transform" />
                    {cart.length > 0 && (
                        <span className="absolute top-1 right-1 h-5 w-5 bg-black text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce-subtle">
                            {cart.reduce((a, b) => a + b.quantity, 0)}
                        </span>
                    )}
                </button>
            </div>
        </div>
      </nav>

      {/* 3. Main Content */}
      <main className="max-w-7xl mx-auto px-1 md:px-6 relative z-10 pt-24 mb-20">
         
         {!activeRoom ? (
           <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-3 md:p-10 min-h-[60vh] border border-slate-100">
            
            {/* Filter Header */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-6 md:mb-10 pb-4 md:pb-8 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-full">
                        <button
                            onClick={() => { setActiveTab('rooms'); setSearchQuery(''); }}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                activeTab === 'rooms' 
                                ? 'bg-white text-black shadow-md' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Rooms
                        </button>
                        <button
                            onClick={() => { setActiveTab('food'); setSearchQuery(''); }}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                activeTab === 'food' 
                                ? 'bg-white text-black shadow-md' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Food & Drink
                        </button>
                        <button
                            onClick={() => { setActiveTab('amenities'); setSearchQuery(''); }}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                activeTab === 'amenities' 
                                ? 'bg-white text-black shadow-md' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Amenities
                        </button>
                    </div>
                </div>

                {/* Categories (Only for Food) */}
                {activeTab === 'food' && (
                  <div className="flex overflow-x-auto gap-2 w-full md:w-auto pb-2 md:pb-0 scrollbar-hide mask-linear-fade [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                      {['All', ...categories].map(cat => (
                          <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                                  selectedCategory === cat 
                                  ? 'bg-black text-white shadow-lg transform scale-105' 
                                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-black'
                              }`}
                          >
                              {cat}
                          </button>
                      ))}
                  </div>
                )}
            </div>

            {/* ROOMS GRID */}
            {activeTab === 'rooms' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 animate-in fade-in duration-500">
                {filteredRooms.map(room => (
                    <div 
                        key={room.id} 
                        onClick={() => setActiveRoom(room)}
                        className="group bg-white rounded-2xl md:rounded-3xl border border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
                    >
                        {/* Image Area */}
                        <div className="h-48 md:h-64 relative overflow-hidden bg-slate-100">
                            {room.image_url ? (
                                <img src={room.image_url} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <BedDouble size={32} className="md:w-10 md:h-10" />
                                </div>
                            )}
                            
                            {/* Price Tag */}
                            <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-lg z-10">
                                <span className="font-black text-slate-900 text-sm md:text-lg">K{room.base_price}</span>
                                <span className="text-xs text-slate-500 font-bold ml-1">/ night</span>
                            </div>

                            {/* Capacity Badge */}
                            <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white/90 backdrop-blur-sm text-slate-700 rounded-md shadow-sm border border-slate-100 flex items-center gap-1">
                                    <BedDouble size={12} /> Max {room.capacity}
                                </span>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4 md:p-6 flex-1 flex flex-col">
                            <h3 className="font-bold text-lg md:text-xl text-slate-900 mb-2 group-hover:text-slate-700 transition-colors line-clamp-1">{room.name}</h3>
                            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-4 line-clamp-2 flex-1">{room.description}</p>
                            
                            <div className="mt-auto">
                                <button 
                                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm shadow-lg hover:bg-black transition-all"
                                >
                                    View Details & Book
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredRooms.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-400">
                        <BedDouble size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No rooms found.</p>
                    </div>
                )}
              </div>
            )}

            {/* FOOD GRID */}
            {activeTab === 'food' && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 animate-in fade-in duration-500">
                {filteredFood.map(item => (
                    <div 
                        key={item.id} 
                        className="group bg-white rounded-2xl md:rounded-3xl border border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
                    >
                        {/* Image Area */}
                        <div className="h-32 md:h-56 relative overflow-hidden bg-slate-100">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Utensils size={32} className="md:w-10 md:h-10" />
                                </div>
                            )}
                            
                            <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/95 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-full shadow-lg z-10">
                                <span className="font-black text-slate-900 text-sm md:text-lg">K{item.price}</span>
                            </div>

                             {item.discount_badge && (
                                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-red-500 text-white rounded-md shadow-md animate-pulse-slow">
                                        {item.discount_badge}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        {/* Content */}
                        <div className="p-3 md:p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-sm md:text-xl text-slate-900 leading-tight group-hover:text-slate-700 transition-colors line-clamp-2">{item.name}</h3>
                            </div>
                            
                            <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-2 md:mb-4 line-clamp-2 md:line-clamp-3 flex-1">{item.description}</p>
                            
                            <div className="mt-auto pt-2 md:pt-4">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(item, 'food');
                                    }}
                                    className="w-full py-2 bg-white border border-slate-200 text-slate-900 rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
                                >
                                    <Plus size={14} /> Add
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredFood.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-400">
                        <Utensils size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No food items found.</p>
                    </div>
                )}
              </div>
            )}

            {/* AMENITIES GRID */}
            {activeTab === 'amenities' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-500">
                {filteredAmenities.length > 0 ? (
                  filteredAmenities.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 md:p-6 bg-white rounded-2xl md:rounded-3xl border border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all group">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-900 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <CheckCircle size={20} className="md:w-6 md:h-6" />
                      </div>
                      <span className="font-bold text-slate-700 group-hover:text-slate-900 text-sm md:text-base">{amenity}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 text-slate-400">
                    <Info size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No amenities listed.</p>
                  </div>
                )}
              </div>
            )}

           </div>
         ) : (
            // Room Details View
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-3 md:p-8 min-h-[60vh] border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-500">
                 {/* Header Actions */}
                <div className="mb-6 flex items-center gap-4">
                    <button 
                    onClick={() => setActiveRoom(null)}
                    className="p-3 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm group"
                    >
                    <ArrowLeft size={20} className="text-slate-700 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Back to Rooms</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Media & Info */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Gallery */}
                        <div className="aspect-video w-full rounded-[2rem] overflow-hidden shadow-lg relative group bg-slate-100">
                            {activeRoom.gallery_urls && activeRoom.gallery_urls.length > 0 ? (
                                <img 
                                    src={activeRoom.gallery_urls[currentImageIndex] || activeRoom.image_url} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                    alt="Room view"
                                />
                            ) : activeRoom.image_url ? (
                                <img 
                                    src={activeRoom.image_url} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                    alt="Room view"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <BedDouble size={64} />
                                </div>
                            )}

                            {/* Carousel Controls */}
                            {activeRoom.gallery_urls && activeRoom.gallery_urls.length > 0 && (
                                <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentImageIndex(prev => prev === 0 ? activeRoom.gallery_urls.length - 1 : prev - 1);
                                        }}
                                        className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 text-white transition-all transform hover:scale-110"
                                    >
                                        <ArrowLeft size={24} />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentImageIndex(prev => prev === activeRoom.gallery_urls.length - 1 ? 0 : prev + 1);
                                        }}
                                        className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 text-white transition-all transform hover:scale-110"
                                    >
                                        <ArrowRight size={24} />
                                    </button>
                                </div>
                            )}
                        </div>

                         {/* Thumbnails */}
                        {activeRoom.gallery_urls && activeRoom.gallery_urls.length > 0 && (
                        <div className="grid grid-cols-5 gap-4">
                            {activeRoom.gallery_urls.map((url: string, i: number) => (
                                <div 
                                    key={i} 
                                    onClick={() => setCurrentImageIndex(i)}
                                    className={`aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all ${
                                        currentImageIndex === i ? 'ring-4 ring-slate-900 ring-offset-2' : 'hover:opacity-80'
                                    }`}
                                >
                                    <img src={url} className="w-full h-full object-cover" alt={`Thumbnail ${i + 1}`} />
                                </div>
                            ))}
                        </div>
                        )}

                        {/* Details */}
                        <div className="space-y-6">
                            <h1 className="text-4xl font-bold text-slate-900">{activeRoom.name}</h1>
                            <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
                                <span className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                                    <BedDouble size={16} /> Max {activeRoom.capacity} Guests
                                </span>
                            </div>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                {activeRoom.description || "Experience the perfect blend of comfort and style in this meticulously designed room."}
                            </p>
                        </div>

                        {/* Room Amenities */}
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Room Amenities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {activeRoom.amenities && activeRoom.amenities.length > 0 ? (
                                    activeRoom.amenities.map((amenity: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl">
                                        <CheckCircle size={18} className="text-slate-900" />
                                        <span className="font-medium text-slate-700">{typeof amenity === 'string' ? amenity : amenity.name}</span>
                                    </div>
                                    ))
                                ) : (
                                    ['Free Wi-Fi', 'Air Conditioning', 'Flat-screen TV', 'Private Bathroom', 'Room Service'].map((a, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl opacity-60">
                                        <CheckCircle size={18} className="text-slate-400" />
                                        <span className="font-medium text-slate-500">{a}</span>
                                    </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Booking Form */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                            <div>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Price per night</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-slate-900">K{activeRoom.base_price}</span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Calendar size={16} /> Select Dates
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Check-in</label>
                                        <input 
                                            type="date" 
                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                                            value={bookingDates.checkIn}
                                            onChange={(e) => setBookingDates(prev => ({ ...prev, checkIn: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Check-out</label>
                                        <input 
                                            type="date" 
                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                                            value={bookingDates.checkOut}
                                            onChange={(e) => setBookingDates(prev => ({ ...prev, checkOut: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                {nights > 1 && (
                                    <div className="pt-2 flex justify-between items-center text-sm font-medium text-slate-600">
                                        <span>{nights} nights x K{activeRoom.base_price}</span>
                                        <span className="text-slate-900 font-bold">K{activeRoom.base_price * nights}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-900 text-sm">Guest Details</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="First Name" 
                                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:border-slate-300 outline-none transition-colors"
                                        value={guestDetails.firstName}
                                        onChange={(e) => setGuestDetails(prev => ({ ...prev, firstName: e.target.value }))}
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Last Name" 
                                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:border-slate-300 outline-none transition-colors"
                                        value={guestDetails.lastName}
                                        onChange={(e) => setGuestDetails(prev => ({ ...prev, lastName: e.target.value }))}
                                    />
                                </div>
                                <input 
                                    type="email" 
                                    placeholder="Email Address" 
                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:border-slate-300 outline-none transition-colors"
                                    value={guestDetails.email}
                                    onChange={(e) => setGuestDetails(prev => ({ ...prev, email: e.target.value }))}
                                />
                                <input 
                                    type="tel" 
                                    placeholder="Phone Number" 
                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:border-slate-300 outline-none transition-colors"
                                    value={guestDetails.phone}
                                    onChange={(e) => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>

                            <button 
                                onClick={() => {
                                    addToCart(activeRoom, 'room');
                                    setActiveRoom(null); 
                                }}
                                disabled={!bookingDates.checkIn || !bookingDates.checkOut || !guestDetails.firstName || !guestDetails.email || (availableRoomTypes !== null && !availableRoomTypes.has(activeRoom.id))}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                Confirm Booking <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
         )}

      </main>

      {/* 4. Footer */}
      <footer className="bg-slate-900 text-white py-12 md:py-20 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-6">{property.name}</h3>
            <div className="space-y-4 text-slate-400">
              {property.address && <p className="flex items-center gap-3"><MapPin size={18} /> {property.address}</p>}
              {property.phone && <p className="flex items-center gap-3"><Phone size={18} /> {property.phone}</p>}
              {property.email && <p className="flex items-center gap-3"><Mail size={18} /> {property.email}</p>}
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col md:items-end justify-between">
             <div className="flex gap-4 mb-8">
                 <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"><Instagram size={20} /></div>
                 <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"><Facebook size={20} /></div>
                 <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"><Twitter size={20} /></div>
             </div>
             <p className="text-slate-500 text-sm">© {new Date().getFullYear()} {property.name}. All rights reserved.</p>
             <a href="https://www.zamoraapp.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 text-xs font-bold hover:text-white transition-colors mt-2">
                Powered By www.zamoraapp.com
             </a>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 pb-6 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
            onClick={() => { setActiveTab('rooms'); setActiveRoom(null); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'rooms' && !activeRoom ? 'text-black' : 'text-slate-500 hover:text-black'}`}
        >
            <BedDouble size={24} />
            <span className="text-[10px] font-bold">Rooms</span>
        </button>
        
        <button 
            onClick={() => { setActiveTab('food'); setActiveRoom(null); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'food' ? 'text-black' : 'text-slate-500 hover:text-black'}`}
        >
            <Utensils size={24} />
            <span className="text-[10px] font-bold">Food</span>
        </button>

        <button 
            onClick={() => { setActiveTab('amenities'); setActiveRoom(null); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'amenities' ? 'text-black' : 'text-slate-500 hover:text-black'}`}
        >
            <Info size={24} />
            <span className="text-[10px] font-bold">Info</span>
        </button>

        <button 
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-500 hover:text-black transition-colors relative"
        >
            <div className="relative">
                <ShoppingBag size={24} />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                )}
            </div>
            <span className="text-[10px] font-bold">Cart</span>
        </button>
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-black text-2xl flex items-center gap-2 tracking-tight text-slate-900">
                <ShoppingBag size={24} className="text-black" /> Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                  <ShoppingBag size={64} className="opacity-20" />
                  <p className="font-medium">Your cart is empty</p>
                  <button onClick={() => setIsCartOpen(false)} className="text-black font-bold underline">
                    Start Browsing
                  </button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {/* Image */}
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                           {item.type === 'room' ? <BedDouble size={24} /> : <Utensils size={24} />}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                       <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                            {item.type === 'room' && (
                                <p className="text-xs text-slate-500 mt-1">
                                    {item.bookingDates?.checkIn} - {item.bookingDates?.checkOut}
                                </p>
                            )}
                          </div>
                          <p className="font-bold text-slate-900">
                              K{item.type === 'room' ? item.calculatedPrice : item.price * item.quantity}
                          </p>
                       </div>
                       
                       <div className="flex justify-between items-end mt-2">
                           {item.type === 'food' ? (
                               <div className="flex items-center gap-3 bg-white rounded-full border border-slate-200 px-2 py-1">
                                   <button onClick={() => updateQuantity(index, -1)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><Minus size={14} /></button>
                                   <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                   <button onClick={() => updateQuantity(index, 1)} className="p-1 hover:bg-slate-100 rounded-full text-slate-900"><Plus size={14} /></button>
                               </div>
                           ) : (
                               <span className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded-md border border-slate-100">
                                   Room Booking
                               </span>
                           )}
                           
                           <button onClick={() => removeFromCart(index)} className="text-xs font-bold text-red-500 hover:text-red-600">Remove</button>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-slate-500 font-medium">Total</span>
                    <span className="text-3xl font-black text-slate-900">K{cartTotal}</span>
                </div>
                <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isCheckingOut}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCheckingOut ? 'Processing...' : 'Checkout'}
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import { useState } from 'react';
import { 
  ShoppingBag, Utensils, BedDouble, Search, Plus, Minus, X, 
  MapPin, Phone, Mail, Globe, Clock, CheckCircle, Star, 
  ChevronRight, ArrowRight, Instagram, Facebook, Twitter, Building2, ArrowLeft, Wifi, Tv, Coffee, Wind, ChevronLeft, Calendar, Home, Info, MoreHorizontal
} from 'lucide-react';
import Image from 'next/image';

interface PropertyStorefrontProps {
  property: any;
  roomTypes: any[];
  menuItems: any[];
  categories: any[];
}

export default function PropertyStorefront({ property, roomTypes, menuItems, categories }: PropertyStorefrontProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'dining' | 'amenities'>('overview');
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // -- Booking State --
  const [bookingDates, setBookingDates] = useState({ checkIn: '', checkOut: '' });
  const [guestDetails, setGuestDetails] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    specialRequests: '' 
  });

  const nights = bookingDates.checkIn && bookingDates.checkOut 
    ? Math.max(1, Math.ceil((new Date(bookingDates.checkOut).getTime() - new Date(bookingDates.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  // -- Cart Logic --
  const addToCart = (item: any, type: 'room' | 'food') => {
    setCart(prev => {
      // For rooms, we treat each booking configuration as unique if dates are involved
      // But for simplicity in this cart model, we'll just add it.
      // In a real app, we'd check dates too.
      
      // If adding a room from the booking page, include details
      const itemWithDetails = type === 'room' ? { 
        ...item, 
        bookingDates, 
        guestDetails,
        quantity: nights // Use nights as quantity for price calc? Or just 1 booking? 
                         // Usually cart item is 1 booking, price is total. 
                         // But cartTotal calc uses quantity. Let's say quantity = 1, price = base_price * nights.
        // Actually, let's keep quantity=1 and adjust price in the cart item to be total price
        // OR better: keep base_price and quantity=1, but add a 'totalPrice' field and update cartTotal logic
      } : item;

      // Simple implementation: Just add to cart
      return [...prev, { ...itemWithDetails, type, quantity: 1, calculatedPrice: item.base_price * nights }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQ = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQ };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => {
    if (item.type === 'room') {
      return sum + (item.calculatedPrice || item.base_price * item.quantity);
    }
    return sum + (item.price || item.base_price) * item.quantity;
  }, 0);

  // -- Filtering --
  const filteredMenu = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(i => i.category === selectedCategory);

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
            roomTypeId: item.id, // This is the room_type_id from the roomTypes array
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
      
      // TODO: Handle food orders similarly (requires Orders API)
      
      // Clear cart on success
      setCart([]);
      setIsCartOpen(false);
      alert('Booking confirmed! We look forward to your stay.');
      setActiveTab('overview');
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(`Checkout failed: ${error.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-black selection:text-white">
      
      {/* 1. Navbar - Fixed Top */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
            {/* Property Name/Logo */}
            <div className="font-black text-lg md:text-2xl tracking-tighter truncate max-w-[200px]">
                ZAMORA
            </div>

            {/* Desktop Tabs - Only show if not in room details */}
            {!activeRoom && (
              <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/50">
                  {['overview', 'rooms', 'dining', 'amenities'].map((tab) => (
                      <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                              activeTab === tab 
                              ? 'bg-black text-white shadow-lg transform scale-105' 
                              : 'text-slate-500 hover:text-black hover:bg-white'
                          }`}
                      >
                          {tab}
                      </button>
                  ))}
              </div>
            )}

            {/* Cart & Actions */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2 md:p-3 text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-300 group border border-transparent hover:border-slate-200"
                >
                    <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                    {cart.length > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 md:h-5 md:w-5 bg-black text-white text-[10px] md:text-xs font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce-subtle">
                            {cart.reduce((a, b) => a + b.quantity, 0)}
                        </span>
                    )}
                </button>
            </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      {!activeRoom && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 pb-safe">
           {[
             { id: 'overview', icon: Home, label: 'Home' },
             { id: 'rooms', icon: BedDouble, label: 'Sleep' },
             { id: 'dining', icon: Utensils, label: 'Eat' },
             { id: 'amenities', icon: Info, label: 'Info' }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                 activeTab === tab.id ? 'text-slate-900 scale-110' : 'text-slate-400'
               }`}
             >
               <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
               <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
             </button>
           ))}
        </div>
      )}

      {/* CONDITIONAL CONTENT RENDER */}
      {!activeRoom ? (
        <>
          {/* 2. Hero Section - Reduced Height & Modernized */}
          <div className="relative h-[55vh] w-full overflow-hidden mt-0 group">
             {/* Image Logic */}
             {property.cover_image_url ? (
                 <img src={property.cover_image_url} alt={property.name} className="w-full h-full object-cover transition-transform duration-[30s] ease-linear transform scale-100 group-hover:scale-110" />
             ) : (
                 <div className="w-full h-full bg-slate-900 flex items-center justify-center"><Building2 size={64} className="text-slate-700"/></div>
             )}
             
             <div className="absolute inset-0 bg-black/40"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
             
             <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 pt-20">
                <div className="animate-slide-up space-y-6 max-w-4xl mx-auto">
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-widest shadow-lg">
                        <Star size={12} className="fill-white" /> 
                        <span>Premier Destination</span>
                     </div>
                     <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                        {property.name}
                     </h1>
                     <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-white/90 text-sm font-medium drop-shadow-md">
                        {property.address && (
                            <div className="flex items-center gap-2">
                                <MapPin size={16} /> {property.address}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Clock size={16} /> Open 24/7
                        </div>
                     </div>
                </div>
             </div>
          </div>

          {/* 3. Main Content - Overlapping Card Effect */}
          <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 -mt-10 md:-mt-20 mb-24 md:mb-20">
             <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-6 md:p-12 min-h-[60vh] border border-slate-100">
                
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-20">
                
                {/* Intro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-4xl font-bold mb-6 text-slate-900 tracking-tight">Experience Unmatched Comfort</h2>
                      <p className="text-slate-600 leading-relaxed text-lg">
                        Welcome to <span className="font-semibold text-slate-900">{property.name}</span>. 
                        Whether you're seeking a peaceful retreat or a vibrant city stay, we've curated every detail to ensure your visit is exceptional. 
                        Immerse yourself in our hospitality.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => setActiveTab('rooms')} 
                        className="px-8 py-4 bg-black text-white font-bold rounded-full hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3 group"
                      >
                        Book a Stay 
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button 
                        onClick={() => setActiveTab('dining')} 
                        className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 font-bold rounded-full hover:border-black hover:bg-slate-50 transition-all flex items-center gap-3"
                      >
                        <Utensils size={18} />
                        View Menu
                      </button>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex gap-12">
                      <div>
                        <p className="text-3xl font-black text-slate-900">24/7</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Support</p>
                      </div>
                      <div>
                        <p className="text-3xl font-black text-slate-900">{property.amenities?.length || 0}+</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Amenities</p>
                      </div>
                      <div>
                        <p className="text-3xl font-black text-slate-900">4.9</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Rating</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    {property.gallery_urls?.slice(0, 3).map((url: string, i: number) => (
                      <div key={i} className={`rounded-3xl overflow-hidden shadow-lg ${i === 0 ? 'row-span-2 h-full' : 'h-48'}`}>
                        <img src={url} alt="Gallery" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                      </div>
                    ))}
                    {(!property.gallery_urls || property.gallery_urls.length === 0) && (
                       <div className="col-span-2 h-96 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                         <Building2 size={64} />
                       </div>
                    )}
                  </div>
                </div>

                {/* Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                      { icon: BedDouble, title: 'Premium Comfort', desc: 'Spaces designed for your ultimate relaxation.' },
                      { icon: Utensils, title: 'Culinary Delights', desc: 'Savor flavors crafted by expert chefs.' },
                      { icon: Star, title: '5-Star Service', desc: 'Dedicated team for a memorable stay.' }
                  ].map((feature, idx) => (
                      <div key={idx} className="p-8 bg-slate-50 rounded-[2rem] hover:bg-slate-100 transition-colors duration-300 group">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                          <feature.icon size={28} className="text-slate-900" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                      </div>
                  ))}
                </div>

              </div>
            )}

            {/* ROOMS TAB */}
            {activeTab === 'rooms' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl font-bold mb-4">Our Accommodations</h2>
                  <p className="text-slate-600">Choose from our selection of premium rooms and suites designed for your comfort.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {roomTypes.map(room => (
                    <div key={room.id} className="group bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                      <div className="h-64 relative overflow-hidden">
                        {room.image_url ? (
                          <img src={room.image_url} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <BedDouble size={48} />
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                          Max {room.capacity} Guests
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-slate-900">{room.name}</h3>
                          <div className="text-right">
                            <p className="text-lg font-black text-slate-900">K{room.base_price}</p>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">/ night</p>
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm mb-8 line-clamp-2 leading-relaxed">{room.description}</p>
                        
                        <button 
                          onClick={() => setActiveRoom(room)}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                          View Details & Book
                        </button>
                      </div>
                    </div>
                  ))}
                  {roomTypes.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl text-slate-400">
                      <BedDouble size={48} className="mx-auto mb-4 opacity-20" />
                      <p>No rooms available at the moment.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DINING TAB */}
            {activeTab === 'dining' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="text-3xl font-bold mb-4">Dining Menu</h2>
                  <p className="text-slate-600">Explore our culinary delights, from local favorites to international classics.</p>
                </div>

                {/* Category Filter */}
                <div className="flex justify-center flex-wrap gap-2 mb-12">
                  {['All', ...categories].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                        selectedCategory === cat 
                          ? 'bg-slate-900 text-white shadow-lg scale-105' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredMenu.map(item => (
                    <div key={item.id} className="flex gap-6 p-4 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                      <div className="w-32 h-32 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 relative shadow-md">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Utensils size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-2">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-lg text-slate-900">{item.name}</h4>
                            <span className="font-bold text-slate-900">K{item.price}</span>
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
                        </div>
                        <button 
                          onClick={() => addToCart(item, 'food')}
                          className="self-start text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 hover:text-slate-600 hover:border-slate-600 transition-colors flex items-center gap-1 mt-3"
                        >
                          Add to Order <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredMenu.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-400">
                      No items found in {selectedCategory}.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AMENITIES TAB */}
            {activeTab === 'amenities' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl font-bold mb-4">Amenities & Features</h2>
                  <p className="text-slate-600">Everything you need for a comfortable and enjoyable stay.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {property.amenities && property.amenities.length > 0 ? (
                    property.amenities.map((amenity: string, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-sm">
                          <CheckCircle size={20} />
                        </div>
                        <span className="font-bold text-slate-700">{amenity}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-slate-400">
                      No specific amenities listed.
                    </div>
                  )}
                </div>
              </div>
            )}

             </div>
          </div>
        </>
      ) : (
        /* ROOM DETAILS VIEW */
        <div className="animate-in fade-in slide-in-from-right duration-500 pt-20">
          
          {/* Header Actions */}
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-4">
             <button 
               onClick={() => setActiveRoom(null)}
               className="p-3 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm group"
             >
               <ArrowLeft size={20} className="text-slate-700 group-hover:-translate-x-1 transition-transform" />
             </button>
             <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Back to Rooms</span>
          </div>

          <div className="max-w-7xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-12">
             
             {/* Left Column: Media & Info */}
             <div className="lg:col-span-2 space-y-12">
                
                {/* Hero Carousel */}
                <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                   {/* Main Image */}
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
                     <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                        <BedDouble size={64} />
                     </div>
                   )}

                   {/* Carousel Controls */}
                   {activeRoom.gallery_urls && activeRoom.gallery_urls.length > 0 && (
                      <>
                         <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                               onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentImageIndex(prev => prev === 0 ? activeRoom.gallery_urls.length - 1 : prev - 1);
                               }}
                               className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 text-white transition-all transform hover:scale-110"
                            >
                               <ChevronLeft size={24} />
                            </button>
                            <button 
                               onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentImageIndex(prev => prev === activeRoom.gallery_urls.length - 1 ? 0 : prev + 1);
                               }}
                               className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 text-white transition-all transform hover:scale-110"
                            >
                               <ChevronRight size={24} />
                            </button>
                         </div>
                         
                         {/* Dots Indicator */}
                         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                            {activeRoom.gallery_urls.map((_: any, idx: number) => (
                               <button
                                  key={idx}
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                                     currentImageIndex === idx ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
                                  }`}
                               />
                            ))}
                         </div>
                      </>
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

                {/* Description */}
                <div className="space-y-6">
                   <h1 className="text-4xl font-bold text-slate-900">{activeRoom.name}</h1>
                   <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
                      <span className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                         <BedDouble size={16} /> Max {activeRoom.capacity} Guests
                      </span>
                      <span className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                         <Building2 size={16} /> {Math.floor(Math.random() * 30 + 20)}m²
                      </span>
                   </div>
                   <p className="text-lg text-slate-600 leading-relaxed">
                      {activeRoom.description || "Experience the perfect blend of comfort and style in this meticulously designed room. Featuring modern amenities and elegant furnishings, it offers a serene retreat for both business and leisure travelers."}
                   </p>
                </div>

                {/* Amenities */}
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

             {/* Right Column: Sticky Booking Card */}
             <div className="lg:col-span-1">
                <div className="sticky top-28 bg-white p-8 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-8">
                   
                   <div>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Starting from</p>
                      <div className="flex items-baseline gap-2">
                         <span className="text-5xl font-black text-slate-900">K{activeRoom.base_price}</span>
                         <span className="text-slate-500 font-medium">/ night</span>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                         <h4 className="font-bold text-slate-900 flex items-center gap-2">
                           <Calendar size={18} /> Select Dates
                         </h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500 uppercase">Check-in</label>
                               <input 
                                 type="date" 
                                 className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                                 value={bookingDates.checkIn}
                                 onChange={(e) => setBookingDates(prev => ({ ...prev, checkIn: e.target.value }))}
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500 uppercase">Check-out</label>
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

                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-900">Guest Details</h4>
                        <div className="grid grid-cols-2 gap-4">
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
                        <textarea 
                          placeholder="Special Requests (Optional)" 
                          rows={3}
                          className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:border-slate-300 outline-none transition-colors resize-none"
                          value={guestDetails.specialRequests}
                          onChange={(e) => setGuestDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                        />
                      </div>
                   </div>

                   <button 
                      onClick={() => {
                        addToCart(activeRoom, 'room');
                        setActiveRoom(null); 
                      }}
                      disabled={!bookingDates.checkIn || !bookingDates.checkOut || !guestDetails.firstName || !guestDetails.email}
                      className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                   >
                      Confirm Booking <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                   </button>

                   <p className="text-center text-xs text-slate-400 leading-relaxed">
                      You won't be charged yet. Additional taxes and fees may apply.
                   </p>

                </div>
             </div>

          </div>
        </div>
      )}

      {/* 4. Footer */}
      <footer className="bg-slate-900 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-6">{property.name}</h3>
            <div className="space-y-4 text-slate-400">
              {property.address && <p className="flex items-center gap-3"><MapPin size={18} /> {property.address}</p>}
              {property.phone && <p className="flex items-center gap-3"><Phone size={18} /> {property.phone}</p>}
              {property.email && <p className="flex items-center gap-3"><Mail size={18} /> {property.email}</p>}
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3 text-slate-400">
              <li><button onClick={() => { setActiveRoom(null); setActiveTab('rooms'); }} className="hover:text-white transition-colors">Accommodations</button></li>
              <li><button onClick={() => { setActiveRoom(null); setActiveTab('dining'); }} className="hover:text-white transition-colors">Dining</button></li>
              <li><button onClick={() => { setActiveRoom(null); setActiveTab('amenities'); }} className="hover:text-white transition-colors">Amenities</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Connect With Us</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-12 mt-12 pt-8 border-t border-white/10 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} {property.name}. All rights reserved. Powered by Zamora.
        </div>
      </footer>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-bold text-xl flex items-center gap-2">
                <ShoppingBag size={24} /> Your Selection
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag size={32} className="opacity-50" />
                  </div>
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <button onClick={() => { setIsCartOpen(false); setActiveTab('dining'); }} className="px-6 py-2 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors">
                    Browse Menu
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                       {item.image_url ? (
                         <img src={item.image_url} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-300"><Utensils size={20} /></div>
                       )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">{item.type === 'room' ? 'Accommodation' : 'Dining'}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">K{(item.price || item.base_price) * item.quantity}</span>
                        <div className="flex items-center gap-3 bg-slate-50 rounded-full px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm hover:text-red-600 transition-colors"><Minus size={12} /></button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm hover:text-green-600 transition-colors"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500 font-medium">Total Amount</span>
                <span className="text-3xl font-bold text-slate-900">K{cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isCheckingOut ? (
                  <>Processing...</>
                ) : (
                  <>Proceed to Checkout <ArrowRight size={20} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

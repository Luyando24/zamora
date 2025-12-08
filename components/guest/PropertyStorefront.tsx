'use client';

import { useState } from 'react';
import { 
  ShoppingBag, Utensils, BedDouble, Search, Plus, Minus, X, 
  MapPin, Phone, Mail, Globe, Clock, CheckCircle, Star, 
  ChevronRight, ArrowRight, Instagram, Facebook, Twitter, Building2
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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // -- Cart Logic --
  const addToCart = (item: any, type: 'room' | 'food') => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type);
      if (existing) {
        return prev.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, type, quantity: 1 }];
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

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || item.base_price) * item.quantity, 0);

  // -- Filtering --
  const filteredMenu = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(i => i.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-black selection:text-white">
      
      {/* 1. Navbar - Fixed Top */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
            {/* Property Name/Logo */}
            <div className="font-black text-xl md:text-2xl tracking-tighter truncate max-w-[200px]">
                ZAMORA
            </div>

            {/* Desktop Tabs */}
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

            {/* Cart & Actions */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-3 text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-300 group border border-transparent hover:border-slate-200"
                >
                    <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                    {cart.length > 0 && (
                        <span className="absolute top-1 right-1 h-5 w-5 bg-black text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce-subtle">
                            {cart.reduce((a, b) => a + b.quantity, 0)}
                        </span>
                    )}
                </button>
            </div>
        </div>
        
        {/* Mobile Tabs (Horizontal Scroll) */}
        <div className="md:hidden border-t border-slate-100 overflow-x-auto scrollbar-hide">
            <div className="flex px-4 py-3 gap-2 min-w-max">
                 {['overview', 'rooms', 'dining', 'amenities'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                            activeTab === tab 
                            ? 'bg-black text-white shadow-md' 
                            : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
      </nav>

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
      <main className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 -mt-20 mb-20">
         <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-6 md:p-12 min-h-[60vh] border border-slate-100">
            
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
                      onClick={() => addToCart(room, 'room')}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                      Book Now
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
      </main>

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
              <li><button onClick={() => setActiveTab('rooms')} className="hover:text-white transition-colors">Accommodations</button></li>
              <li><button onClick={() => setActiveTab('dining')} className="hover:text-white transition-colors">Dining</button></li>
              <li><button onClick={() => setActiveTab('amenities')} className="hover:text-white transition-colors">Amenities</button></li>
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
                disabled={cart.length === 0}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 transition-all transform active:scale-[0.98]"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

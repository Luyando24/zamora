'use client';

import { useState, useRef } from 'react';
import { 
  ShoppingBag, Utensils, Search, Plus, Minus, X, 
  MapPin, Phone, Clock, Star, ArrowRight, CheckCircle,
  Instagram, Facebook, Twitter, ChefHat, Coffee, Mail, Home
} from 'lucide-react';
import Image from 'next/image';
import FoodDetailsPage from './FoodDetailsPage';
import CheckoutPage from './CheckoutPage';

interface MenuStorefrontProps {
  property: any;
  menuItems: any[];
  categories: any[];
  roomNumber?: string;
}

export default function MenuStorefront({ property, menuItems, categories, roomNumber }: MenuStorefrontProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // -- Cart Logic --
  const addToCart = (item: any, quantity: number = 1, options: any = {}) => {
    setCart(prev => {
      // Create a unique ID for cart item if options differ (simplified logic for now)
      // For now, we'll just check ID. In a real app with options, we'd need a composite key.
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...item, type: 'food', quantity: quantity, ...options }];
    });
    setIsCartOpen(true);
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
  const filteredMenu = menuItems.filter(item => {
    const normalizedSelected = selectedCategory.toLowerCase().trim();
    const normalizedItemCategory = (item.category || '').toLowerCase().trim();
    
    const matchesCategory = selectedCategory === 'All' || normalizedItemCategory === normalizedSelected;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSearchClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        searchInputRef.current?.focus();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-black selection:text-white pb-20 md:pb-0">
      
      {/* 1. Navbar - Fixed Top */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-center md:justify-between gap-4">
            {/* Property Name/Logo */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="font-black text-2xl tracking-tighter leading-none text-slate-900">
                    ZAMORA
                </div>
            </div>

            {/* Search Bar - Moved to Top Menu */}
            <div className="flex-1 max-w-md mx-auto hidden md:block">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-400 group-focus-within:text-black transition-colors" />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search for dishes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 border border-slate-200 rounded-full focus:outline-none focus:border-black/30 focus:bg-white focus:ring-4 focus:ring-black/5 transition-all font-medium placeholder:text-slate-400 text-sm"
                    />
                </div>
            </div>

            {/* Cart & Actions (Desktop only for Cart button since we have bottom nav) */}
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

      {/* 2. Hero Section - Immersive & Clean */}
      <div className="relative h-[50vh] w-full overflow-hidden mt-0 group">
         {/* Background Image */}
         {property.cover_image_url ? (
             <img src={property.cover_image_url} alt={property.name} className="w-full h-full object-cover transition-transform duration-[30s] ease-linear transform scale-100 group-hover:scale-110" />
         ) : (
             <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
                <Utensils size={64} className="text-slate-700 relative z-10"/>
             </div>
         )}
         
         {/* Overlays */}
         <div className="absolute inset-0 bg-black/40 mix-blend-multiply"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
         
         <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 pt-20">
            <div className="animate-slide-up space-y-6 max-w-4xl mx-auto">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-widest shadow-lg">
                    <Star size={12} className="fill-white" /> 
                    <span>Culinary Experience</span>
                 </div>
                 <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                    {property.name} Menu
                 </h1>
                 <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md">
                    Explore a symphony of flavors crafted with passion.
                 </p>
            </div>
         </div>
      </div>

      {/* 3. Main Content - Overlapping Card */}
      <main className="max-w-7xl mx-auto px-1 md:px-6 relative z-10 -mt-24 mb-20">
         <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-3 md:p-10 min-h-[60vh] border border-slate-100">
            
            {/* Filter Header (Search removed from here) */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-6 md:mb-10 pb-4 md:pb-8 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <h2 className="hidden text-2xl font-bold text-slate-900 tracking-tight">Menu Categories</h2>
                </div>

                {/* Categories */}
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
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                {filteredMenu.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => setSelectedItem(item)}
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
                            
                            {/* Price Tag */}
                            <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/95 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-full shadow-lg z-10">
                                <span className="font-black text-slate-900 text-sm md:text-lg">K{item.price}</span>
                            </div>

                            {/* Dietary Info Badge (Moved from footer) */}
                            {item.dietary_info && (
                                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-green-50 text-green-700 rounded-md border border-green-100 shadow-sm">
                                        Vegetarian
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
                                        addToCart(item);
                                    }}
                                    className="w-full py-2 bg-white border border-slate-200 text-slate-900 rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
                                >
                                    <Plus size={14} /> Add
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredMenu.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-sm">
                        <Coffee size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No items found</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">We couldn't find any dishes matching your search or category.</p>
                    <button 
                        onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                        className="mt-6 px-6 py-2 bg-black text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg"
                    >
                        Clear Filters
                    </button>
                </div>
            )}
         </div>
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
          </div>
        </div>
      </footer>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 pb-6 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
            onClick={() => {
                setSelectedCategory('All');
                window.scrollTo({top: 0, behavior: 'smooth'});
            }} 
            className="flex flex-col items-center gap-1 text-slate-500 hover:text-black transition-colors"
        >
            <Home size={24} />
            <span className="text-[10px] font-bold">Home</span>
        </button>
        
        <button 
            onClick={handleSearchClick}
            className="flex flex-col items-center gap-1 text-slate-500 hover:text-black transition-colors"
        >
            <Search size={24} />
            <span className="text-[10px] font-bold">Search</span>
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

      {/* Cart Drawer - Modernized */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-black text-2xl flex items-center gap-2 tracking-tight text-slate-900">
                <ShoppingBag size={24} className="text-black" /> Your Order
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                    <ShoppingBag size={40} className="text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">Your cart is empty</p>
                    <p className="text-sm text-slate-400 max-w-[200px] mx-auto mt-2">Add some delicious items from the menu to get started.</p>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center group">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                       {item.image_url ? (
                         <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-300"><Utensils size={24} /></div>
                       )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-base mb-1 line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-slate-500 mb-3">{item.category}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-900">K{(item.price || item.base_price) * item.quantity}</span>
                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-2 py-1 border border-slate-200">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-red-600 transition-colors text-xs border border-slate-100"><Minus size={12} /></button>
                          <span className="text-sm font-bold w-4 text-center text-slate-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-green-600 transition-colors text-xs border border-slate-100"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500 font-medium">Total Amount</span>
                <span className="text-3xl font-black text-slate-900">K{cartTotal.toFixed(2)}</span>
              </div>
              <button 
                disabled={cart.length === 0}
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Checkout <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Food Details Overlay */}
      <FoodDetailsPage 
        item={selectedItem} 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        onAddToCart={addToCart}
        similarItems={menuItems.filter(i => i.id !== selectedItem?.id)}
      />

      <CheckoutPage 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        property={property}
        roomNumber={roomNumber}
        onOrderSuccess={() => {
          setCart([]);
          setIsCheckoutOpen(false);
        }}
      />
    </div>
  );
}

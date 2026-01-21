'use client';

import { useState, useRef, useEffect } from 'react';
import GuestNavbar from './GuestNavbar';
import {
  ShoppingBag, Utensils, Search, Plus, Minus, X, ArrowRight,
  MapPin, Clock, Share2, Heart, CheckCircle, Info, Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface RestaurantDetailsProps {
  property: any;
  menuItems: any[];
  categories: string[];
  barMenuItems?: any[];
  barCategories?: string[];
}

export default function RestaurantDetails({ property, menuItems, categories, barMenuItems = [], barCategories = [] }: RestaurantDetailsProps) {
  // Menu State
  const [activeTab, setActiveTab] = useState<'food' | 'drinks' | 'amenities' | 'photos'>('food');
  const [activeCategory, setActiveCategory] = useState(categories[0] || 'All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Booking State
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Refs for scrolling
  const menuRef = useRef<HTMLDivElement>(null);

  // -- Effects --
  useEffect(() => {
    const savedCart = localStorage.getItem('zamora_guest_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('zamora_guest_cart', JSON.stringify(cart));
  }, [cart]);

  // Cart Functions
  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
    toast.success(`Added ${item.name} to order`);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Determine current data source
  const currentItems = activeTab === 'food' ? menuItems : (activeTab === 'drinks' ? barMenuItems : []);
  const currentCategories = activeTab === 'food' ? categories : (activeTab === 'drinks' ? barCategories : []);

  // Reset category when tab changes
  useEffect(() => {
    setActiveCategory('All');
  }, [activeTab]);

  // Filter items
  const filteredItems = currentItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 relative">

      {/* Subtle Theme Background Accent */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-pink-100/60 to-transparent pointer-events-none" />

      <GuestNavbar cartCount={cart.reduce((a, b) => a + b.quantity, 0)} onCartClick={() => setIsCartOpen(true)} />

      <main className="pt-24 md:pt-28 relative z-10">
        <div className="max-w-7xl mx-auto px-1 md:px-6 mb-4">
          <Breadcrumb items={[
            { label: 'Explore', href: '/explore' },
            { label: property.name }
          ]} />
        </div>

        {/* Content Layout - Single Column for Menu */}
        <div className="max-w-7xl mx-auto px-1 md:px-6">

          {/* Menu Section */}
          <div id="menu" ref={menuRef}>
            {/* White Card Container */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-6 md:p-10 border border-slate-100">

              {/* Restaurant Header Info */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12 relative">
                <div>
                  <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">{property.name}</h1>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-slate-500 text-sm md:text-base">
                      <MapPin size={18} className="text-pink-500" />
                      <span>{property.address || 'Location details available upon request'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm md:text-base">
                      <Clock size={18} className="text-pink-500" />
                      <span>{property.opening_hours || 'Open daily 9:00 AM - 10:00 PM'}</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-0 right-0 md:static flex gap-3">
                  <button
                    onClick={() => {
                      setIsSaved(!isSaved);
                      toast.success(isSaved ? 'Removed from favorites' : 'Saved to favorites');
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-50 border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 transition-all active:scale-95"
                  >
                    <Heart size={18} className={isSaved ? "fill-pink-500 text-pink-500" : ""} />
                    <span className="hidden md:inline">Save</span>
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: property.name,
                          text: `Check out ${property.name} on Zamora!`,
                          url: window.location.href,
                        }).catch(() => { });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Link copied to clipboard');
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                  >
                    <Share2 size={18} />
                    <span className="hidden md:inline">Share</span>
                  </button>
                </div>
              </div>

              {/* Filter Header */}
              <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-6 md:mb-10 pb-4 md:pb-8 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  {/* Menu Type Switcher */}
                  <div className="flex bg-slate-100 p-1 rounded-full">
                    <button
                      onClick={() => setActiveTab('food')}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'food'
                          ? 'bg-white text-black shadow-md'
                          : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Food
                    </button>
                    <button
                      onClick={() => setActiveTab('drinks')}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'drinks'
                          ? 'bg-white text-black shadow-md'
                          : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Drinks
                    </button>
                    <button
                      onClick={() => setActiveTab('amenities')}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'amenities'
                          ? 'bg-white text-black shadow-md'
                          : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Amenities
                    </button>
                    <button
                      onClick={() => setActiveTab('photos')}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'photos'
                          ? 'bg-white text-black shadow-md'
                          : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Photos
                    </button>
                  </div>
                </div>

                {/* Categories */}
                {(activeTab === 'food' || activeTab === 'drinks') && (
                  <div className="flex overflow-x-auto gap-2 w-full md:w-auto pb-2 md:pb-0 scrollbar-hide mask-linear-fade [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <button
                      onClick={() => setActiveCategory('All')}
                      className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${activeCategory === 'All'
                          ? 'bg-black text-white shadow-lg transform scale-105'
                          : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-black'
                        }`}
                    >
                      All
                    </button>
                    {currentCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${activeCategory === cat
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

              {/* Menu Grid - Card Based */}
              {(activeTab === 'food' || activeTab === 'drinks') && (
                <>
                  <div className="grid grid-cols-2 gap-3 md:gap-6">
                    {filteredItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className="group bg-white rounded-2xl md:rounded-3xl border border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
                      >
                        {/* Image Area */}
                        <div className="aspect-square relative overflow-hidden bg-slate-100">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Utensils size={32} className="md:w-10 md:h-10" />
                            </div>
                          )}

                          {/* Price Tag */}
                          <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/95 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-full shadow-lg z-10">
                            <span className="font-black text-slate-900 text-sm md:text-lg">K{item.price}</span>
                          </div>

                          {/* Badges Container */}
                          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 flex flex-col gap-1 items-start max-w-[70%]">
                            {item.dietary_info && (
                              <div className="flex gap-1 flex-wrap">
                                {item.dietary_info.split(',').map((tag: string, i: number) => (
                                  <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white/90 backdrop-blur-sm text-slate-700 rounded-md shadow-sm border border-slate-100 truncate">
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-3 md:p-6 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-sm md:text-lg text-slate-900 leading-tight group-hover:text-slate-700 transition-colors line-clamp-2">{item.name}</h3>
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

                  {filteredItems.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-sm">
                        <Utensils size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No items found</h3>
                      <p className="text-slate-500 max-w-xs mx-auto">We couldn&apos;t find any items matching your search or category.</p>
                      <button
                        onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                        className="mt-6 px-6 py-2 bg-black text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Amenities Grid */}
              {activeTab === 'amenities' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-500">
                  {property.amenities && property.amenities.length > 0 ? (
                    property.amenities.map((amenity: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-4 md:p-6 bg-white rounded-2xl md:rounded-3xl border border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all group">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-900 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          <CheckCircle size={20} className="md:w-6 md:h-6" />
                        </div>
                        <span className="font-bold text-slate-700 group-hover:text-slate-900 text-sm md:text-base">
                          {typeof amenity === 'string' ? amenity : amenity.name}
                        </span>
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

              {/* Photos Grid */}
              {activeTab === 'photos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
                  {property.gallery_urls && property.gallery_urls.length > 0 ? (
                    property.gallery_urls.map((url: string, index: number) => (
                      <div key={index} className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative">
                        <Image
                          src={url}
                          alt={`${property.name} photo ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          unoptimized
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 text-slate-400">
                      <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                      <p>No photos available.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Floating Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-96 z-40 animate-in slide-in-from-bottom duration-300">
          <div className="bg-pink-500 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-pink-400 backdrop-blur-md bg-opacity-95 shadow-pink-200">
            <div className="flex flex-col">
              <span className="text-xs text-white/90 font-bold uppercase tracking-wider">{cart.reduce((a, b) => a + b.quantity, 0)} Items</span>
              <span className="text-xl font-black">K{(cartTotal || 0).toFixed(2)}</span>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-white text-pink-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors flex items-center gap-2 shadow-sm transform active:scale-95"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

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
                    <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 flex items-center justify-center p-2 relative">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500 rounded-xl"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Utensils size={24} className="opacity-50" />
                        </div>
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
                  // Checkout logic (WhatsApp for now in this component)
                  const message = `Hi, I'd like to place an order at ${property.name}:\n\n${cart.map(i => `${i.quantity}x ${i.name} (K${i.price})`).join('\n')}\n\nTotal: K${cartTotal}`;
                  const whatsappUrl = `https://wa.me/${property.phone || ''}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Checkout (WhatsApp) <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import { useState } from 'react';
import { ShoppingBag, Utensils, BedDouble, Search, Plus, Minus, X } from 'lucide-react';
import Image from 'next/image';

interface HotelStorefrontProps {
  hotel: any;
  roomTypes: any[];
  menuItems: any[];
  categories: any[];
}

export default function HotelStorefront({ hotel, roomTypes, menuItems, categories }: HotelStorefrontProps) {
  const [activeTab, setActiveTab] = useState<'rooms' | 'menu'>('menu'); // Default to menu as it's more frequent for guests
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {hotel.logo_url ? (
               <img src={hotel.logo_url} alt={hotel.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
             ) : (
               <div className="w-10 h-10 rounded-full bg-zambia-green text-white flex items-center justify-center font-bold">
                 {hotel.name.charAt(0)}
               </div>
             )}
             <h1 className="font-bold text-gray-900 truncate max-w-[150px] sm:max-w-xs">{hotel.name}</h1>
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ShoppingBag size={24} />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 h-5 w-5 bg-zambia-green text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'menu' ? 'border-zambia-green text-zambia-green' : 'border-transparent text-gray-500'
            }`}
          >
            <Utensils size={18} /> Menu
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'rooms' ? 'border-zambia-green text-zambia-green' : 'border-transparent text-gray-500'
            }`}
          >
            <BedDouble size={18} /> Rooms
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        
        {/* MENU VIEW */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['All', ...categories].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMenu.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4">
                  <div className="w-24 h-24 bg-white rounded-lg flex-shrink-0 relative overflow-hidden flex items-center justify-center p-2 border border-gray-100">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Utensils size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="font-bold text-zambia-copper">K{item.price}</span>
                      <button 
                        onClick={() => addToCart(item, 'food')}
                        className="p-2 bg-gray-100 hover:bg-zambia-green hover:text-white text-gray-700 rounded-lg transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredMenu.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  No items found in {selectedCategory}.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROOMS VIEW */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            {roomTypes.map(room => (
              <div key={room.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-48 bg-gray-200 relative">
                  {room.image_url ? (
                    <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                       <BedDouble size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    Max {room.capacity} Guests
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                    <div className="text-right">
                       <p className="text-xl font-bold text-zambia-copper">K{room.base_price}</p>
                       <p className="text-xs text-gray-500">per night</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{room.description}</p>
                  
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {room.amenities.map((a: any, i: number) => (
                        <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-200">
                          {a.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={() => addToCart(room, 'room')}
                    className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
                  >
                    Select Room
                  </button>
                </div>
              </div>
            ))}
             {roomTypes.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No rooms available at the moment.
                </div>
              )}
          </div>
        )}

      </main>

      {/* Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <ShoppingBag size={20} /> Your Order
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-200 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <ShoppingBag size={48} className="opacity-20" />
                  <p>Your cart is empty.</p>
                  <button onClick={() => setIsCartOpen(false)} className="text-zambia-green font-medium hover:underline">
                    Browse Menu
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                       {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">{item.type === 'room' ? 'Room Booking' : 'Food Item'}</p>
                      <div className="text-zambia-copper font-bold text-sm mt-1">
                        K{(item.price || item.base_price) * item.quantity}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 bg-gray-50 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-green-600"><Plus size={14} /></button>
                      <span className="text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-600"><Minus size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold text-gray-900">K{cartTotal.toFixed(2)}</span>
              </div>
              <button 
                disabled={cart.length === 0}
                className="w-full py-3 bg-zambia-green text-white rounded-lg font-bold hover:bg-zambia-green/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Checkout (Demo)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

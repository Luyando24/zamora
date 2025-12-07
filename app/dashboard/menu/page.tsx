'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useMenuCategories } from '@/hooks/useMenuCategories';
import CategoryManager from './components/CategoryManager';
import ShareMenuModal from './components/ShareMenuModal';
import { Plus, Edit, Trash2, UtensilsCrossed, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [hotelId, setHotelId] = useState<string>('');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { categories: dbCategories, loading: categoriesLoading } = useMenuCategories();

  useEffect(() => {
    fetchItems();
    fetchHotelId();
  }, []);

  const fetchHotelId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.hotel_id) {
      setHotelId(user.user_metadata.hotel_id);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('menu_items').select('*').order('name');
    if (data) setItems(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchItems();
  };

  const filteredItems = filter === 'All' ? items : items.filter(i => i.category === filter);
  
  // Combine 'All' with fetched categories
  const displayCategories = ['All', ...dbCategories.map(c => c.name)];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Food & Beverage Menu</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium transition-colors"
            title="Share Menu Link / QR Code"
          >
            <QrCode size={18} /> <span className="hidden sm:inline">Share Menu</span>
          </button>
          <CategoryManager />
          <Link
            href="/dashboard/menu/new"
            className="flex items-center gap-2 px-4 py-2 bg-zambia-green text-white rounded hover:bg-zambia-green/90"
          >
            <Plus size={18} /> Add Item
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4 overflow-x-auto">
        {displayCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === cat 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading menu...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                 {item.image_url ? (
                   <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                 ) : (
                   <UtensilsCrossed className="text-gray-300" size={48} />
                 )}
                 {!item.is_available && (
                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                     <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase rounded">Sold Out</span>
                   </div>
                 )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                   <div>
                     <h3 className="font-bold text-gray-900">{item.name}</h3>
                     <p className="text-xs text-gray-500 uppercase mt-1">{item.category}</p>
                   </div>
                   <p className="font-bold text-zambia-copper">K{item.price}</p>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2 flex-1">{item.description}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                  <Link 
                    href={`/dashboard/menu/${item.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={18} />
                  </Link>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
             <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
               No items found in this category.
             </div>
          )}
        </div>
      )}

      <ShareMenuModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        hotelId={hotelId}
      />
    </div>
  );
}

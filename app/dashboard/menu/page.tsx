'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useMenuCategories } from '@/hooks/useMenuCategories';
import CategoryManager from './components/CategoryManager';
import ShareMenuModal from './components/ShareMenuModal';
import { Plus, Edit, Trash2, UtensilsCrossed, QrCode, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const supabase = createClient();
  
  // Independent categories
  const { categories: dbCategories, loading: categoriesLoading } = useMenuCategories();

  const fetchProperties = async () => {
    try {
        // Add a timeout race
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Properties timeout')), 5000));
        const fetch = supabase.from('properties').select('id, name, created_by');
        
        const { data: properties, error } = await Promise.race([fetch, timeout]) as any;

      if (error) {
        console.error('Supabase error fetching properties:', error);
        return; 
      }

      if (properties && properties.length > 0) {
        setProperties(properties);
        const saved = localStorage.getItem('zamora_selected_property');
        if (saved && (saved === 'all' || properties.find(p => p.id === saved))) {
            setSelectedPropertyId(saved);
        } else {
            setSelectedPropertyId(properties.length > 1 ? 'all' : properties[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newId = e.target.value;
      setSelectedPropertyId(newId);
      localStorage.setItem('zamora_selected_property', newId);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
        console.log('Fetching items...');
        
        // Timeout race for items
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Items fetch timeout')), 8000));
        
        // Use raw select first to check if table is reachable
        const fetch = supabase
            .from('menu_items')
            .select('id, name, category, price, description, image_url, is_available') // Select specific columns to avoid potentially corrupt ones
            .limit(50); 
        
        const { data, error } = await Promise.race([fetch, timeout]) as any;
        
        console.log('Fetch result:', { data, error });
        
        if (error) {
            console.error('Error fetching items:', error);
            // If error is related to column not found, alert it
            if (error.code === 'PGRST301') {
                alert('Database schema error: ' + error.message);
            } else {
                alert('Error fetching items: ' + error.message);
            }
        } else if (data) {
            console.log('Items fetched:', data.length);
            setItems(data);
        }
    } catch (err: any) {
        console.error('Exception fetching items:', err);
        alert('Exception: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    console.log('MenuPage mounted');
    // Run independently
    fetchProperties();
    fetchItems();
  }, []);

  console.log('Render: loading=', loading, 'categoriesLoading=', categoriesLoading);

  if (loading || categoriesLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zambia-green" />
            <p className="text-gray-500">Loading menu...</p>
            {loading && <p className="text-xs text-red-400">Waiting for items (8s timeout)...</p>}
            {categoriesLoading && <p className="text-xs text-blue-400">Waiting for categories...</p>}
            <button 
                onClick={() => window.location.reload()}
                className="mt-4 text-xs underline text-gray-400 hover:text-gray-600"
            >
                Reload Page
            </button>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) alert(error.message);
    else setItems(prev => prev.filter(item => item.id !== id));
  };

  const filteredItems = filter === 'All' ? items : items.filter(i => (i.category || '').toLowerCase().trim() === filter.toLowerCase().trim());
  
  // Combine 'All' with fetched categories
  const displayCategories = ['All', ...dbCategories.map(c => c.name)];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Food & Beverage Menu</h1>
            <p className="text-sm text-gray-500">Manage your digital menu items.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
           {/* Property Selector - For Context/Sharing Only */}
           {properties.length > 1 && (
               <div className="relative">
                   <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <select 
                       value={selectedPropertyId}
                       onChange={handlePropertyChange}
                       className="pl-9 pr-8 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium transition-colors appearance-none focus:ring-2 focus:ring-zambia-green focus:border-transparent outline-none cursor-pointer"
                       title="Select Property context for Sharing"
                   >
                       <option value="all">All Properties</option>
                       {properties.map(p => (
                           <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                   </select>
               </div>
           )}

          <button
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium transition-colors"
            title="Share Menu Link / QR Code"
            disabled={!selectedPropertyId || selectedPropertyId === 'all'}
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
        <div className="text-center py-12 text-gray-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            Loading menu items...
        </div>
      ) : categoriesLoading ? (
        <div className="text-center py-12 text-gray-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zambia-green mb-2"></div>
            Loading categories...
        </div>
      ) : (
        <>
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No menu items found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first dish.</p>
            <Link
              href="/dashboard/menu/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zambia-green text-white rounded hover:bg-zambia-green/90"
            >
              <Plus size={18} /> Add Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                       <p className="text-xs text-gray-500 uppercase mt-1">
                         {item.category}
                       </p>
                     </div>
                     <p className="font-bold text-zambia-copper">K{item.price}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2 flex-1">{item.description}</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                     <Link 
                       href={`/dashboard/menu/${item.id}`}
                       className="p-2 text-gray-400 hover:text-zambia-green transition-colors"
                     >
                       <Edit size={18} />
                     </Link>
                     <button 
                       onClick={() => handleDelete(item.id)}
                       className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                     >
                       <Trash2 size={18} />
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
      )}

      {/* Floating Action Button */}
      <Link
        href="/dashboard/menu/new"
        className="fixed bottom-8 right-8 bg-zambia-green text-white p-4 rounded-full shadow-lg hover:bg-zambia-green/90 transition-all hover:scale-105 z-10"
        title="Add New Item"
      >
        <Plus size={24} />
      </Link>

      <ShareMenuModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        hotelId={selectedPropertyId}
        hotelName={properties.find(p => p.id === selectedPropertyId)?.name}
        properties={properties}
      />
    </div>
  );
}

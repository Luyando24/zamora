'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '../context/PropertyContext';
import { useBarMenuCategories } from '@/hooks/useBarMenuCategories';
import { generateMenuPdf } from './utils/generateMenuPdf';
import CategoryManager from './components/CategoryManager';
import ShareMenuModal from './components/ShareMenuModal';
import { Plus, Edit, Trash2, UtensilsCrossed, QrCode, Building2, FileText, Wine, Beer, Martini, Search } from 'lucide-react';
import Link from 'next/link';

export default function BarMenuPage() {
  const { selectedProperty, selectedPropertyId, setSelectedPropertyId, properties } = useProperty();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const supabase = createClient();
  
  // Independent categories
  const { categories: dbCategories, loading: categoriesLoading } = useBarMenuCategories(selectedPropertyId);

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedPropertyId(e.target.value);
  };

  const fetchItems = async () => {
    if (!selectedPropertyId) return;
    setLoading(true);
    try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Items fetch timeout')), 8000));
        
        const fetch = supabase
            .from('bar_menu_items')
            .select('*, bar_menu_item_properties!inner(property_id)') 
            .eq('bar_menu_item_properties.property_id', selectedPropertyId);
        
        const { data, error } = await Promise.race([fetch, timeout]) as any;
        
        if (error) {
            if (error.code === 'PGRST301' || error.code === '42P01') {
                alert('Database schema error: ' + error.message + '. Please ensure the bar_menu_items table exists.');
            } else {
                alert('Error fetching items: ' + (error.message || JSON.stringify(error)));
            }
        } else if (data) {
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
    fetchItems();
  }, [selectedPropertyId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bar menu item?')) return;
    const { error } = await supabase.from('bar_menu_items').delete().eq('id', id);
    if (error) alert(error.message);
    else setItems(prev => prev.filter(item => item.id !== id));
  };

  const filteredItems = items.filter(i => {
      const matchesCategory = filter === 'All' || (i.category || '').toLowerCase().trim() === filter.toLowerCase().trim();
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (i.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
  });
  
  const displayCategories = ['All', ...dbCategories.map(c => c.name)];

  if (loading || categoriesLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
            <p className="text-slate-500 font-medium">Mixing your menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bar Menu</h1>
                <p className="text-slate-500 mt-1">Curate your drink selection and manage inventory.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
               {/* Property Selector */}
               {properties.length > 1 && (
                   <div className="relative group">
                       <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-pink-500 transition-colors" size={18} />
                       <select 
                           value={selectedPropertyId || ''}
                           onChange={handlePropertyChange}
                           className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-white hover:border-pink-200 hover:ring-2 hover:ring-pink-50 font-bold transition-all appearance-none outline-none cursor-pointer w-full md:w-auto"
                       >
                           <option value="all">All Locations</option>
                           {properties.map(p => (
                               <option key={p.id} value={p.id}>{p.name}</option>
                           ))}
                       </select>
                   </div>
               )}

              <button
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-bold transition-colors"
                disabled={!selectedPropertyId || selectedPropertyId === 'all'}
                title="Share Digital Menu"
              >
                <QrCode size={18} /> <span className="hidden sm:inline">QR Code</span>
              </button>

              <button
                onClick={() => {
                    const hotelName = properties.find(p => p.id === selectedPropertyId)?.name || 'Bar Menu';
                    generateMenuPdf(filteredItems, hotelName);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-bold transition-colors"
                title="Download Print-Ready Menu"
              >
                <FileText size={18} /> <span className="hidden sm:inline">PDF</span>
              </button>
              
              <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

              <CategoryManager />
              
              <Link
                href="/dashboard/bar-menu/new"
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Plus size={18} strokeWidth={3} /> Add Drink
              </Link>
            </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar mask-linear-fade">
                {displayCategories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    filter === cat 
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-200' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    {cat}
                </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search drinks..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                />
            </div>
        </div>
      </div>

      {/* Menu Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                <Martini className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No drinks found</h3>
            <p className="text-slate-500 mb-6 max-w-xs mx-auto">
                {searchQuery ? `No results for "${searchQuery}"` : "Get started by adding your first signature cocktail or beverage."}
            </p>
            <Link
                href="/dashboard/bar-menu/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-500 transition-all shadow-lg shadow-pink-200"
            >
                <Plus size={18} strokeWidth={3} /> Add First Drink
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
            <div key={item.id} className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
            {/* Image Area */}
            <div className="h-48 bg-slate-100 relative overflow-hidden">
                {item.image_url ? (
                    <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <Wine className="text-slate-300 opacity-50" size={48} />
                    </div>
                )}
                
                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {!item.is_available && (
                        <span className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                            Sold Out
                        </span>
                    )}
                    {item.discount_badge && (
                        <span className="bg-pink-500/90 backdrop-blur-sm text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3" /> {item.discount_badge}
                        </span>
                    )}
                </div>

                {/* Price Tag Overlay */}
                <div className="absolute bottom-3 right-3">
                    <span className="bg-white/95 backdrop-blur-md text-slate-900 px-4 py-2 text-sm font-black rounded-xl shadow-lg border border-white/20">
                        K{item.price}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="mb-3">
                    <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-bold text-pink-600 uppercase tracking-wider">{item.category}</p>
                        {item.weight && (
                            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                {item.weight}
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-pink-600 transition-colors">
                        {item.name}
                    </h3>
                </div>

                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                    {item.description || 'No description available.'}
                </p>
                
                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-xs font-bold text-slate-400">
                        {/* Placeholder for future stock count or similar */}
                        ID: {item.id.slice(0,4)}
                    </span>
                    <div className="flex gap-2">
                        <Link 
                            href={`/dashboard/bar-menu/${item.id}`}
                            className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit size={18} />
                        </Link>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
            </div>
        ))}
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      <Link
        href="/dashboard/bar-menu/new"
        className="md:hidden fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-full shadow-xl shadow-slate-900/30 hover:bg-slate-800 transition-all hover:scale-110 z-50"
      >
        <Plus size={24} />
      </Link>

      <ShareMenuModal 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        hotelId={selectedPropertyId}
        properties={properties}
      />
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6 20.25a.75.75 0 01.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 01.75.75v.008c0 .414-.336.75-.75.75h-.008a.75.75 0 01-.75-.75v-.008c0-.414-.336-.75-.75-.75h-.008a.75.75 0 01-.75-.75v-.008c0-.414.336-.75.75-.75h.008a.75.75 0 01.75.75v.008c0 .414-.336.75-.75.75h-.008a.75.75 0 01-.75-.75v-.008c0-.414.336-.75.75-.75h.008zm11.25-15a.75.75 0 00-1.5 0v.008c0 .414-.336.75-.75.75h-.008a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75v-.008c0-.414.336-.75.75-.75h.008a.75.75 0 00.75.75v.008c0 .414-.336.75-.75.75h-.008a.75.75 0 00-.75-.75v-.008c0-.414.336-.75.75-.75h.008a.75.75 0 00.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75v-.008c0-.414-.336-.75-.75-.75h-.008a.75.75 0 00-.75.75v-.008c0-.414.336-.75.75-.75h.008z" clipRule="evenodd" />
        </svg>
    );
}

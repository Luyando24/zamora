'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '../context/PropertyContext';
import { useMenuCategories } from '@/hooks/useMenuCategories';
import { useBarMenuCategories } from '@/hooks/useBarMenuCategories';
import FoodCategoryManager from './components/CategoryManager';
import BarCategoryManager from '../bar-menu/components/CategoryManager';
import ShareMenuModal from './components/ShareMenuModal';
import { generateMenuPdf } from '../bar-menu/utils/generateMenuPdf';
import { Plus, Edit, Trash2, UtensilsCrossed, QrCode, Building2, FileText, Search, ChefHat, Sparkles, Wine, Martini } from 'lucide-react';
import Link from 'next/link';

export default function MenuPage() {
  const { selectedProperty, selectedPropertyId, setSelectedPropertyId, properties } = useProperty();
  const [activeTab, setActiveTab] = useState<'food' | 'bar'>('food');
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [barItems, setBarItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const supabase = createClient();
  
  // Categories
  const { categories: foodCategories, loading: foodCategoriesLoading } = useMenuCategories(selectedPropertyId);
  const { categories: barCategories, loading: barCategoriesLoading } = useBarMenuCategories(selectedPropertyId);

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedPropertyId(e.target.value);
  };

  const fetchItems = async () => {
    if (!selectedPropertyId) return;
    setLoading(true);
    try {
        console.log('Fetching items for property:', selectedPropertyId);
        
        // Fetch Food Items via Junction
        const foodPromise = supabase
            .from('menu_items')
            .select('*, menu_item_properties!inner(property_id, is_available)')
            .eq('menu_item_properties.property_id', selectedPropertyId);

        // Fetch Bar Items via Junction
        const barPromise = supabase
            .from('bar_menu_items')
            .select('*, bar_menu_item_properties!inner(property_id)')
            .eq('bar_menu_item_properties.property_id', selectedPropertyId);
        
        const [foodResult, barResult] = await Promise.all([foodPromise, barPromise]);
        
        if (foodResult.error) {
            console.error('Error fetching food items:', foodResult.error);
        } else if (foodResult.data) {
            setFoodItems(foodResult.data);
        }

        if (barResult.error) {
            console.error('Error fetching bar items:', barResult.error);
        } else if (barResult.data) {
            setBarItems(barResult.data);
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
    const isFood = activeTab === 'food';
    const tableName = isFood ? 'menu_items' : 'bar_menu_items';
    
    if (!confirm(`Delete this ${isFood ? 'menu' : 'bar'} item?`)) return;

    if (isFood) {
        // 1. Manually unlink related order items to avoid FK constraint violation
        const { error: unlinkError } = await supabase
        .from('order_items')
        .update({ menu_item_id: null })
        .eq('menu_item_id', id);

        if (unlinkError) {
            console.error('Error unlinking order items:', unlinkError);
        }
    }
    
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    
    if (error) {
       alert(error.message);
    } else {
      if (isFood) {
        setFoodItems(prev => prev.filter(item => item.id !== id));
      } else {
        setBarItems(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const currentItems = activeTab === 'food' ? foodItems : barItems;
  const currentCategories = activeTab === 'food' ? foodCategories : barCategories;
  const categoriesLoading = activeTab === 'food' ? foodCategoriesLoading : barCategoriesLoading;

  const filteredItems = currentItems.filter(i => {
      const matchesCategory = filter === 'All' || (i.category || '').toLowerCase().trim() === filter.toLowerCase().trim();
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (i.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
  });
  
  // Combine 'All' with fetched categories
  const displayCategories = ['All', ...currentCategories.map(c => c.name)];


  if (loading || categoriesLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
            <p className="text-slate-500 font-medium">Preparing your menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
                {selectedProperty?.logo_url && selectedPropertyId !== 'all' ? (
                    <img 
                        src={selectedProperty.logo_url} 
                        alt={selectedProperty.name} 
                        className="h-16 w-16 object-contain rounded-xl border border-slate-100 p-1 bg-white" 
                    />
                ) : (
                    <div className="h-16 w-16 bg-pink-50 rounded-xl flex items-center justify-center border border-pink-100">
                        {activeTab === 'food' ? (
                             <ChefHat className="text-pink-600" size={32} />
                        ) : (
                             <Wine className="text-pink-600" size={32} />
                        )}
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        {selectedProperty && selectedPropertyId !== 'all' ? selectedProperty.name : 'Food & Bar Menu'}
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your {activeTab === 'food' ? 'culinary offerings' : 'drink selection'}.</p>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
               {/* Property Selector */}
               {properties.length > 1 && (
                   <div className="relative group">
                       <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-pink-600 transition-colors" size={18} />
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

              {activeTab === 'food' ? (
                <button
                    onClick={() => {
                        const printUrl = `/dashboard/menu/print?propertyId=${selectedPropertyId}`;
                        window.open(printUrl, '_blank');
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-bold transition-colors"
                    title="Open Print Layout"
                >
                    <FileText size={18} /> <span className="hidden sm:inline">Print View</span>
                </button>
              ) : (
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
              )}
              
              <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

              {activeTab === 'food' ? <FoodCategoryManager /> : <BarCategoryManager />}
              
              <Link
                href={activeTab === 'food' ? "/dashboard/menu/new" : "/dashboard/bar-menu/new"}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Plus size={18} strokeWidth={3} /> {activeTab === 'food' ? 'Add Dish' : 'Add Drink'}
              </Link>
            </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 border-b border-slate-200">
            <div className="flex gap-8">
                <button
                    onClick={() => { setActiveTab('food'); setFilter('All'); }}
                    className={`pb-4 px-2 text-sm font-bold transition-all relative ${
                        activeTab === 'food'
                            ? 'text-pink-600'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed size={18} />
                        Food Menu
                    </div>
                    {activeTab === 'food' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => { setActiveTab('bar'); setFilter('All'); }}
                    className={`pb-4 px-2 text-sm font-bold transition-all relative ${
                        activeTab === 'bar'
                            ? 'text-pink-600'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Wine size={18} />
                        Bar Menu
                    </div>
                    {activeTab === 'bar' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-600 rounded-t-full" />
                    )}
                </button>
            </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
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
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text"
                    placeholder={`Search ${activeTab === 'food' ? 'dishes' : 'drinks'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all shadow-sm"
                />
            </div>
        </div>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-2"></div>
            Loading menu items...
        </div>
      ) : categoriesLoading ? (
        <div className="text-center py-12 text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mb-2"></div>
            Loading categories...
        </div>
      ) : (
        <>
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
            {activeTab === 'food' ? (
                 <UtensilsCrossed className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            ) : (
                 <Martini className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            )}
            <h3 className="text-lg font-bold text-slate-900">No {activeTab === 'food' ? 'menu' : 'bar'} items found</h3>
            <p className="text-slate-500 mb-6">Get started by creating your first {activeTab === 'food' ? 'dish' : 'drink'}.</p>
            <Link
              href={activeTab === 'food' ? "/dashboard/menu/new" : "/dashboard/bar-menu/new"}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg hover:shadow-pink-200"
            >
              <Plus size={18} strokeWidth={3} /> Add Item
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
                        {activeTab === 'food' ? (
                            <UtensilsCrossed className="text-slate-300 opacity-50" size={48} />
                        ) : (
                            <Wine className="text-slate-300 opacity-50" size={48} />
                        )}
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
                        <span className="bg-pink-600/90 backdrop-blur-sm text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {item.discount_badge}
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
                    {item.dietary_info && activeTab === 'food' && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <ChefHat size={12} /> {item.dietary_info}
                        </p>
                    )}
                </div>

                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                    {item.description || 'No description available.'}
                </p>
                
                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-xs font-bold text-slate-400">
                        ID: {item.id.slice(0,4)}
                    </span>
                    <div className="flex gap-2">
                        <Link 
                            href={activeTab === 'food' ? `/dashboard/menu/${item.id}` : `/dashboard/bar-menu/${item.id}`}
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
        </>
      )}

      {/* Floating Action Button (Mobile) */}
      <Link
        href={activeTab === 'food' ? "/dashboard/menu/new" : "/dashboard/bar-menu/new"}
        className="md:hidden fixed bottom-8 right-8 bg-pink-600 text-white p-4 rounded-full shadow-xl hover:bg-pink-700 transition-all hover:scale-105 z-10"
        title="Add New Item"
      >
        <Plus size={24} />
      </Link>

      <ShareMenuModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        hotelId={selectedPropertyId || ''}
        hotelName={properties.find(p => p.id === selectedPropertyId)?.name}
        properties={properties}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { 
  Plus, Search, MapPin, Edit, Trash2, Loader2, 
  ShoppingBag, Utensils, Building2, Palmtree, 
  MoreVertical, Store
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PlacesPage() {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaces(data || []);
    } catch (error) {
      console.error('Error fetching places:', error);
      toast.error('Failed to load places');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this place?')) return;
    
    setDeletingId(id);
    try {
      const { error } = await supabase.from('places').delete().eq('id', id);
      if (error) throw error;
      
      setPlaces(prev => prev.filter(p => p.id !== id));
      toast.success('Place deleted successfully');
    } catch (error) {
      console.error('Error deleting place:', error);
      toast.error('Failed to delete place');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPlaces = places.filter(place => 
    place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    place.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case 'restaurant': return <Utensils size={18} />;
      case 'shopping': return <ShoppingBag size={18} />;
      case 'museum': return <Building2 size={18} />;
      case 'park': return <Palmtree size={18} />;
      default: return <Store size={18} />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Places</h1>
          <p className="text-slate-500">Manage restaurants, malls, and attractions</p>
        </div>
        <Link 
          href="/dashboard/places/new" 
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={18} />
          Add Place
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Search places..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Store size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No places found</h3>
            <p className="text-slate-500 mb-6">Get started by adding your first place.</p>
            <Link 
              href="/dashboard/places/new" 
              className="text-slate-900 font-bold hover:underline"
            >
              Add New Place
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                <th className="px-6 py-4">Place</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlaces.map((place) => (
                <tr key={place.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 relative">
                        {place.cover_image_url ? (
                          <Image 
                            src={place.cover_image_url} 
                            alt={place.name} 
                            fill 
                            className="object-cover" 
                            unoptimized 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Store size={18} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{place.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{place.type || place.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 capitalize">
                      {getCategoryIcon(place.category)}
                      {place.category}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <MapPin size={14} />
                      <span className="truncate max-w-[150px]">{place.city || place.address || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/dashboard/places/${place.id}/edit`}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Place"
                      >
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(place.id)}
                        disabled={deletingId === place.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Place"
                      >
                        {deletingId === place.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Search, MoreVertical, Shield, Ban, CheckCircle, ExternalLink, Trash2, Edit2, Plus, X, Globe, MapPin, Mail, Phone, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const supabase = createClient();

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load properties');
    } else {
      setHotels(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property: ' + error.message);
    } else {
      setHotels(prev => prev.filter(h => h.id !== id));
      toast.success('Property deleted successfully');
    }
  };

  const handleUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          name: selectedHotel.name,
          email: selectedHotel.email,
          phone: selectedHotel.phone,
          address: selectedHotel.address,
          city: selectedHotel.city,
          country: selectedHotel.country,
          subscription_plan: selectedHotel.subscription_plan,
          subscription_status: selectedHotel.subscription_status,
          website_url: selectedHotel.website_url,
        })
        .eq('id', selectedHotel.id);

      if (error) throw error;

      setHotels(prev => prev.map(h => h.id === selectedHotel.id ? { ...h, ...selectedHotel } : h));
      setIsEditModalOpen(false);
      toast.success('Property updated successfully');
    } catch (error: any) {
      toast.error('Failed to update property');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredHotels = hotels.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.email?.toLowerCase().includes(search.toLowerCase()) ||
      h.city?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || h.subscription_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hotel Management</h1>
          <p className="text-slate-500">Manage subscribed hotels and their statuses.</p>
        </div>
        <Link href="/admin/hotels/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm w-full md:w-auto text-center flex items-center justify-center gap-2">
          <Plus size={18} />
          Onboard New Hotel
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            placeholder="Search by hotel name, email, city..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="trial">Trial</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Hotels Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hotel Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading hotels...
                  </div>
                </td></tr>
              ) : filteredHotels.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hotels found.</td></tr>
              ) : (
                filteredHotels.map((hotel) => (
                  <tr key={hotel.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {hotel.logo_url ? (
                          <div className="relative w-10 h-10">
                            <Image 
                              src={hotel.logo_url} 
                              alt="" 
                              fill
                              className="rounded-lg object-cover border border-slate-200" 
                              unoptimized 
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
                            {hotel.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{hotel.name}</p>
                          <p className="text-xs text-slate-500">{hotel.city || 'No City'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{hotel.email || 'No email'}</p>
                      <p className="text-xs text-slate-500">{hotel.phone || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        hotel.subscription_plan === 'pro' ? 'bg-purple-100 text-purple-800' :
                        hotel.subscription_plan === 'enterprise' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {hotel.subscription_plan || 'Trial'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        hotel.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                        hotel.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' :
                        hotel.subscription_status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          hotel.subscription_status === 'active' ? 'bg-green-600' :
                          hotel.subscription_status === 'trial' ? 'bg-blue-600' :
                          hotel.subscription_status === 'suspended' ? 'bg-red-600' :
                          'bg-slate-400'
                        }`}></span>
                        {hotel.subscription_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setSelectedHotel(hotel);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Property"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(hotel.id, hotel.name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Property"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Property Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedHotel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Building2 size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Edit Property Details</h3>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateHotel} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
                    <input 
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedHotel.name || ''}
                      onChange={e => setSelectedHotel({...selectedHotel, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                      <Mail size={14} /> Email
                    </label>
                    <input 
                      type="email"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedHotel.email || ''}
                      onChange={e => setSelectedHotel({...selectedHotel, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                      <Phone size={14} /> Phone
                    </label>
                    <input 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedHotel.phone || ''}
                      onChange={e => setSelectedHotel({...selectedHotel, phone: e.target.value})}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                      <MapPin size={14} /> Address
                    </label>
                    <textarea 
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      value={selectedHotel.address || ''}
                      onChange={e => setSelectedHotel({...selectedHotel, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedHotel.city || ''}
                      onChange={e => setSelectedHotel({...selectedHotel, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                    <input 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedHotel.country || ''}
                      onChange={e => setSelectedHotel({...selectedHotel, country: e.target.value})}
                    />
                  </div>
                </div>

                {/* Subscription */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                    <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={selectedHotel.subscription_plan}
                      onChange={e => setSelectedHotel({...selectedHotel, subscription_plan: e.target.value})}
                    >
                      <option value="trial">Trial</option>
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={selectedHotel.subscription_status}
                      onChange={e => setSelectedHotel({...selectedHotel, subscription_status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="trial">Trial</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Globe size={14} /> Website URL
                  </label>
                  <input 
                    type="url"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                    value={selectedHotel.website_url || ''}
                    onChange={e => setSelectedHotel({...selectedHotel, website_url: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


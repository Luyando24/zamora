'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ChevronLeft, Save, Loader2, Upload, MapPin, Store, Clock, Phone, Globe, Mail } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import ImageUpload from '@/components/ui/ImageUpload';

const CATEGORIES = [
  'Restaurant', 'Shopping', 'Museum', 'Park', 'Art Gallery', 'Nightlife', 'Cafe', 'Other'
];

export default function NewPlacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Restaurant',
    type: '',
    description: '',
    address: '',
    city: 'Lusaka',
    country: 'Zambia',
    opening_hours: '',
    contact_phone: '',
    contact_email: '',
    website_url: '',
    price_range: '$$',
    cover_image_url: ''
  });

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const { error } = await supabase
        .from('places')
        .insert({
          ...formData,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Place created successfully');
      router.push('/dashboard/places');
    } catch (error: any) {
      console.error('Error creating place:', error);
      toast.error(error.message || 'Failed to create place');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/dashboard/places"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Place</h1>
          <p className="text-slate-500">Create a listing for a restaurant, mall, or attraction</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Info */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Store size={20} className="text-slate-400" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Place Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="e.g. The Quorum"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Category</label>
              <select 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Specific Type</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="e.g. Steakhouse, Shopping Mall"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Description</label>
              <textarea 
                rows={4}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none"
                placeholder="Describe what makes this place special..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Location & Details */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <MapPin size={20} className="text-slate-400" />
            Location & Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Address</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="Street address or landmark"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">City</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Price Range</label>
              <select 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
                value={formData.price_range}
                onChange={e => setFormData({...formData, price_range: e.target.value})}
              >
                <option value="$">Budget ($)</option>
                <option value="$$">Moderate ($$)</option>
                <option value="$$$">Expensive ($$$)</option>
                <option value="$$$$">Luxury ($$$$)</option>
              </select>
            </div>
            
             <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Opening Hours</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="e.g. Mon-Fri: 9am-5pm, Sat: 10am-2pm"
                value={formData.opening_hours}
                onChange={e => setFormData({...formData, opening_hours: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Phone size={20} className="text-slate-400" />
            Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Phone</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                value={formData.contact_phone}
                onChange={e => setFormData({...formData, contact_phone: e.target.value})}
              />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                value={formData.contact_email}
                onChange={e => setFormData({...formData, contact_email: e.target.value})}
              />
            </div>
             <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Website URL</label>
              <input 
                type="url" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="https://..."
                value={formData.website_url}
                onChange={e => setFormData({...formData, website_url: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Media */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Upload size={20} className="text-slate-400" />
            Media
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Cover Image</label>
            <ImageUpload 
              value={formData.cover_image_url}
              onChange={(url) => setFormData({...formData, cover_image_url: url})}
              onRemove={() => setFormData({...formData, cover_image_url: ''})}
            />
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Create Place
          </button>
        </div>
      </form>
    </div>
  );
}

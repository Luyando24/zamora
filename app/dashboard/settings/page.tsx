'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Building2, Save, Globe, Mail, Phone, Facebook, Instagram, Twitter } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const [hotel, setHotel] = useState<any>({
    name: '',
    address: '',
    zra_tpin: '',
    logo_url: '',
    phone: '',
    email: '',
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    // In a real app, we get the property_id from the logged-in user's profile
    const { data: { user } } = await supabase.auth.getUser();
    const propertyId = user?.user_metadata?.property_id || user?.user_metadata?.hotel_id || '00000000-0000-0000-0000-000000000000';

    // Since we are using a dummy ID for the demo, let's try to fetch ANY property if the specific one fails, 
    // or just handle the create case.
    let { data, error } = await supabase.from('properties').select('*').eq('id', propertyId).single();

    if (!data) {
      // If no property found (e.g., first run), let's see if there's ANY property to bind to for the demo
      const { data: anyProperty } = await supabase.from('properties').select('*').limit(1).single();
      if (anyProperty) data = anyProperty;
    }

    if (data) {
      setHotel(data);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    // Fallback logic for demo
    let propertyId = hotel.id;
    
    if (!propertyId) {
        // Create new property if none exists
        const { data: newProperty, error } = await supabase.from('properties').insert(hotel).select().single();
        if (error) {
            alert('Error creating property: ' + error.message);
            setSaving(false);
            return;
        }
        propertyId = newProperty.id;
        setHotel(newProperty);
    } else {
        // Update existing
        const { error } = await supabase.from('properties').update(hotel).eq('id', propertyId);
        if (error) alert('Error updating profile: ' + error.message);
        else alert('Settings saved successfully!');
    }

    setSaving(false);
  };

  if (loading) return <div className="p-8 text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Hotel Settings</h1>
        <p className="text-gray-500">Manage your property details and public profile.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 text-zambia-green mb-4">
          <Building2 size={24} />
          <h2 className="text-lg font-semibold">Property Profile</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Hotel Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
              value={hotel.name || ''}
              onChange={e => setHotel({ ...hotel, name: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500">This name will appear on your public booking page.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Physical Address</label>
            <textarea
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
              value={hotel.address || ''}
              onChange={e => setHotel({ ...hotel, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Logo</label>
            <div className="mt-1 max-w-xs">
              <ImageUpload
                value={hotel.logo_url}
                onChange={(url) => setHotel({ ...hotel, logo_url: url })}
                bucket="property-images"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Upload your hotel logo (PNG/JPG).</p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 text-zambia-green mb-4">
            <Phone size={24} />
            <h2 className="text-lg font-semibold">Contact Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
                  value={hotel.phone || ''}
                  onChange={e => setHotel({ ...hotel, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
                  value={hotel.email || ''}
                  onChange={e => setHotel({ ...hotel, email: e.target.value })}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Website URL</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="url"
                  placeholder="https://www.yourhotel.com"
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
                  value={hotel.website_url || ''}
                  onChange={e => setHotel({ ...hotel, website_url: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 text-zambia-green mb-4">
            <Facebook size={24} />
            <h2 className="text-lg font-semibold">Social Media</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Facebook URL</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Facebook className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
                  value={hotel.facebook_url || ''}
                  onChange={e => setHotel({ ...hotel, facebook_url: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Instagram className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="url"
                  placeholder="https://instagram.com/..."
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
                  value={hotel.instagram_url || ''}
                  onChange={e => setHotel({ ...hotel, instagram_url: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Twitter/X URL</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Twitter className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="url"
                  placeholder="https://twitter.com/..."
                  className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
                  value={hotel.twitter_url || ''}
                  onChange={e => setHotel({ ...hotel, twitter_url: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 text-zambia-green mb-4">
            <Building2 size={24} />
            <h2 className="text-lg font-semibold">ZRA Compliance Details</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Tax Payer Identification Number (TPIN)</label>
            <input
              type="text"
              placeholder="1000..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
              value={hotel.zra_tpin || ''}
              onChange={e => setHotel({ ...hotel, zra_tpin: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500">Required for fiscalizing invoices with the VSDC.</p>
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-zambia-green text-white px-6 py-2 rounded-md hover:bg-zambia-green/90 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800">Public Booking Link</h3>
        <div className="mt-2 flex items-center gap-2">
          <code className="bg-white px-2 py-1 rounded border border-blue-200 text-sm text-blue-600 flex-1">
            {typeof window !== 'undefined' ? `${window.location.origin}/book/${hotel.id}` : `/book/${hotel.id}`}
          </code>
          <a 
            href={`/book/${hotel.id}`} 
            target="_blank" 
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View Page &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

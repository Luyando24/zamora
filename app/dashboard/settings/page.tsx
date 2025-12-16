'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Building2, Save, Globe, Mail, Phone, Facebook, Instagram, Twitter, Wifi, ChevronDown, Plus } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import Link from 'next/link';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  
  // List of all properties user has access to
  const [properties, setProperties] = useState<any[]>([]);
  
  // Currently selected property for editing
  const [hotel, setHotel] = useState<any>({
    name: '',
    slug: '',
    address: '',
    zra_tpin: '',
    logo_url: '',
    phone: '',
    email: '',
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    wifi_ssid: '',
    wifi_password: '',
    admin_notification_phone: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all properties user has access to via RLS
    const { data: props, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching properties:', error);
    }

    if (props && props.length > 0) {
        setProperties(props);
        
        // Determine which property to select initially
        // 1. Try to get from profile (last selected)
        // 2. Or default to the first one
        const savedId = localStorage.getItem('zamora_selected_property');
        const initialProp = props.find(p => p.id === savedId) || props[0];
        
        setHotel(initialProp);
    } else {
        // No properties found, maybe initialize blank for creation?
        // Or redirect to setup?
        // For now, let's keep the blank form which allows creating a new one in handleSave
    }
    setLoading(false);
  };

  const handlePropertyChange = (propertyId: string) => {
      if (propertyId === 'new') {
          // Clear form for new property
          setHotel({
            name: '',
            slug: '',
            address: '',
            zra_tpin: '',
            logo_url: '',
            phone: '',
            email: '',
            website_url: '',
            facebook_url: '',
            instagram_url: '',
            twitter_url: '',
            wifi_ssid: '',
            wifi_password: '',
            admin_notification_phone: ''
          });
      } else {
          const selected = properties.find(p => p.id === propertyId);
          if (selected) {
              setHotel(selected);
              localStorage.setItem('zamora_selected_property', selected.id);
          }
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    let propertyId = hotel.id; // May be undefined if 'new'
    
    try {
        if (!propertyId) {
            // Create new property
            const { data: newProperty, error } = await supabase.from('properties').insert({
                ...hotel,
                created_by: user?.id 
            }).select().single();
            
            if (error) throw error;
            
            // Add to list and select it
            setProperties([newProperty, ...properties]);
            setHotel(newProperty);
            alert('Property created successfully!');
        } else {
            // Update existing
            const { error } = await supabase.from('properties').update(hotel).eq('id', propertyId);
            if (error) throw error;
            
            // Update list
            setProperties(properties.map(p => p.id === propertyId ? { ...p, ...hotel } : p));
            alert('Settings saved successfully!');
        }
    } catch (error: any) {
        alert('Error saving settings: ' + error.message);
    }

    setSaving(false);
  };

  if (loading) return <div className="p-8 text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Property Settings</h1>
            <p className="text-gray-500">Manage details for your properties.</p>
        </div>
        
        {/* Property Selector */}
        <div className="relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-gray-500" />
            </div>
            <select
                value={hotel.id || 'new'}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 text-base text-gray-900 border-gray-300 focus:outline-none focus:ring-zambia-green focus:border-zambia-green sm:text-sm rounded-md shadow-sm bg-white border cursor-pointer hover:bg-gray-50 transition-colors"
            >
                {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="new">+ Add New Property</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 text-zambia-green">
                <Building2 size={24} />
                <h2 className="text-lg font-semibold">
                    {hotel.id ? 'Edit Profile' : 'New Property Profile'}
                </h2>
            </div>
            {hotel.id && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                    ID: {hotel.id.slice(0, 8)}...
                </span>
            )}
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
            <label className="block text-sm font-medium text-gray-700">Subdomain (Slug)</label>
            <div className="flex mt-1 rounded-md shadow-sm">
                <input
                  type="text"
                  className="block w-full rounded-l-md border-gray-300 focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
                  value={hotel.slug || ''}
                  onChange={e => setHotel({ ...hotel, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="my-hotel"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  .zamoraapp.com
                </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">Your custom web address. Only lowercase letters, numbers, and hyphens.</p>
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

        {/* Wi-Fi Section */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 text-zambia-green mb-4">
            <Wifi size={24} />
            <h2 className="text-lg font-semibold">Wi-Fi Settings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label className="block text-sm font-medium text-gray-700">Admin Notification Phone</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
              value={hotel.admin_notification_phone || ''}
              onChange={e => setHotel({ ...hotel, admin_notification_phone: e.target.value })}
              placeholder="+260..."
            />
            <p className="mt-1 text-xs text-gray-500">
                This number will receive SMS alerts for new bookings and orders. Format: +260...
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Wi-Fi Network Name (SSID)</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
                value={hotel.wifi_ssid || ''}
                onChange={e => setHotel({ ...hotel, wifi_ssid: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Wi-Fi Password</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-zambia-green focus:ring-zambia-green px-3 py-2 border text-gray-900 bg-white"
                value={hotel.wifi_password || ''}
                onChange={e => setHotel({ ...hotel, wifi_password: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Contact Section */}
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

        {/* Social Section */}
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

        {/* ZRA Section */}
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
      
      {hotel.id && (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800">Public Booking Link</h3>
            <div className="mt-2 flex items-center gap-2">
            <code className="bg-white px-2 py-1 rounded border border-blue-200 text-sm text-blue-600 flex-1 overflow-x-auto">
                {typeof window !== 'undefined' ? `${window.location.origin}/book/${hotel.id}` : `/book/${hotel.id}`}
            </code>
            <a 
                href={`/book/${hotel.id}`} 
                target="_blank" 
                className="text-sm font-medium text-blue-600 hover:text-blue-500 whitespace-nowrap"
            >
                View Page &rarr;
            </a>
            </div>
        </div>
      )}
    </div>
  );
}

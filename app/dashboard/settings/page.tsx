'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Building2, Save, Globe, Mail, Phone, Facebook, Instagram, Twitter, 
  Wifi, ChevronDown, Plus, Baby, Utensils, CreditCard, LayoutDashboard 
} from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import Link from 'next/link';
import { useProperty } from '../context/PropertyContext';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'operations', label: 'Operations', icon: Utensils }, // Dynamically changes icon
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'social', label: 'Social', icon: Globe },
  { id: 'compliance', label: 'Compliance', icon: CreditCard },
];

const CUISINE_OPTIONS = [
  { value: 'zambian', label: 'Zambian' },
  { value: 'italian', label: 'Italian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'indian', label: 'Indian' },
  { value: 'american', label: 'American' },
  { value: 'grill', label: 'Grill' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'steakhouse', label: 'Steakhouse' },
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'sushi', label: 'Sushi' },
  { value: 'fusion', label: 'Fusion' },
  { value: 'pub', label: 'Pub / Bar' },
  { value: 'other', label: 'Other' },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const supabase = createClient();
  const { properties, selectedPropertyId, setSelectedPropertyId, refreshProperties } = useProperty();
  
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
    admin_notification_phone: '',
    whatsapp_booking_phone: '',
    city: '',
    country: 'Zambia',
    type: 'hotel', // Default
    settings: {} // For JSONB data
  });

  useEffect(() => {
    if (selectedPropertyId && properties.length > 0) {
      const selected = properties.find(p => p.id === selectedPropertyId);
      if (selected) {
        setHotel({
            ...selected,
            city: selected.city || '',
            country: selected.country || 'Zambia',
            settings: selected.settings || {}
        });
      }
    } else if (properties.length > 0 && !selectedPropertyId) {
       // If properties exist but none selected, select the first one
       setSelectedPropertyId(properties[0].id);
    }
    setLoading(false);
  }, [selectedPropertyId, properties, setSelectedPropertyId]);

  const handlePropertyChange = (propertyId: string) => {
      if (propertyId === 'new') {
          // Clear form for new property
          setHotel({
            name: '',
            slug: '',
            address: '',
            city: '',
            country: 'Zambia',
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
            admin_notification_phone: '',
            whatsapp_booking_phone: '',
            allows_children: false,
            max_children: 0,
            type: 'hotel',
            settings: {}
          });
          setActiveTab('general');
      } else {
          setSelectedPropertyId(propertyId);
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    let isNew = !hotel.id;
    
    try {
        if (isNew) {
            // Create new property
            const { data: newProperty, error } = await supabase.from('properties').insert({
                ...hotel,
                created_by: user?.id 
            }).select().single();
            
            if (error) throw error;
            
            // Add to list and select it via context
            await refreshProperties();
            setSelectedPropertyId(newProperty.id);
            setHotel(newProperty);
            
            // Also need to add creator as admin in property_staff
            await supabase.from('property_staff').insert({
                property_id: newProperty.id,
                user_id: user?.id,
                role: 'admin'
            });

            alert('Property created successfully!');
        } else {
            // Update existing
            const { error } = await supabase.from('properties').update(hotel).eq('id', hotel.id);
            if (error) throw error;
            
            // Refresh context
            await refreshProperties();
            alert('Settings saved successfully!');
        }
    } catch (error: any) {
        console.error(error);
        alert('Error saving settings: ' + error.message);
    }

    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zambia-green"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 px-4 sm:px-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Property Settings</h1>
            <p className="text-slate-500 mt-1">Manage your property details, branding, and configurations.</p>
        </div>
        
        {/* Property Selector */}
        <div className="relative min-w-[240px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LayoutDashboard className="h-4 w-4 text-slate-400" />
            </div>
            <select
                value={hotel.id || 'new'}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-zambia-green/20 focus:border-zambia-green cursor-pointer hover:bg-slate-50 transition-all appearance-none"
            >
                {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="new">+ Add New Property</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 space-y-1 sticky top-8">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.id === 'operations' && hotel.type === 'restaurant' ? Utensils : (tab.id === 'operations' ? Wifi : tab.icon);
                    const label = tab.id === 'operations' ? (hotel.type === 'restaurant' ? 'Restaurant Details' : 'Operations') : tab.label;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                ${isActive 
                                    ? 'bg-zambia-green text-white shadow-md shadow-zambia-green/20' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                        >
                            <Icon size={18} />
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Public Link Card */}
            {hotel.id && (
                <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                    <h3 className="text-sm font-bold text-blue-900 mb-2">Public Page</h3>
                    <p className="text-xs text-blue-700 mb-4 leading-relaxed">
                        Your property is live at:
                    </p>
                    <a 
                        href={`/book/${hotel.id}`} 
                        target="_blank" 
                        className="flex items-center justify-center w-full px-4 py-2 bg-white text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                    >
                        Visit Page <Globe size={14} className="ml-2" />
                    </a>
                </div>
            )}
        </nav>

        {/* Main Content Form */}
        <form onSubmit={handleSave} className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'general' && (
                            <motion.div 
                                key="general"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-1">General Information</h2>
                                    <p className="text-sm text-slate-500">Basic details about your property.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Property Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.name || ''}
                                                onChange={e => setHotel({ ...hotel, name: e.target.value })}
                                                placeholder="e.g. The Royal Hotel"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Property Type</label>
                                            <select
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all appearance-none"
                                                value={hotel.type || 'hotel'}
                                                onChange={e => setHotel({ ...hotel, type: e.target.value })}
                                            >
                                                <option value="hotel">Hotel</option>
                                                <option value="lodge">Lodge</option>
                                                <option value="guesthouse">Guesthouse</option>
                                                <option value="restaurant">Restaurant</option>
                                                <option value="campsite">Campsite</option>
                                                <option value="resort">Resort</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Subdomain</label>
                                        <div className="flex rounded-xl shadow-sm">
                                            <input
                                                type="text"
                                                className="block w-full rounded-l-xl border-slate-200 focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.slug || ''}
                                                onChange={e => setHotel({ ...hotel, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                                placeholder="my-hotel"
                                            />
                                            <span className="inline-flex items-center px-4 rounded-r-xl border border-l-0 border-slate-200 bg-slate-100 text-slate-500 text-sm font-medium">
                                                .zamoraapp.com
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Physical Address</label>
                                        <textarea
                                            rows={3}
                                            className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                            value={hotel.address || ''}
                                            onChange={e => setHotel({ ...hotel, address: e.target.value })}
                                            placeholder="Enter full physical address"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                                            <input
                                                type="text"
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.city || ''}
                                                onChange={e => setHotel({ ...hotel, city: e.target.value })}
                                                placeholder="e.g. Lusaka"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Country</label>
                                            <input
                                                type="text"
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.country || 'Zambia'}
                                                onChange={e => setHotel({ ...hotel, country: e.target.value })}
                                                placeholder="e.g. Zambia"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Property Logo</label>
                                        <div className="max-w-[200px]">
                                            <ImageUpload
                                                value={hotel.logo_url}
                                                onChange={(url) => setHotel({ ...hotel, logo_url: url })}
                                                bucket="property-images"
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-slate-400">Recommended size: 512x512px. Max 2MB.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'operations' && (
                            <motion.div 
                                key="operations"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                                        {hotel.type === 'restaurant' ? 'Restaurant Configuration' : 'Operational Settings'}
                                    </h2>
                                    <p className="text-sm text-slate-500">Configure how your business operates.</p>
                                </div>

                                {hotel.type === 'restaurant' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Cuisine Type</label>
                                            <div className="flex flex-wrap gap-2">
                                                {CUISINE_OPTIONS.map((cuisine) => {
                                                    const currentCuisines = Array.isArray(hotel.settings?.cuisine_type) 
                                                        ? hotel.settings.cuisine_type 
                                                        : (hotel.settings?.cuisine_type ? [hotel.settings.cuisine_type] : []);
                                                    
                                                    const isSelected = currentCuisines.includes(cuisine.value);
                                                    
                                                    return (
                                                        <button
                                                            key={cuisine.value}
                                                            type="button"
                                                            onClick={() => {
                                                                const newCuisines = isSelected
                                                                    ? currentCuisines.filter((c: string) => c !== cuisine.value)
                                                                    : [...currentCuisines, cuisine.value];
                                                                setHotel({ ...hotel, settings: { ...hotel.settings, cuisine_type: newCuisines } });
                                                            }}
                                                            className={`
                                                                px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200
                                                                ${isSelected 
                                                                    ? 'bg-zambia-green text-white border-zambia-green shadow-sm' 
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-zambia-green hover:text-zambia-green'}
                                                            `}
                                                        >
                                                            {cuisine.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="mt-2 text-xs text-slate-400">Select all that apply.</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Opening Hours</label>
                                            <input
                                                type="text"
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.settings?.opening_hours || ''}
                                                onChange={e => setHotel({ ...hotel, settings: { ...hotel.settings, opening_hours: e.target.value } })}
                                                placeholder="e.g. 08:00 - 22:00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Radius (km)</label>
                                            <input
                                                type="number"
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.settings?.delivery_radius || ''}
                                                onChange={e => setHotel({ ...hotel, settings: { ...hotel.settings, delivery_radius: e.target.value } })}
                                                placeholder="10"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Contact</label>
                                            <input
                                                type="text"
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.settings?.delivery_contact || ''}
                                                onChange={e => setHotel({ ...hotel, settings: { ...hotel.settings, delivery_contact: e.target.value } })}
                                                placeholder="+260..."
                                            />
                                        </div>

                                         <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Online Ordering Link</label>
                                            <input
                                                type="url"
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.settings?.online_ordering_link || ''}
                                                onChange={e => setHotel({ ...hotel, settings: { ...hotel.settings, online_ordering_link: e.target.value } })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <Wifi size={16} /> Wi-Fi Access
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Network Name (SSID)</label>
                                                    <input
                                                        type="text"
                                                        className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-3 py-2 border text-slate-900 bg-white"
                                                        value={hotel.wifi_ssid || ''}
                                                        onChange={e => setHotel({ ...hotel, wifi_ssid: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
                                                    <input
                                                        type="text"
                                                        className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-3 py-2 border text-slate-900 bg-white"
                                                        value={hotel.wifi_password || ''}
                                                        onChange={e => setHotel({ ...hotel, wifi_password: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center gap-3">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id="require_wifi_for_orders"
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-slate-300 text-zambia-green focus:ring-zambia-green"
                                                        checked={hotel.settings?.require_wifi_for_orders || false}
                                                        onChange={e => setHotel({ 
                                                            ...hotel, 
                                                            settings: { 
                                                                ...hotel.settings, 
                                                                require_wifi_for_orders: e.target.checked 
                                                            } 
                                                        })}
                                                    />
                                                </div>
                                                <div className="text-sm">
                                                    <label htmlFor="require_wifi_for_orders" className="font-medium text-slate-700">Prompt guests to connect to Wi-Fi</label>
                                                    <p className="text-slate-500 text-xs">Recommended for local POS ordering (offline support).</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Admin Notification Phone</label>
                                            <input
                                                type="text"
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.admin_notification_phone || ''}
                                                onChange={e => setHotel({ ...hotel, admin_notification_phone: e.target.value })}
                                                placeholder="+260..."
                                            />
                                            <p className="mt-2 text-xs text-slate-400">Receives SMS alerts for new bookings/orders.</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'contact' && (
                            <motion.div 
                                key="contact"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-1">Contact Information</h2>
                                    <p className="text-sm text-slate-500">How customers can reach you.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Phone className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="tel"
                                                className="block w-full pl-10 rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.phone || ''}
                                                onChange={e => setHotel({ ...hotel, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Booking Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Phone className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="tel"
                                                className="block w-full pl-10 rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.whatsapp_booking_phone || ''}
                                                onChange={e => setHotel({ ...hotel, whatsapp_booking_phone: e.target.value })}
                                                placeholder="+260..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="email"
                                                className="block w-full pl-10 rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.email || ''}
                                                onChange={e => setHotel({ ...hotel, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Website URL</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Globe className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="url"
                                                className="block w-full pl-10 rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                value={hotel.website_url || ''}
                                                onChange={e => setHotel({ ...hotel, website_url: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'social' && (
                            <motion.div 
                                key="social"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-1">Social Media</h2>
                                    <p className="text-sm text-slate-500">Connect your social profiles.</p>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { label: 'Facebook', icon: Facebook, key: 'facebook_url', placeholder: 'facebook.com/...' },
                                        { label: 'Instagram', icon: Instagram, key: 'instagram_url', placeholder: 'instagram.com/...' },
                                        { label: 'Twitter / X', icon: Twitter, key: 'twitter_url', placeholder: 'twitter.com/...' },
                                    ].map((social) => (
                                        <div key={social.key}>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">{social.label}</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <social.icon className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <input
                                                    type="url"
                                                    className="block w-full pl-10 rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                                    value={hotel[social.key] || ''}
                                                    onChange={e => setHotel({ ...hotel, [social.key]: e.target.value })}
                                                    placeholder={`https://${social.placeholder}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'compliance' && (
                            <motion.div 
                                key="compliance"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-1">Compliance & Tax</h2>
                                    <p className="text-sm text-slate-500">Legal and tax information.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tax Payer Identification Number (TPIN)</label>
                                    <input
                                        type="text"
                                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-zambia-green focus:ring-zambia-green/20 px-4 py-3 border text-slate-900 bg-slate-50 focus:bg-white transition-all"
                                        value={hotel.zra_tpin || ''}
                                        onChange={e => setHotel({ ...hotel, zra_tpin: e.target.value })}
                                        placeholder="1000..."
                                    />
                                    <p className="mt-2 text-xs text-slate-400">Required for ZRA Smart Invoice fiscalization.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                        Last saved: {new Date().toLocaleDateString()}
                    </p>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-zambia-green text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-zambia-green/20 hover:bg-zambia-green/90 disabled:opacity-50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
}

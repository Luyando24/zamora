'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import ImageUpload from '@/components/ui/ImageUpload';
import MultiImageUpload from '@/components/ui/MultiImageUpload';
import { 
  Building2, MapPin, Phone, Mail, Globe, 
  CheckCircle, Home, BedDouble, Building, Sun, Car, Tent,
  ArrowLeft, Save, Loader2, X, Plus
} from 'lucide-react';
import Link from 'next/link';

const PROPERTY_TYPES = [
  { id: 'hotel', label: 'Hotel', icon: Building2, description: 'Standard hotel services' },
  { id: 'lodge', label: 'Lodge', icon: Home, description: 'Nature-focused accommodation' },
  { id: 'guest_house', label: 'Guest House', icon: BedDouble, description: 'Small, home-like setting' },
  { id: 'apartment', label: 'Apartment', icon: Building, description: 'Self-catering units' },
  { id: 'resort', label: 'Resort', icon: Sun, description: 'Full-service vacation spot' },
  { id: 'motel', label: 'Motel', icon: Car, description: 'Roadside accommodation' },
  { id: 'campsite', label: 'Campsite', icon: Tent, description: 'Outdoor lodging' },
];

const AMENITIES_BY_TYPE: Record<string, string[]> = {
  hotel: [
    'Free Wi-Fi', 'Swimming Pool', 'Gym / Fitness Center', 'Restaurant', 'Bar / Lounge',
    'Room Service', 'Free Parking', 'Airport Shuttle', 'Spa', 'Conference Rooms',
    '24-hour Front Desk', 'Air Conditioning', 'Laundry Service', 'Concierge'
  ],
  lodge: [
    'Game Drives', 'Guided Walks', 'Swimming Pool', 'Outdoor Fireplace', 'Bar / Lounge',
    'Restaurant', 'Mosquito Nets', 'Airport Shuttle', 'Free Parking', 'Viewing Deck',
    'Sundowners', 'Laundry Service', 'Solar Power'
  ],
  guest_house: [
    'Free Wi-Fi', 'Breakfast Included', 'Shared Kitchen', 'Garden', 'Free Parking',
    'TV Room', 'Daily Housekeeping', 'Laundry Service', 'Non-smoking Rooms', 'BBQ Facilities'
  ],
  apartment: [
    'Free Wi-Fi', 'Full Kitchen', 'Washing Machine', 'Balcony / Terrace', 'Free Parking',
    'Air Conditioning', 'Heating', 'Elevator', 'Pet Friendly', 'Workspace'
  ],
  resort: [
    'Private Beach', 'Swimming Pool', 'Spa & Wellness', 'Kids Club', 'Water Sports',
    'All-inclusive', 'Multiple Restaurants', 'Bar / Lounge', 'Entertainment Staff',
    'Tennis Court', 'Golf Course', 'Gym', 'Free Wi-Fi'
  ],
  motel: [
    'Free Parking', '24-hour Front Desk', 'Free Wi-Fi', 'Air Conditioning', 'Vending Machine',
    'Breakfast Included', 'Non-smoking Rooms', 'Pet Friendly'
  ],
  campsite: [
    'Shared Bathroom', 'Hot Showers', 'Fire Pit', 'BBQ Area', 'Water Hookup',
    'Electricity Hookup', 'Pet Friendly', 'Dishwashing Area', 'Playground', 'Small Shop'
  ]
};

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'hotel',
    email: '',
    phone: '',
    address: '',
    website_url: '',
    cover_image_url: '',
    gallery_urls: [] as string[],
    amenities: [] as string[],
  });
  const [newAmenity, setNewAmenity] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching property:', error);
      alert('Error loading property details');
      router.push('/dashboard/properties');
    } else {
      setFormData({
        name: data.name || '',
        type: data.type || 'hotel',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        website_url: data.website_url || '',
        cover_image_url: data.cover_image_url || '',
        gallery_urls: data.gallery_urls || [],
        amenities: data.amenities || [],
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      if (exists) {
        return { ...prev, amenities: prev.amenities.filter(a => a !== amenity) };
      } else {
        return { ...prev, amenities: [...prev.amenities, amenity] };
      }
    });
  };

  const addCustomAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('properties')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      router.push(`/dashboard/properties/${id}`);
      router.refresh();
    } catch (error: any) {
      alert('Error updating property: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zambia-green"></div>
      </div>
    );
  }

  const suggestedAmenities = AMENITIES_BY_TYPE[formData.type] || AMENITIES_BY_TYPE['hotel'];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/dashboard/properties/${id}`} className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-2 transition-colors text-sm">
            <ArrowLeft size={16} className="mr-1" /> Back to Details
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Edit Property</h1>
          <p className="text-slate-500">Update your property information.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href={`/dashboard/properties/${id}`}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-zambia-green text-white rounded-lg hover:bg-green-700 font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-blue-600" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Property Name *</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-3">Property Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {PROPERTY_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.type === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                        isSelected 
                          ? 'border-zambia-green bg-green-50 text-zambia-green ring-1 ring-zambia-green' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Icon size={24} className="mb-2" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sun size={20} className="text-orange-500" />
            Media
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cover Image</label>
              <ImageUpload
                value={formData.cover_image_url}
                onChange={(url) => setFormData(prev => ({ ...prev, cover_image_url: url }))}
                bucket="property-images"
              />
              <p className="text-xs text-slate-500 mt-1">This will be displayed on the booking page header.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Images</label>
              <MultiImageUpload
                values={formData.gallery_urls}
                onChange={(urls) => setFormData(prev => ({ ...prev, gallery_urls: urls }))}
                bucket="property-images"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Phone size={20} className="text-green-600" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address, City"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Website URL (Optional)</label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-purple-600" />
            Amenities
          </h3>
          
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Popular Amenities</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {suggestedAmenities.map((amenity) => (
                <label key={amenity} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="h-4 w-4 text-zambia-green rounded border-gray-300 focus:ring-zambia-green"
                  />
                  <span className="text-sm text-slate-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">Add Custom Amenity</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="e.g. Helipad"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
              />
              <button
                type="button"
                onClick={addCustomAmenity}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
              >
                Add
              </button>
            </div>

            {/* Display Custom Amenities (those not in the suggested list) */}
            {formData.amenities.filter(a => !suggestedAmenities.includes(a)).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {formData.amenities.filter(a => !suggestedAmenities.includes(a)).map(amenity => (
                  <span key={amenity} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm border border-blue-100">
                    {amenity}
                    <button type="button" onClick={() => toggleAmenity(amenity)} className="hover:text-blue-900">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Link 
            href={`/dashboard/properties/${id}`}
            className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-bold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-zambia-green text-white rounded-xl hover:bg-green-700 font-bold shadow-lg shadow-green-900/20 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

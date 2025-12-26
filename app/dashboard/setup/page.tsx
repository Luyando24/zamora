'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import ImageUpload from '@/components/ui/ImageUpload';
import MultiImageUpload from '@/components/ui/MultiImageUpload';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle, 
  Home, 
  BedDouble, 
  Building, 
  Sun, 
  Car, 
  Tent,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  X,
  ListPlus,
  Check,
  Utensils
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProperty } from '../context/PropertyContext';

const PROPERTY_TYPES = [
  { id: 'hotel', label: 'Hotel', icon: Building2, description: 'Standard hotel services' },
  { id: 'restaurant', label: 'Restaurant', icon: Utensils, description: 'Dining establishment' },
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
  restaurant: [
    'Free Wi-Fi', 'Outdoor Seating', 'Live Music', 'Bar / Lounge', 'Private Dining',
    'Takeout', 'Delivery', 'Wheelchair Accessible', 'Parking', 'Kids Menu',
    'Vegetarian Options', 'Vegan Options', 'Halal', 'Breakfast', 'Lunch', 'Dinner'
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

export default function PropertySetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: Media, 3: Amenities, 4: Contact, 5: Success
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
    // Restaurant specific fields
    cuisine_type: [] as string[],
    opening_hours: '',
    delivery_radius: '',
    delivery_contact: '',
    online_ordering_link: ''
  });
  const [newAmenity, setNewAmenity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { refreshProperties, setSelectedPropertyId } = useProperty();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = (typeId: string) => {
    setFormData(prev => ({ ...prev, type: typeId }));
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

  const isRestaurant = formData.type === 'restaurant';

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!formData.name.trim()) {
        setError(`${isRestaurant ? 'Restaurant' : 'Property'} Name is required.`);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.cover_image_url) {
        setError(`Please upload a cover image for your ${isRestaurant ? 'restaurant' : 'property'}.`);
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Amenities are optional, but we can enforce at least one if needed.
      // For now, let's keep it optional or just proceed.
      setStep(4);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Validate Step 4 (Contact)
    if (!formData.email.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setError('Please fill in all required contact information.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Create the Property
      const { cuisine_type, opening_hours, delivery_radius, delivery_contact, online_ordering_link, ...baseData } = formData;
      const settings = { cuisine_type, opening_hours, delivery_radius, delivery_contact, online_ordering_link };

      const { data: hotel, error: hotelError } = await supabase
        .from('properties')
        .insert([{
          ...baseData,
          settings,
          subscription_plan: 'trial',
          subscription_status: 'active'
        }])
        .select('id') // Only select ID to avoid issues with potential stale column references
        .single();

      if (hotelError) throw hotelError;

      // 2. Link User to Property (using property_staff table for multi-property support)
      // We also update profiles for backward compatibility if needed, but property_staff is the source of truth.
      
      const { error: staffError } = await supabase
        .from('property_staff')
        .upsert({
            property_id: hotel.id,
            user_id: user.id,
            role: 'admin' // Creator is admin of the property
        }, { onConflict: 'property_id,user_id' });

      if (staffError) throw staffError;

      // Optional: Update profile just in case some legacy code relies on it, but don't fail if it errors?
      // Actually, let's keep it for now as a "primary" property pointer if needed.
      await supabase
        .from('profiles')
        .update({ property_id: hotel.id, role: 'manager' })
        .eq('id', user.id);

      // 3. Update User Metadata (for faster client-side checks)
      await supabase.auth.updateUser({
        data: { property_id: hotel.id }
      });

      // 4. Update Context
      await refreshProperties();
      setSelectedPropertyId(hotel.id);

      setStep(5);
      
      // Delay redirect slightly to show success
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);

    } catch (error: any) {
      alert(`Error setting up ${isRestaurant ? 'restaurant' : 'property'}: ` + error.message);
      setLoading(false);
    }
  };

  if (step === 5) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-12 px-4 shadow-xl sm:rounded-xl sm:px-10 text-center border border-gray-100">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 animate-bounce">
              <CheckCircle className="h-8 w-8 text-zambia-green" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{isRestaurant ? 'Restaurant Created!' : 'Property Created!'}</h2>
            <p className="text-gray-500">Setting up your dashboard...</p>
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-6 w-6 text-zambia-green animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-zambia-green shadow-lg mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            {isRestaurant ? <Utensils className="h-8 w-8 text-white" /> : <Building2 className="h-8 w-8 text-white" />}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Welcome to Zamora
          </h1>
          <p className="mt-3 text-xl text-gray-500 max-w-2xl mx-auto">
            Let's get your {isRestaurant ? 'restaurant' : 'property'} set up. It only takes a minute.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 lg:p-12">
            {/* Progress Bar */}
            <div className="mb-10">
              <div className="flex space-x-3 mb-3">
                {[1, 2, 3, 4].map((s) => (
                  <div 
                    key={s}
                    className={`h-2 flex-1 rounded-full transition-all duration-500 ease-out ${
                      step >= s ? 'bg-zambia-green' : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between px-1">
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${step >= 1 ? 'text-zambia-green' : 'text-gray-400'}`}>
                  Details
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${step >= 2 ? 'text-zambia-green' : 'text-gray-400'}`}>
                  Media
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${step >= 3 ? 'text-zambia-green' : 'text-gray-400'}`}>
                  Amenities
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${step >= 4 ? 'text-zambia-green' : 'text-gray-400'}`}>
                  Contact
                </span>
              </div>
            </div>

            <form onSubmit={step === 4 ? handleSubmit : handleNext} className="space-y-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-6">{isRestaurant ? 'Restaurant Details' : 'Property Details'}</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          {isRestaurant ? 'Restaurant Name' : 'Property Name'}
                        </label>
                        <div className="relative">
                          <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent transition-all text-gray-900"
                            placeholder={isRestaurant ? "e.g. The Mint Cafe" : "e.g. The Royal Zambezi Lodge"}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {isRestaurant ? 'Establishment Type' : 'Property Type'}
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {PROPERTY_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = formData.type === type.id;
                            return (
                              <div
                                key={type.id}
                                onClick={() => handleTypeSelect(type.id)}
                                className={`
                                  cursor-pointer relative rounded-xl border p-4 flex flex-col items-center text-center transition-all duration-200
                                  ${isSelected 
                                    ? 'border-zambia-green bg-green-50 ring-1 ring-zambia-green' 
                                    : 'border-gray-200 hover:border-zambia-green hover:bg-gray-50'}
                                `}
                              >
                                <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-zambia-green' : 'text-gray-500'}`} />
                                <span className={`text-sm font-medium ${isSelected ? 'text-zambia-green' : 'text-gray-900'}`}>
                                  {type.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {isRestaurant && (
                        <div className="sm:col-span-2 space-y-6 pt-4 border-t border-gray-100">
                          <h4 className="text-base font-semibold text-gray-900">Restaurant Details</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cuisine Type
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {CUISINE_OPTIONS.map((cuisine) => {
                                  // Ensure array
                                  const currentCuisines = Array.isArray(formData.cuisine_type) 
                                    ? formData.cuisine_type 
                                    : (formData.cuisine_type ? [formData.cuisine_type] : []);

                                  const isSelected = currentCuisines.includes(cuisine.value);
                                  return (
                                    <button
                                      key={cuisine.value}
                                      type="button"
                                      onClick={() => {
                                        const newCuisines = isSelected
                                          ? currentCuisines.filter((c: string) => c !== cuisine.value)
                                          : [...currentCuisines, cuisine.value];
                                        setFormData(prev => ({ ...prev, cuisine_type: newCuisines }));
                                      }}
                                      className={`
                                        px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200
                                        ${isSelected 
                                          ? 'bg-zambia-green text-white border-zambia-green shadow-sm' 
                                          : 'bg-white text-gray-600 border-gray-200 hover:border-zambia-green hover:text-zambia-green'}
                                      `}
                                    >
                                      {cuisine.label}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="mt-2 text-xs text-gray-400">Select all that apply.</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Opening Hours
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 08:00 - 22:00"
                                value={formData.opening_hours}
                                onChange={(e) => setFormData(prev => ({ ...prev, opening_hours: e.target.value }))}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent text-gray-900"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Delivery Radius (km)
                              </label>
                              <input
                                type="number"
                                placeholder="e.g. 10"
                                value={formData.delivery_radius}
                                onChange={(e) => setFormData(prev => ({ ...prev, delivery_radius: e.target.value }))}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent text-gray-900"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Media & Branding</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cover Image
                        </label>
                        <p className="text-sm text-gray-500 mb-3">
                          {isRestaurant 
                            ? "This will be the main image shown on your profile." 
                            : "This will be the main image shown on your booking page."}
                        </p>
                        <ImageUpload 
                          value={formData.cover_image_url}
                          onChange={(url) => setFormData(prev => ({ ...prev, cover_image_url: url }))}
                          bucket="property-images"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gallery Images
                        </label>
                        <p className="text-sm text-gray-500 mb-3">
                          {isRestaurant
                            ? "Add photos of your dining area, food, and atmosphere."
                            : "Add photos of your property, rooms, and amenities."}
                        </p>
                        <MultiImageUpload 
                          values={formData.gallery_urls}
                          onChange={(urls) => setFormData(prev => ({ ...prev, gallery_urls: urls }))}
                          bucket="property-images"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{isRestaurant ? 'Restaurant Features' : 'Property Amenities'}</h3>
                    <p className="text-gray-500 mb-6">
                      {isRestaurant 
                        ? "Select features available at your restaurant." 
                        : "Select features available at your property."}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                      {(AMENITIES_BY_TYPE[formData.type] || AMENITIES_BY_TYPE.hotel).map((amenity) => {
                        const isSelected = formData.amenities.includes(amenity);
                        return (
                          <div
                            key={amenity}
                            onClick={() => toggleAmenity(amenity)}
                            className={`
                              cursor-pointer flex items-center p-3 rounded-lg border transition-all duration-200
                              ${isSelected 
                                ? 'border-zambia-green bg-green-50 text-zambia-green' 
                                : 'border-gray-200 hover:border-zambia-green hover:bg-gray-50 text-gray-700'}
                            `}
                          >
                            <div className={`
                              w-5 h-5 rounded border mr-3 flex items-center justify-center transition-colors
                              ${isSelected ? 'bg-zambia-green border-zambia-green' : 'border-gray-300 bg-white'}
                            `}>
                              {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                            <span className="text-sm font-medium">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Custom Amenity
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAmenity}
                          onChange={(e) => setNewAmenity(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomAmenity();
                            }
                          }}
                          className="flex-1 appearance-none block px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent transition-all text-gray-900"
                          placeholder="e.g. Helipad"
                        />
                        <button
                          type="button"
                          onClick={addCustomAmenity}
                          disabled={!newAmenity.trim()}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </button>
                      </div>

                      {/* Selected Custom Amenities (that aren't in popular list) */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.amenities.filter(a => !(AMENITIES_BY_TYPE[formData.type] || AMENITIES_BY_TYPE.hotel).includes(a)).map((amenity) => (
                          <div key={amenity} className="inline-flex items-center px-3 py-1 rounded-full bg-zambia-green/10 text-zambia-green text-sm font-medium border border-zambia-green/20">
                            {amenity}
                            <button
                              type="button"
                              onClick={() => toggleAmenity(amenity)}
                              className="ml-2 hover:text-green-800 focus:outline-none"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent transition-all text-gray-900"
                            placeholder="reservations@hotel.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent transition-all text-gray-900"
                            placeholder="+260 97 1234567"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                          Physical Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <textarea
                            id="address"
                            name="address"
                            rows={3}
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent transition-all text-gray-900"
                            placeholder="Plot 123, Great East Road, Lusaka"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1">
                          Website <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Globe className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="website_url"
                            id="website_url"
                            value={formData.website_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                            className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent transition-all text-gray-900"
                            placeholder="www.yourhotel.com"
                          />
                        </div>
                      </div>

                      {isRestaurant && (
                        <>
                          <div className="sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Delivery Contact <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={formData.delivery_contact}
                              onChange={(e) => setFormData(prev => ({ ...prev, delivery_contact: e.target.value }))}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent text-gray-900"
                              placeholder="+260..."
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Online Ordering Link <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={formData.online_ordering_link}
                              onChange={(e) => setFormData(prev => ({ ...prev, online_ordering_link: e.target.value }))}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-zambia-green focus:border-transparent text-gray-900"
                              placeholder="https://..."
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {error && (
                <div className="rounded-md bg-red-50 p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center justify-center px-6 py-4 border border-gray-300 shadow-sm text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zambia-green transition-all"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-zambia-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zambia-green disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Creating {isRestaurant ? 'Restaurant' : 'Property'}...
                    </>
                  ) : (
                    <>
                      {step === 4 ? 'Complete Setup' : 'Next Step'} 
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <p className="text-center text-gray-400 text-sm mt-8">
          Need help? <a href="#" className="text-zambia-green hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import ImageUpload from '@/components/ui/ImageUpload';
import MultiImageUpload from '@/components/ui/MultiImageUpload';
import { useProperty } from '../../context/PropertyContext';
import { 
  Loader2, X, Plus, ChevronRight, ChevronLeft, 
  Check, BedDouble, Image as ImageIcon, ListPlus, CheckCircle,
  Building, DollarSign, FileText
} from 'lucide-react';

interface RoomTypeWizardProps {
  initialData?: any;
}

const POPULAR_AMENITIES = [
  'Free Wi-Fi', 'Air Conditioning', 'Flat-screen TV', 'Private Bathroom',
  'Mini Bar', 'Safe', 'Balcony', 'City View', 'Ocean View',
  'Coffee Machine', 'Desk', 'Ironing Facilities', 'Hairdryer',
  'Room Service', 'Wake-up Service', 'Soundproofing'
];

const STEPS = [
  { id: 1, name: 'Property', icon: Building },
  { id: 2, name: 'Basic Info', icon: FileText },
  { id: 3, name: 'Pricing', icon: DollarSign },
  { id: 4, name: 'Media', icon: ImageIcon },
  { id: 5, name: 'Amenities', icon: ListPlus },
];

export default function RoomTypeWizard({ initialData }: RoomTypeWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { properties, selectedPropertyId: activePropertyId } = useProperty();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [customAmenity, setCustomAmenity] = useState('');

  // Initialize selection
  useEffect(() => {
    if (initialData?.property_id) {
        setSelectedPropertyId(initialData.property_id);
    } else if (activePropertyId) {
        setSelectedPropertyId(activePropertyId);
    } else if (properties.length === 1) {
        setSelectedPropertyId(properties[0].id);
    }
  }, [initialData, activePropertyId, properties]);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    base_price: initialData?.base_price || '',
    capacity: initialData?.capacity || 2,
    image_url: initialData?.image_url || '',
    gallery_urls: initialData?.gallery_urls || [],
    amenities: initialData?.amenities || [],
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      if (currentStep === 1) {
        if (!selectedPropertyId) {
            alert('Please select a property.');
            return;
        }
      }
      if (currentStep === 2) {
        if (!formData.name) {
          alert('Please enter a room name.');
          return;
        }
      }
      if (currentStep === 3) {
        if (!formData.base_price || !formData.capacity) {
          alert('Please fill in the required fields (Price, Capacity)');
          return;
        }
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!selectedPropertyId) {
          throw new Error('Please select a property.');
      }

      const payload = { ...formData, property_id: selectedPropertyId };
      
      let error;
      if (initialData?.id) {
        const { error: err } = await supabase.from('room_types').update(payload).eq('id', initialData.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('room_types').insert(payload);
        error = err;
      }

      if (error) throw error;

      router.push('/dashboard/rooms');
      router.refresh();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Property Selection */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mb-4">
            <label className="block text-base font-black text-slate-900">Select Property</label>
            <p className="text-sm text-slate-500 mt-1">Which property does this room type belong to?</p>
        </div>

        {properties.length === 0 ? (
            <div className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg text-center">No properties found. Please create a property first.</div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {properties.map(prop => {
                    const isSelected = selectedPropertyId === prop.id;
                    return (
                        <button
                            key={prop.id}
                            type="button"
                            onClick={() => setSelectedPropertyId(prop.id)}
                            className={`relative flex items-center p-3 rounded-xl border-2 transition-all duration-200 group text-left ${
                                isSelected
                                ? 'border-zambia-green bg-green-50/50'
                                : 'border-slate-100 bg-white hover:border-slate-300'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-colors ${
                                isSelected 
                                ? 'bg-zambia-green border-zambia-green' 
                                : 'bg-white border-slate-300 group-hover:border-slate-400'
                            }`}>
                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className={`font-bold text-sm ${isSelected ? 'text-zambia-green' : 'text-slate-700'}`}>
                                {prop.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Type Name <span className="text-red-500">*</span></label>
          <input
            required
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
            placeholder="e.g., Deluxe Ocean View"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
            rows={6}
            placeholder="Describe the room features and view..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (ZMW) <span className="text-red-500">*</span></label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-500 font-medium">K</span>
            <input
              type="number"
              required
              className="block w-full rounded-lg border border-gray-300 pl-8 pr-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
              placeholder="0.00"
              value={formData.base_price}
              onChange={e => setFormData({ ...formData, base_price: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Guests) <span className="text-red-500">*</span></label>
          <input
            type="number"
            required
            min={1}
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
            value={formData.capacity}
            onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Main Cover Image</h3>
        <div className="max-w-xl">
          <ImageUpload
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
            bucket="room-images"
          />
        </div>
      </div>
      
      <div className="border-t pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gallery</h3>
        <p className="text-sm text-gray-500 mb-4">Add additional photos to showcase the room from different angles.</p>
        <MultiImageUpload
          values={formData.gallery_urls}
          onChange={(urls) => setFormData({ ...formData, gallery_urls: urls })}
          bucket="room-images"
        />
      </div>
    </div>
  );

  const renderStep5 = () => {
    const toggleAmenity = (name: string) => {
      const exists = formData.amenities.some((a: any) => a.name === name);
      if (exists) {
        setFormData({
          ...formData,
          amenities: formData.amenities.filter((a: any) => a.name !== name)
        });
      } else {
        setFormData({
          ...formData,
          amenities: [...formData.amenities, { name }]
        });
      }
    };

    const handleAddCustomAmenity = () => {
      if (customAmenity.trim()) {
        const exists = formData.amenities.some((a: any) => a.name.toLowerCase() === customAmenity.trim().toLowerCase());
        if (!exists) {
          setFormData({
            ...formData,
            amenities: [...formData.amenities, { name: customAmenity.trim() }]
          });
          setCustomAmenity('');
        }
      }
    };

    const removeAmenity = (name: string) => {
      setFormData({
        ...formData,
        amenities: formData.amenities.filter((a: any) => a.name !== name)
      });
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8">
             <h3 className="text-xl font-bold text-gray-900 mb-2">Room Amenities</h3>
             <p className="text-gray-500">Select the features and amenities available in this room.</p>
          </div>

          {/* Popular Amenities */}
          <div className="mb-8">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-zambia-green" /> Popular Amenities
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {POPULAR_AMENITIES.map((amenity) => {
                const isSelected = formData.amenities.some((a: any) => a.name === amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`
                      relative flex items-center p-3 rounded-xl border-2 transition-all duration-200 text-left text-sm font-medium
                      ${isSelected 
                        ? 'border-zambia-green bg-green-50 text-zambia-green' 
                        : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                      }
                    `}
                  >
                    <div className={`
                      w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors flex-shrink-0
                      ${isSelected ? 'bg-zambia-green border-zambia-green' : 'bg-white border-slate-300'}
                    `}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amenities */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h4 className="text-sm font-bold text-gray-900 mb-4">Add Custom Amenities</h4>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="e.g. Jacuzzi, Butler Service..."
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomAmenity())}
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                disabled={!customAmenity.trim()}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {/* Display Selected Custom Amenities (those not in popular list) */}
            <div className="flex flex-wrap gap-2">
              {formData.amenities
                .filter((a: any) => !POPULAR_AMENITIES.includes(a.name))
                .map((amenity: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-sm font-medium text-slate-700">{amenity.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAmenity(amenity.name)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {formData.amenities.filter((a: any) => !POPULAR_AMENITIES.includes(a.name)).length === 0 && (
                  <p className="text-sm text-slate-400 italic">No custom amenities added.</p>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="relative flex justify-between">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full" />
          <div className="absolute top-1/2 left-0 h-1 bg-zambia-green -z-10 -translate-y-1/2 rounded-full transition-all duration-500" 
               style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} />
          
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-gray-50 px-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted || isCurrent 
                      ? 'bg-zambia-green border-zambia-green text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check size={20} /> : <step.icon size={20} />}
                </div>
                <span className={`text-xs font-medium ${isCurrent ? 'text-zambia-green' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white shadow-lg rounded-2xl border border-gray-100 p-8 min-h-[400px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        {/* Footer Actions */}
        <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
          <button
            onClick={() => currentStep === 1 ? router.back() : handleBack()}
            className="px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={() => currentStep === STEPS.length ? handleSubmit() : handleNext()}
            disabled={loading}
            className={`
              flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold text-white shadow-lg transition-all
              ${loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-zambia-green hover:bg-zambia-green/90 hover:shadow-xl active:scale-95'
              }
            `}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : currentStep === STEPS.length ? (
              <>Save Room Type <Check size={20} /></>
            ) : (
              <>Next Step <ChevronRight size={20} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

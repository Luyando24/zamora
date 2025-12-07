'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import ImageUpload from '@/components/ui/ImageUpload';
import MultiImageUpload from '@/components/ui/MultiImageUpload';
import { 
  Loader2, X, Plus, ChevronRight, ChevronLeft, 
  Check, BedDouble, Image as ImageIcon, ListPlus 
} from 'lucide-react';

interface RoomTypeWizardProps {
  initialData?: any;
}

const STEPS = [
  { id: 1, name: 'Details', icon: BedDouble },
  { id: 2, name: 'Media', icon: ImageIcon },
  { id: 3, name: 'Amenities', icon: ListPlus },
];

export default function RoomTypeWizard({ initialData }: RoomTypeWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  
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
        if (!formData.name || !formData.base_price || !formData.capacity) {
          alert('Please fill in the required fields (Name, Price, Capacity)');
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
      const { data: { user } } = await supabase.auth.getUser();
      let hotel_id = user?.user_metadata?.hotel_id;

      if (!hotel_id) {
         // Fallback: Check if user profile has hotel_id (better source of truth)
         const { data: profile } = await supabase.from('profiles').select('hotel_id').eq('id', user?.id).single();
         hotel_id = profile?.hotel_id;
      }

      if (!hotel_id) {
          // Fallback 2: For demo/dev purposes, if user is super_admin, let them pick the first hotel or use a default
          // In a real multi-tenant app, this should force a selection UI. 
          // For now, we'll try to find ANY hotel to attach to.
          const { data: anyHotel } = await supabase.from('hotels').select('id').limit(1).single();
          hotel_id = anyHotel?.id;
          
          if (!hotel_id) {
             throw new Error('No Hotel ID associated with your account. Please contact support.');
          }
      }

      const payload = { ...formData, hotel_id };
      
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2">
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

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
            rows={4}
            placeholder="Describe the room features and view..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Main Cover Image</h3>
        <div className="max-w-xl">
          <ImageUpload
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
          />
        </div>
      </div>
      
      <div className="border-t pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gallery</h3>
        <p className="text-sm text-gray-500 mb-4">Add additional photos to showcase the room from different angles.</p>
        <MultiImageUpload
          values={formData.gallery_urls}
          onChange={(urls) => setFormData({ ...formData, gallery_urls: urls })}
        />
      </div>
    </div>
  );

  const renderStep3 = () => {
    const handleAddAmenity = () => {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, { name: '' }]
      });
    };

    const handleRemoveAmenity = (index: number) => {
      const newAmenities = formData.amenities.filter((_: any, i: number) => i !== index);
      setFormData({ ...formData, amenities: newAmenities });
    };

    const handleAmenityChange = (index: number, value: string) => {
      const newAmenities = [...formData.amenities];
      newAmenities[index] = { name: value };
      setFormData({ ...formData, amenities: newAmenities });
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
               <h3 className="text-lg font-medium text-gray-900">Room Amenities</h3>
               <p className="text-sm text-gray-500">List features like AC, WiFi, TV, etc.</p>
            </div>
            <button
              type="button"
              onClick={handleAddAmenity}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              <Plus size={18} /> Add Amenity
            </button>
          </div>
          
          {formData.amenities.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <ListPlus className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No amenities added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.amenities.map((amenity: any, index: number) => (
                <div key={index} className="flex gap-2 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <input
                    placeholder="e.g. Free WiFi"
                    className="flex-1 border-none p-0 text-gray-900 placeholder-gray-400 focus:ring-0 font-medium"
                    value={amenity.name}
                    onChange={e => handleAmenityChange(index, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex justify-between items-center">
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
  );
}

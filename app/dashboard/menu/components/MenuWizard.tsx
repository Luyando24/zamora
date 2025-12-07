'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useMenuCategories } from '@/hooks/useMenuCategories';
import ImageUpload from '@/components/ui/ImageUpload';
import MultiImageUpload from '@/components/ui/MultiImageUpload';
import { 
  Loader2, X, Plus, ChevronRight, ChevronLeft, 
  Check, Utensils, Image as ImageIcon, ListPlus 
} from 'lucide-react';

interface MenuWizardProps {
  initialData?: any;
}

const STEPS = [
  { id: 1, name: 'Details', icon: Utensils },
  { id: 2, name: 'Media', icon: ImageIcon },
  { id: 3, name: 'Extras', icon: ListPlus },
];

export default function MenuWizard({ initialData }: MenuWizardProps) {
  const router = useRouter();
  const { categories: dbCategories } = useMenuCategories();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Food',
    price: initialData?.price || '',
    image_url: initialData?.image_url || '',
    gallery_urls: initialData?.gallery_urls || [],
    customization_options: initialData?.customization_options || [],
    is_available: initialData?.is_available ?? true
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      // Basic validation
      if (currentStep === 1) {
        if (!formData.name || !formData.price) {
          alert('Please fill in the required fields (Name, Price)');
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
      const hotel_id = user?.user_metadata?.hotel_id;

      if (!hotel_id) throw new Error('Hotel ID not found');

      const payload = { ...formData, hotel_id };
      
      let error;
      if (initialData?.id) {
        const { error: err } = await supabase.from('menu_items').update(payload).eq('id', initialData.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('menu_items').insert(payload);
        error = err;
      }

      if (error) throw error;

      router.push('/dashboard/menu');
      router.refresh();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step Content Renderers ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
          <input
            required
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
            placeholder="e.g., Zambian T-Bone Steak"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
          <select
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
          >
            {dbCategories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (ZMW) <span className="text-red-500">*</span></label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-500 font-medium">K</span>
            <input
              type="number"
              required
              className="block w-full rounded-lg border border-gray-300 pl-8 pr-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
              placeholder="0.00"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
            rows={4}
            placeholder="Describe the ingredients and preparation..."
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
        <p className="text-sm text-gray-500 mb-4">Add additional photos to showcase the dish from different angles.</p>
        <MultiImageUpload
          values={formData.gallery_urls}
          onChange={(urls) => setFormData({ ...formData, gallery_urls: urls })}
        />
      </div>
    </div>
  );

  const renderStep3 = () => {
    const handleAddOption = () => {
      setFormData({
        ...formData,
        customization_options: [...formData.customization_options, { name: '', price: 0 }]
      });
    };

    const handleRemoveOption = (index: number) => {
      const newOptions = formData.customization_options.filter((_: any, i: number) => i !== index);
      setFormData({ ...formData, customization_options: newOptions });
    };

    const handleOptionChange = (index: number, field: string, value: any) => {
      const newOptions = [...formData.customization_options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      setFormData({ ...formData, customization_options: newOptions });
    };

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
               <h3 className="text-lg font-medium text-gray-900">Extras & Options</h3>
               <p className="text-sm text-gray-500">Add paid or free customizations (e.g., Sides, Cooking preference).</p>
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              <Plus size={18} /> Add Option
            </button>
          </div>
          
          {formData.customization_options.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <ListPlus className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No options added yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.customization_options.map((option: any, index: number) => (
                <div key={index} className="flex gap-4 items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Option Name</label>
                    <input
                      placeholder="e.g. Extra Cheese"
                      className="w-full border-none p-0 text-gray-900 placeholder-gray-400 focus:ring-0 font-medium"
                      value={option.name}
                      onChange={e => handleOptionChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-32 border-l pl-4">
                     <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Price (+)</label>
                     <div className="flex items-center">
                       <span className="text-gray-400 mr-1">K</span>
                       <input
                        type="number"
                        className="w-full border-none p-0 text-gray-900 placeholder-gray-400 focus:ring-0 font-bold"
                        value={option.price}
                        onChange={e => handleOptionChange(index, 'price', parseFloat(e.target.value))}
                      />
                     </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_available"
              className="h-5 w-5 rounded border-gray-300 text-zambia-green focus:ring-zambia-green"
              checked={formData.is_available}
              onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
            />
            <div>
              <label htmlFor="is_available" className="text-base font-medium text-gray-900 block">Available for Ordering</label>
              <p className="text-sm text-gray-500">Uncheck this to hide the item from the public menu temporarily.</p>
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
            <>Save Item <Check size={20} /></>
          ) : (
            <>Next Step <ChevronRight size={20} /></>
          )}
        </button>
      </div>
    </div>
  );
}

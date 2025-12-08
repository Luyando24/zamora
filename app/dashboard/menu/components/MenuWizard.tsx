'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
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
  const supabase = createClient();
  const { categories: dbCategories } = useMenuCategories();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

  // Fetch properties and initial assignments
  useState(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch User's Properties
        const { data: userProperties } = await supabase
            .from('properties')
            .select('id, name')
            .eq('created_by', user.id);
        
        if (userProperties) {
            setProperties(userProperties);
            
            // If new item, default to ALL properties
            if (!initialData?.id) {
                setSelectedPropertyIds(userProperties.map(p => p.id));
            }
        }

        // 2. If editing, fetch existing assignments
        if (initialData?.id) {
            const { data: assignments } = await supabase
                .from('menu_item_properties')
                .select('property_id')
                .eq('menu_item_id', initialData.id);
            
            if (assignments) {
                setSelectedPropertyIds(assignments.map(a => a.property_id));
            }
        }
    };
    init();
  });
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Food',
    price: initialData?.price || '',
    image_url: initialData?.image_url || '',
    gallery_urls: initialData?.gallery_urls || [],
    customization_options: initialData?.customization_options || [],
    is_available: initialData?.is_available ?? true,
    weight: initialData?.weight || '',
    ingredients: initialData?.ingredients || '',
    original_price: initialData?.original_price || '',
    discount_badge: initialData?.discount_badge || '',
    dietary_info: initialData?.dietary_info || ''
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
          throw new Error('You must be logged in to save menu items.');
      }

      if (selectedPropertyIds.length === 0) {
          throw new Error('Please select at least one property for this item.');
      }

      // Independent menu items - RLS handles ownership via created_by default
      // We explicitly set created_by on creation to ensure RLS checks pass reliably
      const payload: any = { ...formData };
      
      let itemId;
      let error;
      if (initialData?.id) {
        const { error: err } = await supabase.from('menu_items').update(payload).eq('id', initialData.id);
        error = err;
        itemId = initialData.id;
      } else {
        // Strictly set created_by for new items
        payload.created_by = user.id;
        
        const { data: newItem, error: err } = await supabase.from('menu_items').insert(payload).select().single();
        error = err;
        itemId = newItem?.id;
      }

      if (error) throw error;

      // Update Property Assignments
      // 1. Delete existing
      await supabase.from('menu_item_properties').delete().eq('menu_item_id', itemId);

      // 2. Insert new
      const assignments = selectedPropertyIds.map(propId => ({
          menu_item_id: itemId,
          property_id: propId
      }));

      const { error: assignError } = await supabase.from('menu_item_properties').insert(assignments);
      if (assignError) throw assignError;

      router.push('/dashboard/menu');
      router.refresh();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleProperty = (id: string) => {
    setSelectedPropertyIds(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  // --- Step Content Renderers ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Property Selection */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-4">
            <div>
                <label className="block text-base font-black text-slate-900">Select properties where this food is available</label>
                <p className="text-sm text-slate-500 mt-1">Select which locations will offer this item.</p>
            </div>
            {properties.length > 0 && (
                <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={() => setSelectedPropertyIds(properties.map(p => p.id))}
                        className="text-xs font-bold text-zambia-green hover:underline px-2 py-1"
                    >
                        Select All
                    </button>
                    <button 
                        type="button"
                        onClick={() => setSelectedPropertyIds([])}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 hover:underline px-2 py-1"
                    >
                        Clear
                    </button>
                </div>
            )}
        </div>

        {properties.length === 0 ? (
            <div className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg text-center">No properties found. Please create a property first.</div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {properties.map(prop => {
                    const isSelected = selectedPropertyIds.includes(prop.id);
                    return (
                        <button
                            key={prop.id}
                            type="button"
                            onClick={() => toggleProperty(prop.id)}
                            className={`relative flex items-center p-3 rounded-xl border-2 transition-all duration-200 group text-left ${
                                isSelected
                                ? 'border-zambia-green bg-green-50/50'
                                : 'border-slate-100 bg-white hover:border-slate-300'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                                isSelected 
                                ? 'bg-zambia-green border-zambia-green' 
                                : 'bg-white border-slate-300 group-hover:border-slate-400'
                            }`}>
                                {isSelected && <Check size={12} className="text-white stroke-[3]" />}
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

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (Optional)</label>
           <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-500 font-medium">K</span>
            <input
              type="number"
              className="block w-full rounded-lg border border-gray-300 pl-8 pr-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
              placeholder="e.g. 250"
              value={formData.original_price}
              onChange={e => setFormData({ ...formData, original_price: e.target.value })}
            />
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Weight / Size</label>
           <input
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
              placeholder="e.g. 1.2 kg, 500ml"
              value={formData.weight}
              onChange={e => setFormData({ ...formData, weight: e.target.value })}
            />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Discount Badge</label>
           <input
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
              placeholder="e.g. -12K, PROMO"
              value={formData.discount_badge}
              onChange={e => setFormData({ ...formData, discount_badge: e.target.value })}
            />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Info</label>
           <input
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
              placeholder="e.g. Fried, Vegetarian, Spicy"
              value={formData.dietary_info}
              onChange={e => setFormData({ ...formData, dietary_info: e.target.value })}
            />
        </div>

        <div className="col-span-2">
           <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
           <textarea
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-zambia-green focus:border-transparent"
              rows={2}
              placeholder="List main ingredients..."
              value={formData.ingredients}
              onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
            />
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
            bucket="menu-images"
          />
        </div>
      </div>
      
      <div className="border-t pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gallery</h3>
        <p className="text-sm text-gray-500 mb-4">Add additional photos to showcase the dish from different angles.</p>
        <MultiImageUpload
          values={formData.gallery_urls}
          onChange={(urls) => setFormData({ ...formData, gallery_urls: urls })}
          bucket="menu-images"
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
                <span className={`text-xs font-medium ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px] flex flex-col">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div className="flex justify-between mt-auto pt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
              currentStep === 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft size={20} /> Back
          </button>

          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all hover:pr-4"
            >
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 bg-zambia-green text-white rounded-lg hover:bg-zambia-green/90 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
              Save Item
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

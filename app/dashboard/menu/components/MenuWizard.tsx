'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useMenuCategories } from '@/hooks/useMenuCategories';
import ImageUpload from '@/components/ui/ImageUpload';
import MultiImageUpload from '@/components/ui/MultiImageUpload';
import { 
  Loader2, X, Plus, ChevronRight, ChevronLeft, 
  Check, Utensils, Image as ImageIcon, Sparkles, Building2,
  Scale, ChefHat, DollarSign
} from 'lucide-react';

interface MenuWizardProps {
  initialData?: any;
}

const STEPS = [
  { id: 1, name: 'The Basics', icon: Utensils, description: 'Name, Category & Story' },
  { id: 2, name: 'Pricing & Size', icon: Sparkles, description: 'Cost, Portion & Badges' },
  { id: 3, name: 'Presentation', icon: ImageIcon, description: 'Photos & Gallery' },
  { id: 4, name: 'Availability', icon: Building2, description: 'Locations & Stock' },
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
    weight: initialData?.weight || '', // Portion Size
    ingredients: initialData?.ingredients || '',
    original_price: initialData?.original_price || '',
    discount_badge: initialData?.discount_badge || '',
    dietary_info: initialData?.dietary_info || '' // Dietary Tags
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      // Basic validation
      if (currentStep === 1) {
        if (!formData.name || !formData.category) {
          alert('Please fill in the Item Name and Category.');
          return;
        }
      }
      if (currentStep === 2) {
          if (!formData.price) {
              alert('Please set a Price.');
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

      const payload: any = { ...formData };
      
      let itemId;
      let error;
      if (initialData?.id) {
        const { error: err } = await supabase.from('menu_items').update(payload).eq('id', initialData.id);
        error = err;
        itemId = initialData.id;
      } else {
        payload.created_by = user.id;
        const { data: newItem, error: err } = await supabase.from('menu_items').insert(payload).select().single();
        error = err;
        itemId = newItem?.id;
      }

      if (error) throw error;

      // Update Property Assignments
      await supabase.from('menu_item_properties').delete().eq('menu_item_id', itemId);
      
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

  // --- Step 1: The Basics ---
  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-2">Dish Name <span className="text-pink-600">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Utensils className="h-5 w-5 text-slate-400" />
            </div>
            <input
                required
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3.5 text-slate-900 bg-white focus:bg-white focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all"
                placeholder="e.g. Grilled Bream, Village Chicken, T-Bone Steak"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-bold text-slate-700 mb-2">Category <span className="text-pink-600">*</span></label>
          <select
            className="block w-full rounded-xl border border-slate-200 px-4 py-3.5 text-slate-900 bg-white focus:bg-white focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all"
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
          >
            {dbCategories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 md:col-span-1">
           <label className="block text-sm font-bold text-slate-700 mb-2">Dietary Tags</label>
           <div className="relative">
             <ChefHat className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
             <input
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3.5 text-slate-900 bg-white focus:bg-white focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all"
                placeholder="e.g. Vegetarian, Gluten-Free, Spicy"
                value={formData.dietary_info}
                onChange={e => setFormData({ ...formData, dietary_info: e.target.value })}
              />
           </div>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-2">Description / Story</label>
          <textarea
            rows={4}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-white focus:bg-white focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all resize-none"
            placeholder="Describe the dish, ingredients, and preparation method..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  // --- Step 2: Pricing & Specs ---
  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-bold text-slate-700 mb-2">Selling Price (ZMW) <span className="text-pink-600">*</span></label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-slate-500 font-bold">K</span>
            <input
              type="number"
              required
              className="block w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3.5 text-slate-900 bg-white focus:bg-white focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all text-lg font-medium"
              placeholder="0.00"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
            />
          </div>
        </div>

        <div className="col-span-2 md:col-span-1">
           <label className="block text-sm font-bold text-slate-700 mb-2">Original Price (Optional)</label>
           <div className="relative">
            <span className="absolute left-4 top-3.5 text-slate-500 font-bold">K</span>
            <input
              type="number"
              className="block w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3.5 text-slate-900 bg-white focus:bg-white focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all"
              placeholder="e.g. 250"
              value={formData.original_price}
              onChange={e => setFormData({ ...formData, original_price: e.target.value })}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Show a crossed-out price to indicate a deal.</p>
        </div>

        <div className="col-span-2 md:col-span-1">
           <label className="block text-sm font-bold text-slate-700 mb-2">Portion Size / Weight</label>
           <div className="relative">
             <Scale className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
             <input
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3.5 text-slate-900 bg-white focus:bg-white focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all"
                placeholder="e.g. 300g, Large, Family Platter"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: e.target.value })}
              />
           </div>
        </div>

        <div className="col-span-2 md:col-span-1">
           <label className="block text-sm font-bold text-slate-700 mb-2">Promotional Badge</label>
           <input
              className="block w-full rounded-xl border border-slate-200 px-4 py-3.5 text-slate-900 bg-white focus:bg-white focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all"
              placeholder="e.g. Chef's Special, New, Spicy"
              value={formData.discount_badge}
              onChange={e => setFormData({ ...formData, discount_badge: e.target.value })}
            />
        </div>

        <div className="col-span-2">
           <label className="block text-sm font-bold text-slate-700 mb-2">Key Ingredients</label>
           <textarea
              rows={2}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-white focus:bg-white focus:ring-2 focus:ring-pink-600 focus:border-transparent transition-all"
              placeholder="List main ingredients (e.g. Chicken, Garlic, Ginger, Soy Sauce)..."
              value={formData.ingredients}
              onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
            />
        </div>
      </div>
    </div>
  );

  // --- Step 3: Media ---
  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <label className="block text-base font-bold text-slate-900 mb-4">Main Dish Image</label>
        <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-xs aspect-[4/3] bg-white rounded-xl shadow-sm border-2 border-dashed border-slate-300 overflow-hidden relative group hover:border-pink-600 transition-colors">
                <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    onRemove={() => setFormData({ ...formData, image_url: '' })}
                />
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">
                Upload a high-quality landscape photo of the dish.<br/>
                Recommended size: 1200x900px.
            </p>
        </div>
      </div>

      <div>
          <label className="block text-base font-bold text-slate-900 mb-4">Gallery (Optional)</label>
          <MultiImageUpload
            values={formData.gallery_urls}
            onChange={(urls) => setFormData({ ...formData, gallery_urls: urls })}
            onRemove={(url) => setFormData({ ...formData, gallery_urls: formData.gallery_urls.filter(u => u !== url) })}
          />
      </div>
    </div>
  );

  // --- Step 4: Availability ---
  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
            <div>
                <label className="block text-lg font-black text-slate-900">Where is this served?</label>
                <p className="text-sm text-slate-500 mt-1">Select the properties where this dish is available.</p>
            </div>
            {properties.length > 0 && (
                <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={() => setSelectedPropertyIds(properties.map(p => p.id))}
                        className="text-xs font-bold text-pink-600 hover:underline px-3 py-1.5 bg-pink-50 rounded-lg"
                    >
                        Select All
                    </button>
                    <button 
                        type="button"
                        onClick={() => setSelectedPropertyIds([])}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline px-3 py-1.5 bg-slate-100 rounded-lg"
                    >
                        Clear
                    </button>
                </div>
            )}
        </div>

        {properties.length === 0 ? (
            <div className="text-sm text-slate-500 italic bg-slate-50 p-6 rounded-xl text-center border border-dashed border-slate-300">
                No properties found. Please create a property first.
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {properties.map(prop => {
                    const isSelected = selectedPropertyIds.includes(prop.id);
                    return (
                        <button
                            key={prop.id}
                            type="button"
                            onClick={() => toggleProperty(prop.id)}
                            className={`relative flex items-center p-4 rounded-xl border-2 transition-all duration-200 group text-left ${
                                isSelected
                                ? 'border-pink-600 bg-pink-50/30 shadow-sm'
                                : 'border-slate-100 bg-white hover:border-slate-300'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${
                                isSelected 
                                ? 'bg-pink-600 border-pink-600' 
                                : 'bg-white border-slate-300 group-hover:border-slate-400'
                            }`}>
                                {isSelected && <Check size={14} className="text-white stroke-[3]" />}
                            </div>
                            <span className={`font-bold text-base ${isSelected ? 'text-pink-900' : 'text-slate-700'}`}>
                                {prop.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        )}
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
         <div>
            <label className="block text-base font-bold text-slate-900">Available in Stock</label>
            <p className="text-sm text-slate-500">Toggle off if this item is temporarily sold out.</p>
         </div>
         <label className="relative inline-flex items-center cursor-pointer">
            <input 
                type="checkbox" 
                className="sr-only peer"
                checked={formData.is_available}
                onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-pink-600"></div>
         </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header / Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
            <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-pink-600 -z-10 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            ></div>
            
            {STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const Icon = step.icon;

                return (
                    <div key={step.id} className="flex flex-col items-center group cursor-default">
                        <div 
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 bg-white ${
                                isActive 
                                    ? 'border-pink-600 text-pink-600 shadow-lg shadow-pink-100 scale-110' 
                                    : isCompleted
                                        ? 'border-pink-600 bg-pink-600 text-white'
                                        : 'border-slate-200 text-slate-300'
                            }`}
                        >
                            {isCompleted ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
                        </div>
                        <div className={`mt-3 text-center transition-colors duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                            <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-pink-600' : 'text-slate-500'}`}>
                                Step {step.id}
                            </p>
                            <p className={`text-xs font-medium ${isActive ? 'text-slate-900' : 'text-slate-400 hidden sm:block'}`}>
                                {step.name}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-100">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${
            currentStep === 1 
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ChevronLeft size={20} /> Back
        </button>

        {currentStep === STEPS.length ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg hover:shadow-pink-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
            Save Item
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-0.5"
          >
            Next Step <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

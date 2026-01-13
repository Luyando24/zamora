'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useBarMenuCategories } from '@/hooks/useBarMenuCategories';
import ImageUpload from '@/components/ui/ImageUpload';
import MultiImageUpload from '@/components/ui/MultiImageUpload';
import { useProperty } from '../../context/PropertyContext';
import { 
  Loader2, X, Plus, ChevronRight, ChevronLeft, 
  Check, Wine, Image as ImageIcon, Sparkles, Building2,
  Beer, Martini, GlassWater
} from 'lucide-react';

interface MenuWizardProps {
  initialData?: any;
}

const STEPS = [
  { id: 1, name: 'The Basics', icon: Wine, description: 'Name, Category & Story' },
  { id: 2, name: 'Pricing & Size', icon: Sparkles, description: 'Cost, Volume & Badges' },
  { id: 3, name: 'Presentation', icon: ImageIcon, description: 'Photos & Gallery' },
  { id: 4, name: 'Availability', icon: Building2, description: 'Locations & Stock' },
];

export default function MenuWizard({ initialData }: MenuWizardProps) {
  const router = useRouter();
  const supabase = createClient();
  const { properties, selectedPropertyId } = useProperty();
  const { categories: dbCategories } = useBarMenuCategories(selectedPropertyId);
  
  // Deduplicate categories and ensure they are valid
  const uniqueCategories = Array.from(new Set(dbCategories.map(c => c.name)))
    .filter(Boolean)
    .map(name => ({ id: name, name }));

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  
  // Track original assignments to detect changes
  const [originalPropertyIds, setOriginalPropertyIds] = useState<string[]>([]);

  // Fetch initial assignments
  useEffect(() => {
    const init = async () => {
        // 1. If editing, fetch existing assignments
        if (initialData?.id) {
            const { data: assignments } = await supabase
                .from('bar_menu_item_properties')
                .select('property_id')
                .eq('menu_item_id', initialData.id);
            
            if (assignments) {
                const ids = assignments.map(a => a.property_id);
                setSelectedPropertyIds(ids);
                setOriginalPropertyIds(ids);
            }
        } else {
            // If new item, default to ACTIVE property
            // We only set this ONCE if the list is empty
            setSelectedPropertyIds(prev => {
                if (prev.length === 0 && selectedPropertyId) {
                    return [selectedPropertyId];
                }
                return prev;
            });
        }
    };
    init();
  }, [initialData, selectedPropertyId, supabase]);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    price: initialData?.price || '',
    image_url: initialData?.image_url || '',
    gallery_urls: initialData?.gallery_urls || [],
    customization_options: initialData?.customization_options || [],
    is_available: initialData?.is_available ?? true,
    weight: initialData?.weight || '', // Re-purposed as Volume/Size for drinks
    ingredients: initialData?.ingredients || '', // Mixers/Ingredients
    original_price: initialData?.original_price || '',
    discount_badge: initialData?.discount_badge || '',
    dietary_info: initialData?.dietary_info || '' // Alcohol % or Type
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

      // Sanitize payload
      const payload: any = { ...formData };

      // Handle numeric fields that might be empty strings
      if (payload.original_price === '') {
        payload.original_price = null;
      }
      
      // Price is required but safe to sanitize just in case
      if (payload.price === '') {
        payload.price = null; 
      }
      
      // STRICT ISOLATION LOGIC
      
      if (initialData?.id) {
        // 1. UPDATE EXISTING ITEM
        // Updates the item itself. Note: If this item happens to be shared (legacy data), 
        // this update will affect all properties sharing it. This is expected behavior for shared items.
        const { error: updateError } = await supabase
            .from('bar_menu_items')
            .update(payload)
            .eq('id', initialData.id);
            
        if (updateError) throw updateError;
        
        // Handle Assignment Changes
        
        // A. Removed Properties: Delete the assignment (Item remains, just unlinked from this property)
        const removedProps = originalPropertyIds.filter(id => !selectedPropertyIds.includes(id));
        if (removedProps.length > 0) {
            await supabase.from('bar_menu_item_properties')
                .delete()
                .eq('menu_item_id', initialData.id)
                .in('property_id', removedProps);
        }
        
        // B. Added Properties: Create NEW COPY of the item (Strict Isolation)
        // We do NOT link the existing ID to the new property to prevent future "leakage"
        const addedProps = selectedPropertyIds.filter(id => !originalPropertyIds.includes(id));
        for (const propId of addedProps) {
            const newItemPayload = { ...payload, created_by: user.id };
            // Ensure property_id column is set if it exists (for consistency)
            // We use 'property_id' in payload if the table supports it, otherwise it's ignored or errors?
            // Safer to rely on junction table, but if table has property_id, we should set it.
            // Since we can't easily check schema here, we'll include it if we think it's needed.
            // Previous code didn't set it explicitly, but let's try.
            // Actually, best to rely on junction table.
            
            const { data: newItem, error: insertError } = await supabase
                .from('bar_menu_items')
                .insert(newItemPayload)
                .select()
                .single();
                
            if (insertError) throw insertError;
            
            await supabase.from('bar_menu_item_properties').insert({
                menu_item_id: newItem.id,
                property_id: propId
            });
            
            // Also update property_id on the item itself if column exists (optional but good)
            await supabase.from('bar_menu_items').update({ property_id: propId }).eq('id', newItem.id).maybeSingle();
        }

      } else {
        // 2. CREATE NEW ITEM
        // Create a separate item copy for EACH selected property
        for (const propId of selectedPropertyIds) {
            const newItemPayload = { ...payload, created_by: user.id };
            
            const { data: newItem, error: insertError } = await supabase
                .from('bar_menu_items')
                .insert(newItemPayload)
                .select()
                .single();
                
            if (insertError) throw insertError;
            
            await supabase.from('bar_menu_item_properties').insert({
                menu_item_id: newItem.id,
                property_id: propId
            });
            
             // Also update property_id on the item itself if column exists
            await supabase.from('bar_menu_items').update({ property_id: propId }).eq('id', newItem.id).maybeSingle();
        }
      }

      router.push('/dashboard/bar-menu');
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
          <label className="block text-sm font-bold text-slate-700 mb-2">Drink Name <span className="text-pink-500">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Martini className="h-5 w-5 text-slate-400" />
            </div>
            <input
                required
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3.5 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="e.g. Classic Mojito, Old Fashioned, Castle Lite"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-bold text-slate-700 mb-2">Category <span className="text-pink-500">*</span></label>
          <select
            required
            className="block w-full rounded-xl border border-slate-200 px-4 py-3.5 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="" disabled>Select a category...</option>
            {uniqueCategories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 md:col-span-1">
           <label className="block text-sm font-bold text-slate-700 mb-2">Alcohol Content / Type</label>
           <input
              className="block w-full rounded-xl border border-slate-200 px-4 py-3.5 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="e.g. 12%, Non-Alcoholic, Single Malt"
              value={formData.dietary_info}
              onChange={e => setFormData({ ...formData, dietary_info: e.target.value })}
            />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-2">Description / Tasting Notes</label>
          <textarea
            rows={4}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
            placeholder="Describe the flavor profile, origin, or serving suggestion..."
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
          <label className="block text-sm font-bold text-slate-700 mb-2">Selling Price (ZMW) <span className="text-pink-500">*</span></label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-slate-500 font-bold">K</span>
            <input
              type="number"
              required
              className="block w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3.5 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-lg font-medium"
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
              className="block w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3.5 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="e.g. 250"
              value={formData.original_price}
              onChange={e => setFormData({ ...formData, original_price: e.target.value })}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Show a crossed-out price to indicate a deal.</p>
        </div>

        <div className="col-span-2 md:col-span-1">
           <label className="block text-sm font-bold text-slate-700 mb-2">Volume / Size</label>
           <div className="relative">
             <Beer className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
             <input
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3.5 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="e.g. 330ml, 750ml, Double Shot"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: e.target.value })}
              />
           </div>
        </div>

        <div className="col-span-2 md:col-span-1">
           <label className="block text-sm font-bold text-slate-700 mb-2">Promotional Badge</label>
           <input
              className="block w-full rounded-xl border border-slate-200 px-4 py-3.5 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="e.g. Happy Hour, New, Bestseller"
              value={formData.discount_badge}
              onChange={e => setFormData({ ...formData, discount_badge: e.target.value })}
            />
        </div>

        <div className="col-span-2">
           <label className="block text-sm font-bold text-slate-700 mb-2">Mixers / Ingredients</label>
           <textarea
              rows={2}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="List key ingredients (e.g. Rum, Mint, Lime, Soda Water)..."
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
        <label className="block text-base font-bold text-slate-900 mb-4">Main Drink Image</label>
        <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-xs aspect-square bg-white rounded-xl shadow-sm border-2 border-dashed border-slate-300 overflow-hidden relative group hover:border-pink-400 transition-colors">
                <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    className="h-full"
                    showLabel={false}
                  />
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">
                Upload a high-quality photo of the drink.<br/>
                Recommended size: 1000x1000px (Square).
            </p>
        </div>
      </div>

      <div>
          <label className="block text-base font-bold text-slate-900 mb-4">Gallery (Optional)</label>
          <MultiImageUpload
            values={formData.gallery_urls}
            onChange={(urls) => setFormData({ ...formData, gallery_urls: urls })}
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
                <p className="text-sm text-slate-500 mt-1">Select the properties where this drink is available.</p>
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
                                ? 'border-pink-500 bg-pink-50/30 shadow-sm'
                                : 'border-slate-100 bg-white hover:border-slate-300'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${
                                isSelected 
                                ? 'bg-pink-500 border-pink-500' 
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
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
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
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-pink-500 -z-10 rounded-full transition-all duration-500"
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
                                    ? 'border-pink-500 text-pink-500 shadow-lg shadow-pink-100 scale-110' 
                                    : isCompleted
                                        ? 'border-pink-500 bg-pink-500 text-white'
                                        : 'border-slate-200 text-slate-300'
                            }`}
                        >
                            {isCompleted ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
                        </div>
                        <div className={`mt-3 text-center transition-colors duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                            <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-pink-600' : 'text-slate-500'}`}>
                                Step {step.id}
                            </p>
                            <p className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                {step.name}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8">
            <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900">{STEPS[currentStep - 1].name}</h2>
                <p className="text-slate-500">{STEPS[currentStep - 1].description}</p>
            </div>
            
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
        </div>

        {/* Footer / Navigation */}
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between items-center">
            <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all ${
                    currentStep === 1 
                        ? 'text-slate-300 cursor-not-allowed' 
                        : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
            >
                <ChevronLeft size={20} className="mr-2" />
                Back
            </button>

            {currentStep < STEPS.length ? (
                <button
                    onClick={handleNext}
                    className="flex items-center px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:translate-y-[-1px]"
                >
                    Next Step
                    <ChevronRight size={20} className="ml-2" />
                </button>
            ) : (
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center px-8 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-500 transition-all shadow-lg shadow-pink-200 hover:shadow-xl hover:translate-y-[-1px] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check size={20} className="mr-2" />
                            Save Drink Item
                        </>
                    )}
                </button>
            )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '../../context/PropertyContext';
import { 
  Loader2, Building, DollarSign, FileText, LayoutGrid
} from 'lucide-react';

interface TableTypeWizardProps {
  initialData?: any;
}

const STEPS = [
  { id: 1, name: 'Property', icon: Building },
  { id: 2, name: 'Basic Info', icon: FileText },
  { id: 3, name: 'Capacity', icon: LayoutGrid },
];

export default function TableTypeWizard({ initialData }: TableTypeWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { properties, selectedPropertyId: activePropertyId } = useProperty();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

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
    name: initialData?.name || '', // e.g. "Indoor Table", "Outdoor Table"
    description: initialData?.description || '',
    base_price: initialData?.base_price || 0, // Usually 0 for tables
    capacity: initialData?.capacity || 4,
    image_url: initialData?.image_url || '',
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
          alert('Please enter a table type name (e.g. Indoor, Outdoor).');
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
      const dataToSubmit = {
        property_id: selectedPropertyId,
        name: formData.name,
        description: formData.description,
        base_price: formData.base_price || 0,
        capacity: formData.capacity,
        image_url: formData.image_url,
        category: 'table'
      };

      let error;
      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from('room_types')
          .update(dataToSubmit)
          .eq('id', initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('room_types')
          .insert(dataToSubmit);
        error = insertError;
      }

      if (error) throw error;

      router.push('/dashboard/tables');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving table type:', error);
      alert('Failed to save table type: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Steps Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                    isCompleted || isCurrent 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  <step.icon size={18} />
                </div>
                <span className={`text-xs font-bold mt-2 ${isCurrent ? 'text-primary' : 'text-slate-400'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
          {/* Progress Bar Background */}
          <div className="absolute top-[4.5rem] left-0 w-full h-0.5 bg-slate-200 -z-0 hidden" />
        </div>
      </div>

      <div className="p-8 max-w-2xl mx-auto min-h-[400px]">
        
        {/* Step 1: Property Selection */}
        {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-slate-900">Select Property</h2>
                <div className="grid gap-4">
                    {properties.map(property => (
                        <div 
                            key={property.id}
                            onClick={() => setSelectedPropertyId(property.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedPropertyId === property.id 
                                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <h3 className="font-bold text-slate-900">{property.name}</h3>
                            <p className="text-sm text-slate-500 capitalize">{property.type}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Step 2: Basic Info */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-900">Table Type Details</h2>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Type Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="table-type-suggestions"
                placeholder="e.g. Indoor, Outdoor, VIP Booth"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-slate-900"
              />
              <datalist id="table-type-suggestions">
                <option value="Indoor" />
                <option value="Outdoor" />
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea
                rows={3}
                placeholder="e.g. Tables located in the main dining hall..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none text-slate-900"
              />
            </div>
          </div>
        )}

        {/* Step 3: Capacity */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-900">Capacity</h2>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Standard Capacity (Pax) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, capacity: Math.max(1, prev.capacity - 1) }))}
                  className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-24 text-center px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary font-bold text-lg text-slate-900"
                />
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, capacity: prev.capacity + 1 }))}
                  className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Default number of seats for this table type.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            currentStep === 1 
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200'
          }`}
        >
          Back
        </button>

        {currentStep === STEPS.length ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-600 shadow-lg shadow-primary/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {initialData ? 'Update Type' : 'Create Type'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all transform active:scale-95"
          >
            Next Step
          </button>
        )}
      </div>
    </div>
  );
}

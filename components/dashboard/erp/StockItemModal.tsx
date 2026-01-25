'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Calendar } from 'lucide-react';

export default function StockItemModal({ 
  isOpen, 
  onClose, 
  propertyId, 
  suppliers,
  item,
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  propertyId: string; 
  suppliers: Supplier[];
  item?: InventoryItem | null;
  onSuccess: () => void; 
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food',
    unit: 'unit',
    min_quantity: 10,
    cost_per_unit: 0,
    supplier_id: '',
    initial_quantity: 0,
    restock_date: new Date().toISOString().split('T')[0],
    location: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          name: item.name || '',
          category: item.category || 'Food',
          unit: item.unit || 'unit',
          min_quantity: item.min_quantity || 10,
          cost_per_unit: item.cost_per_unit || 0,
          supplier_id: item.supplier_id || '',
          initial_quantity: 0, // Not used for edit
          restock_date: new Date().toISOString().split('T')[0],
          location: item.location || ''
        });
      } else {
        setFormData({ 
            name: '', 
            category: 'Food', 
            unit: 'unit', 
            min_quantity: 10, 
            cost_per_unit: 0, 
            supplier_id: '',
            initial_quantity: 0,
            restock_date: new Date().toISOString().split('T')[0],
            location: ''
        });
      }
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      if (item) {
        // Update
        const { error } = await supabase
          .from('inventory_items')
          .update({
            name: formData.name,
            category: formData.category,
            unit: formData.unit,
            min_quantity: formData.min_quantity,
            cost_per_unit: formData.cost_per_unit,
            location: formData.location,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)
          .eq('property_id', propertyId);

        if (error) throw error;
      } else {
        // Create - Use API to handle transaction
        const response = await fetch('/api/mobile/manager/stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
                propertyId,
                name: formData.name,
                category: formData.category,
                unit: formData.unit,
                min_quantity: formData.min_quantity,
                cost_per_unit: formData.cost_per_unit,
                initial_quantity: formData.initial_quantity,
                initial_date: formData.restock_date,
                location: formData.location
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create item');
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">{item ? 'Edit Stock Item' : 'Add New Stock Item'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Item Name</label>
            <input
              required
              placeholder="e.g., Tomato Sauce"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
             {/* Category */}
             <div>
               <label className="block text-sm font-medium text-slate-600 mb-1.5">Category</label>
               <div className="relative">
                <select
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 appearance-none bg-white"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                >
                    <option value="Food">Food</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Amenity">Amenity</option>
                    <option value="Other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
               </div>
             </div>
             
             {/* Unit */}
             <div>
               <label className="block text-sm font-medium text-slate-600 mb-1.5">Unit</label>
               <div className="relative">
                <select
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 appearance-none bg-white"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                >
                    <option value="unit">unit</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pack">pack</option>
                    <option value="box">box</option>
                    <option value="bottle">bottle</option>
                    <option value="can">can</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
               </div>
             </div>
          </div>
          
          {/* Quantity & Date (Only for New Items) */}
          {!item && (
            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Starting Quantity ({formData.unit})</label>
                    <input
                        type="number"
                        min="0"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                        value={formData.initial_quantity}
                        onChange={e => setFormData({...formData, initial_quantity: Number(e.target.value)})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Restock Date</label>
                    <div className="relative">
                        <input
                            type="date"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                            value={formData.restock_date}
                            onChange={e => setFormData({...formData, restock_date: e.target.value})}
                        />
                        <Calendar className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={18} />
                    </div>
                </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
             {/* Cost */}
             <div>
               <label className="block text-sm font-medium text-slate-600 mb-1.5">Cost per Unit</label>
               <input
                 type="number"
                 min="0"
                 step="0.01"
                 className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                 value={formData.cost_per_unit}
                 onChange={e => setFormData({...formData, cost_per_unit: Number(e.target.value)})}
               />
             </div>
             {/* Min Quantity */}
             <div>
               <label className="block text-sm font-medium text-slate-600 mb-1.5">Min Quantity (Alert)</label>
               <input
                 type="number"
                 min="0"
                 className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                 value={formData.min_quantity}
                 onChange={e => setFormData({...formData, min_quantity: Number(e.target.value)})}
               />
             </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Storage Location</label>
            <input
              placeholder="e.g., Shelf A2"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                'Saving...' 
              ) : (
                <>
                    <Plus size={18} strokeWidth={2.5} />
                    {item ? 'Update Item' : 'Create Item'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

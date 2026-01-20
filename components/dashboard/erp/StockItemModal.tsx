'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X } from 'lucide-react';
import { Supplier } from '@/hooks/useERP';

export default function StockItemModal({ 
  isOpen, 
  onClose, 
  propertyId, 
  suppliers,
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  propertyId: string; 
  suppliers: Supplier[];
  onSuccess: () => void; 
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'food',
    unit: 'kg',
    min_quantity: 0,
    cost_per_unit: 0,
    supplier_id: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('inventory_items')
        .insert({
          ...formData,
          supplier_id: formData.supplier_id || null,
          property_id: propertyId,
          quantity: 0 // Start with 0
        });

      if (error) throw error;
      onSuccess();
      onClose();
      setFormData({ name: '', category: 'food', unit: 'kg', min_quantity: 0, cost_per_unit: 0, supplier_id: '' });
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">Add Stock Item</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
            <input
              required
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
               <select
                 className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={formData.category}
                 onChange={e => setFormData({...formData, category: e.target.value})}
               >
                 <option value="food">Food</option>
                 <option value="beverage">Beverage</option>
                 <option value="cleaning">Cleaning</option>
                 <option value="amenity">Amenity</option>
                 <option value="other">Other</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
               <input
                 className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={formData.unit}
                 onChange={e => setFormData({...formData, unit: e.target.value})}
                 placeholder="e.g. kg, L, pack"
               />
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Min Quantity (Reorder)</label>
               <input
                 type="number"
                 min="0"
                 className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={formData.min_quantity}
                 onChange={e => setFormData({...formData, min_quantity: Number(e.target.value)})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Cost per Unit</label>
               <input
                 type="number"
                 min="0"
                 step="0.01"
                 className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={formData.cost_per_unit}
                 onChange={e => setFormData({...formData, cost_per_unit: Number(e.target.value)})}
               />
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
             <select
               className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={formData.supplier_id}
               onChange={e => setFormData({...formData, supplier_id: e.target.value})}
             >
               <option value="">Select Supplier</option>
               {suppliers.map(s => (
                 <option key={s.id} value={s.id}>{s.name}</option>
               ))}
             </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

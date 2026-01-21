'use client';
import { useState } from 'react';
import { InventoryItem, useERP } from '@/hooks/useERP';
import { useProperty } from '../context/PropertyContext';
import { Plus, Search, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Pencil } from 'lucide-react';
import StockItemModal from '@/components/dashboard/erp/StockItemModal';

export default function StockPage() {
  const { selectedPropertyId } = useProperty();
  const { inventory, suppliers, loading, refetch } = useERP(selectedPropertyId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
         <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium">Loading stock...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Management</h2>
          <p className="text-slate-500 text-sm">Track inventory levels and costs.</p>
        </div>
        
        <div className="flex items-center gap-2">
           <select
             className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             value={filterCategory}
             onChange={e => setFilterCategory(e.target.value)}
           >
             <option value="all">All Categories</option>
             <option value="food">Food</option>
             <option value="beverage">Beverage</option>
             <option value="cleaning">Cleaning</option>
             <option value="amenity">Amenity</option>
             <option value="other">Other</option>
           </select>
           
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input
               type="text"
               placeholder="Search items..."
               className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
           
           <button
             onClick={handleAdd}
             className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/10"
           >
             <Plus size={16} /> Add Item
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Level</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Cost / Unit</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredItems.map(item => {
                const isLowStock = item.quantity <= item.min_quantity;
                const supplierName = suppliers.find(s => s.id === item.supplier_id)?.name || '-';
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3 text-slate-500">
                          <Package size={16} />
                        </div>
                        <div className="text-sm font-medium text-slate-900">{item.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-slate-900">{item.quantity} <span className="text-slate-500 font-normal text-xs">{item.unit}</span></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-slate-600">${(item.cost_per_unit || 0).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {supplierName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isLowStock ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                          <AlertTriangle size={12} /> Low Stock
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          Good
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Item"
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No stock items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyId={selectedPropertyId || ''}
        suppliers={suppliers}
        item={selectedItem}
        onSuccess={refetch}
      />
    </div>
  );
}

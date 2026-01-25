'use client';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InventoryItem, useERP } from '@/hooks/useERP';
import { useProperty } from '../context/PropertyContext';
import { Plus, Search, Package, AlertTriangle, Pencil, ArrowUpRight, History, Camera, RefreshCw } from 'lucide-react';
import StockItemModal from '@/components/dashboard/erp/StockItemModal';
import StockAdjustmentModal from '@/components/dashboard/erp/StockAdjustmentModal';

export default function StockPage() {
  const { selectedPropertyId } = useProperty();
  const { inventory, suppliers, loading, refetch } = useERP(selectedPropertyId);
  const [barItems, setBarItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'bar'>('inventory');
  const supabase = createClient();

  useEffect(() => {
    if (selectedPropertyId && activeTab === 'bar') {
        const fetchBarStock = async () => {
            const { data } = await supabase
                .from('bar_menu_items')
                .select('id, name, stock_quantity, low_stock_threshold, cost_price, category, track_stock, bar_menu_item_properties!inner(property_id)')
                .eq('bar_menu_item_properties.property_id', selectedPropertyId)
                .eq('track_stock', true)
                .order('name');
            if (data) setBarItems(data);
        };
        fetchBarStock();
    }
  }, [selectedPropertyId, activeTab, supabase]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredItems = (activeTab === 'inventory' ? inventory : barItems).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsAdjustmentModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  // Calculate stats
  const currentList = activeTab === 'inventory' ? inventory : barItems;
  const lowStockCount = currentList.filter(i => (i.quantity || i.stock_quantity || 0) <= (i.min_quantity || i.low_stock_threshold || 0)).length;
  const totalValue = currentList.reduce((sum, i) => sum + ((i.quantity || i.stock_quantity || 0) * (i.cost_per_unit || i.cost_price || 0)), 0);

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
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Management</h1>
          <p className="text-slate-500">Track inventory and bar stock levels</p>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
              activeTab === 'inventory' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Inventory Items
          </button>
          <button
            onClick={() => setActiveTab('bar')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
              activeTab === 'bar' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Bar Menu Items
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase">Total Items</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{inventory.length}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
              <Package size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase">Low Stock</p>
              <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {lowStockCount}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase">Total Value</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">K{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <span className="font-bold">K</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-3">
          {activeTab === 'inventory' && (
            <Link
                href="/dashboard/stock/movements"
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-sm transition-colors"
            >
                <History size={16} /> Movements
            </Link>
          )}
          <Link
            href="/dashboard/stock/snapshots"
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-sm transition-colors"
          >
            <Camera size={16} /> Snapshots
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'inventory' ? 'items' : 'bar drinks'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {activeTab === 'inventory' && (
            <button
                onClick={handleAdd}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors flex-1 md:flex-none"
            >
                <Plus size={18} /> Add Item
            </button>
          )}
          {activeTab === 'bar' && (
            <Link
                href="/dashboard/bar-menu"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex-1 md:flex-none"
            >
                Manage Bar Menu
            </Link>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Stock Level</th>
                <th className="px-6 py-4 text-right">Unit Cost</th>
                <th className="px-6 py-4 text-right">Total Value</th>
                <th className="px-6 py-4 text-center">Status</th>
                {activeTab === 'inventory' && <th className="px-6 py-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const qty = item.quantity || item.stock_quantity || 0;
                const min = item.min_quantity || item.low_stock_threshold || 0;
                const cost = item.cost_per_unit || item.cost_price || 0;
                const isLow = qty <= min;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.sku && <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 capitalize">
                        {item.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                          {qty} {item.unit || 'units'}
                        </span>
                        {isLow && (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
                            <AlertTriangle size={10} /> Low Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">
                      K{Number(cost).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      K{(qty * cost).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          Restock Needed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          In Stock
                        </span>
                      )}
                    </td>
                    {activeTab === 'inventory' && (
                        <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                            onClick={() => handleAdjust(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Adjust Stock"
                            >
                            <ArrowUpRight size={16} />
                            </button>
                            <button 
                            onClick={() => handleEdit(item)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Item"
                            >
                            <Pencil size={16} />
                            </button>
                        </div>
                        </td>
                    )}
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    No items found matching your search.
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

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        propertyId={selectedPropertyId || ''}
        item={selectedItem}
        onSuccess={refetch}
      />
    </div>
  );
}

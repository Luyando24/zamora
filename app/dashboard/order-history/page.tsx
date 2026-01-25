'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '../context/PropertyContext';
import {
  Trash2, RefreshCw, Utensils, Wine, Search,
  CalendarDays, Filter, Eye, X, CheckCircle2, XCircle, CheckSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Reuse types or define simplified ones
interface OrderItem {
  id: string;
  quantity: number;
  total_price: number;
  item_name?: string;
  menu_items?: { name: string };
  bar_menu_items?: { name: string };
}

interface Order {
  id: string;
  created_at: string;
  status: 'delivered' | 'cancelled' | 'pos_completed';
  guest_room_number: string;
  guest_name: string;
  total_amount: number;
  order_items?: OrderItem[]; // for food
  bar_order_items?: OrderItem[]; // for bar
  guest_phone?: string;
  payment_method?: string;
  payment_status?: 'pending' | 'paid';
}

export default function OrderHistoryPage() {
  const { selectedPropertyId, properties } = useProperty();
  const [activeTab, setActiveTab] = useState<'food' | 'bar'>('food');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role) setUserRole(profile.role);
        else setUserRole('staff');
      } else {
        setUserRole('staff');
      }
    };
    fetchRole();
  }, [supabase]);

  const fetchOrders = useCallback(async () => {
    if (!selectedPropertyId) return;
    setLoading(true);

    try {
      const table = activeTab === 'food' ? 'orders' : 'bar_orders';
      const itemsTable = activeTab === 'food' ? 'order_items' : 'bar_order_items';
      const menuRelation = activeTab === 'food' ? 'menu_items' : 'bar_menu_items';

      // Build status filter
      let statuses = ['delivered', 'cancelled', 'pos_completed'];
      // Standard history view includes delivered, cancelled, and pos_completed

      const { data, error } = await supabase
        .from(table)
        .select(`
          *,
          payment_status,
          ${itemsTable} (
            id, quantity, total_price, item_name,
            ${menuRelation} (name)
          )
        `)
        .eq('property_id', selectedPropertyId)
        .in('status', statuses)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId, activeTab, supabase, userRole]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) return;

    try {
      const table = activeTab === 'food' ? 'orders' : 'bar_orders';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const deleteAllOrders = async () => {
    if (!selectedPropertyId) return;
    const type = activeTab === 'food' ? 'food' : 'bar';
    if (!confirm(`Are you sure you want to permanently delete ALL ${type} history records? This action cannot be undone.`)) return;

    // Double confirmation for safety
    if (!confirm(`This will wipe out the entire ${type} order history for this property. Are you ABSOLUTELY SURE?`)) return;

    try {
      const table = activeTab === 'food' ? 'orders' : 'bar_orders';
      // Only delete orders that are in the "history" status
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('property_id', selectedPropertyId)
        .in('status', ['delivered', 'cancelled', 'pos_completed']);

      if (error) throw error;

      setOrders([]);
      alert(`All ${type} history has been deleted.`);
    } catch (error) {
      console.error('Error deleting all orders:', error);
      alert('Failed to delete orders');
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.guest_name?.toLowerCase().includes(searchLower) ||
      order.guest_room_number?.toString().toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order History</h1>
          <p className="text-slate-500 text-sm">Manage completed and cancelled orders</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('food')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'food'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              <Utensils size={16} />
              Food
            </button>
            <button
              onClick={() => setActiveTab('bar')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'bar'
                ? 'bg-purple-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-purple-900 hover:bg-purple-50'
                }`}
            >
              <Wine size={16} />
              Bar
            </button>
          </div>

          <button
            onClick={fetchOrders}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={deleteAllOrders}
            className="p-2.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            title={`Delete All ${activeTab === 'food' ? 'Food' : 'Bar'} History`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by guest name, room, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Filter size={16} />
          <span>Showing {filteredOrders.length} records</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Guest / Room</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-2 opacity-50" />
                    Loading history...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No history records found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const items = activeTab === 'food' ? order.order_items : order.bar_order_items;
                  const itemCount = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  const itemSummary = items?.slice(0, 2).map(i => i.item_name || (activeTab === 'food' ? i.menu_items?.name : i.bar_menu_items?.name)).join(', ');

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {format(new Date(order.created_at), 'dd MMM yyyy')}
                          </span>
                          <span className="text-xs text-slate-400">
                            {format(new Date(order.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{order.guest_room_number}</span>
                          <span className="text-sm text-slate-500">{order.guest_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">
                            {itemCount}x
                          </span>
                          <span className="truncate max-w-[200px]" title={itemSummary}>
                            {itemSummary}{items && items.length > 2 ? '...' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        K{(order.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${order.payment_status === 'paid'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-orange-100 text-orange-700 border border-orange-200'
                          }`}>
                          {order.payment_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize gap-1.5 ${order.status === 'pos_completed'
                          ? 'bg-blue-100 text-blue-700'
                          : order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                          }`}>
                          {order.status === 'pos_completed' ? <CheckSquare size={12} /> : order.status === 'delivered' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {order.status === 'pos_completed' ? 'Registered' : order.status === 'delivered' ? 'Completed' : 'Cancelled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Permanently"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Order Details</h3>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase font-bold">Guest</p>
                      <p className="font-semibold text-slate-900">{selectedOrder.guest_name}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase font-bold">Room/Table</p>
                      <p className="font-semibold text-slate-900">{selectedOrder.guest_room_number}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase font-bold">Payment Status</p>
                      <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase ${selectedOrder.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}>
                        {selectedOrder.payment_status || 'Pending'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase font-bold">Payment Method</p>
                      <p className="font-semibold text-slate-900 capitalize">{selectedOrder.payment_method?.replace('_', ' ') || 'Room Charge'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-2 text-sm">Items</h4>
                    <div className="space-y-2 border-t border-slate-100 pt-2">
                      {(activeTab === 'food' ? selectedOrder.order_items : selectedOrder.bar_order_items)?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm py-1">
                          <span className="text-slate-600">
                            <span className="font-bold text-slate-900 mr-2">{item.quantity}x</span>
                            {item.item_name || (activeTab === 'food' ? item.menu_items?.name : item.bar_menu_items?.name)}
                          </span>
                          <span className="font-medium">K{(item.total_price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="font-bold text-slate-500">Total Amount</span>
                    <span className="text-xl font-black text-slate-900">K{(selectedOrder.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => deleteOrder(selectedOrder.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

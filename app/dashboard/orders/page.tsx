'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Clock, CheckCircle2, ChefHat, Truck, AlertCircle, 
  RefreshCw, Building2
} from 'lucide-react';

// Types
interface Property {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  notes?: string;
  menu_items: {
    name: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  guest_room_number: string;
  guest_name: string;
  total_amount: number;
  notes?: string;
  order_items: OrderItem[];
}

const STATUS_CONFIG = {
  pending: { label: 'New Orders', icon: AlertCircle, color: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500' },
  ready: { label: 'Ready to Serve', icon: CheckCircle2, color: 'bg-green-50 text-green-700 border-green-100', dot: 'bg-green-500' },
  delivered: { label: 'Delivered', icon: Truck, color: 'bg-slate-50 text-slate-700 border-slate-100', dot: 'bg-slate-500' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, color: 'bg-slate-50 text-slate-400 border-slate-100', dot: 'bg-slate-400' },
};

export default function OrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  const fetchProperties = async () => {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, name')
        .order('name');

      if (error) throw error;

      if (properties && properties.length > 0) {
        setProperties(properties);
        const saved = localStorage.getItem('zamora_selected_property');
        if (saved && properties.find(p => p.id === saved)) {
          setSelectedPropertyId(saved);
        } else {
          setSelectedPropertyId(properties[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedPropertyId(newId);
    localStorage.setItem('zamora_selected_property', newId);
  };

  const fetchOrders = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            notes,
            menu_items (
              name
            )
          )
        `)
        .eq('property_id', selectedPropertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setOrders((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchOrders();

      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'orders',
            filter: `property_id=eq.${selectedPropertyId}`
          },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedPropertyId]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Optimistic update
      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { ...o, status: newStatus as Order['status'] } 
          : o
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getElapsedTime = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  // Group orders by status
  const groupedOrders = {
    pending: orders.filter(o => o.status === 'pending'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
    completed: orders.filter(o => ['delivered', 'cancelled'].includes(o.status)),
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Kitchen Display System</h1>
          <p className="text-slate-500 text-sm">Manage incoming orders and kitchen workflow</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Property Selector */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={selectedPropertyId}
              onChange={handlePropertyChange}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={fetchOrders}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6 bg-slate-50">
        <div className="flex gap-6 h-full min-w-[1200px]">
          
          {/* 1. New Orders */}
          <Column 
            title="New Orders" 
            orders={groupedOrders.pending} 
            config={STATUS_CONFIG.pending}
            onStatusUpdate={updateStatus}
            nextStatus="preparing"
            elapsedTime={getElapsedTime}
          />

          {/* 2. Preparing */}
          <Column 
            title="Preparing" 
            orders={groupedOrders.preparing} 
            config={STATUS_CONFIG.preparing}
            onStatusUpdate={updateStatus}
            nextStatus="ready"
            elapsedTime={getElapsedTime}
          />

          {/* 3. Ready */}
          <Column 
            title="Ready to Serve" 
            orders={groupedOrders.ready} 
            config={STATUS_CONFIG.ready}
            onStatusUpdate={updateStatus}
            nextStatus="delivered"
            elapsedTime={getElapsedTime}
          />

          {/* 4. Completed/Delivered */}
          <div className="w-80 flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG.delivered.dot}`} />
                <h3 className="font-bold text-slate-700">Completed</h3>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {groupedOrders.completed.length}
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {groupedOrders.completed.map(order => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-4 opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-900">Room {order.guest_room_number}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                      order.status === 'delivered' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mb-2">{order.guest_name}</div>
                  <div className="text-xs text-slate-400">
                    {order.order_items.length} items • K{order.total_amount}
                  </div>
                </div>
              ))}
              {groupedOrders.completed.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">No completed orders yet</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

interface ColumnProps {
  title: string;
  orders: Order[];
  config: any;
  onStatusUpdate: (id: string, status: string) => void;
  nextStatus: string;
  elapsedTime: (date: string) => string;
}

function Column({ title, orders, config, onStatusUpdate, nextStatus, elapsedTime }: ColumnProps) {
  return (
    <div className="w-80 flex flex-col shrink-0">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.dot}`} />
          <h3 className="font-bold text-slate-700">{title}</h3>
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
            {orders.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Card Header */}
            <div className={`px-4 py-3 border-b border-slate-50 flex justify-between items-center ${config.color.split(' ')[0]}`}>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg">Room {order.guest_room_number || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium opacity-80">
                <Clock size={12} />
                {elapsedTime(order.created_at)}
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4">
              <div className="mb-3">
                <div className="text-sm font-bold text-slate-900">{order.guest_name || 'Guest'}</div>
                {order.notes && (
                  <div className="mt-1 text-xs bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-100">
                    Note: {order.notes}
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {order.order_items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-sm">
                    <div className="flex gap-2">
                      <span className="font-bold text-slate-700">{item.quantity}x</span>
                      <span className="text-slate-600">{item.menu_items?.name || 'Unknown Item'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button 
                onClick={() => onStatusUpdate(order.id, nextStatus)}
                className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                  config.label === 'New Orders' ? 'bg-black text-white hover:bg-slate-800' :
                  config.label === 'Preparing' ? 'bg-orange-500 text-white hover:bg-orange-600' :
                  'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {config.label === 'New Orders' && 'Start Preparing'}
                {config.label === 'Preparing' && 'Mark Ready'}
                {config.label === 'Ready to Serve' && 'Mark Delivered'}
              </button>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400">
            <config.icon size={32} className="mb-2 opacity-50" />
            <span className="text-sm font-medium">No orders</span>
          </div>
        )}
      </div>
    </div>
  );
}

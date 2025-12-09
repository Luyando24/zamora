'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Clock, CheckCircle2, ChefHat, Truck, AlertCircle, 
  RefreshCw, Building2, Utensils, XCircle, Volume2, VolumeX, Eye, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Property {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  notes?: string;
  unit_price: number;
  total_price: number;
  menu_items: {
    name: string;
    description?: string;
    ingredients?: string;
    image_url?: string;
    category?: string;
    weight?: string;
    dietary_info?: string;
  } | null;
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
  guest_phone?: string;
  payment_method?: string;
}

const STATUS_CONFIG = {
  pending: { 
    label: 'New Orders', 
    icon: AlertCircle, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    accent: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
  },
  preparing: { 
    label: 'Preparing', 
    icon: ChefHat, 
    color: 'text-amber-600', 
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    accent: 'border-l-amber-500',
    badge: 'bg-amber-100 text-amber-800',
    button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
  },
  ready: { 
    label: 'Ready for Pickup', 
    icon: CheckCircle2, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'border-l-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
  },
  delivered: { 
    label: 'Completed', 
    icon: Truck, 
    color: 'text-slate-600', 
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    accent: 'border-l-slate-400',
    badge: 'bg-slate-200 text-slate-600',
    button: 'bg-slate-800 hover:bg-slate-900 text-white'
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: XCircle, 
    color: 'text-slate-500', 
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    accent: 'border-l-slate-300',
    badge: 'bg-slate-200 text-slate-500',
    button: ''
  },
};

export default function OrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Sound Player using Web Audio API
  const playNotificationSound = () => {
    if (!soundEnabled) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      
      // Create oscillator for the "ding"
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Nice "ding" sound: High pitch dropping slightly
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.6); 
      
      // Envelope: Fast attack, slow decay
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);

      // Add a second harmonic for richness
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, ctx.currentTime); // A6
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.4);

    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

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
            unit_price,
            total_price,
            menu_items (
              name,
              description,
              ingredients,
              image_url,
              category,
              weight,
              dietary_info
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
          (payload) => {
            // Play sound on new order
            if (payload.eventType === 'INSERT') {
                playNotificationSound();
            }
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedPropertyId, soundEnabled]); // Re-subscribe if soundEnabled changes to ensure closure captures latest value

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
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  // Group orders by status
  const groupedOrders = {
    pending: orders.filter(o => o.status === 'pending'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
    completed: orders.filter(o => ['delivered', 'cancelled'].includes(o.status)),
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans antialiased">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-lg text-white shadow-lg shadow-slate-900/10">
            <Utensils size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Kitchen Workflow</h1>
            <p className="text-slate-500 text-xs font-medium">Real-time order management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          
          <button
            onClick={() => {
                const newState = !soundEnabled;
                setSoundEnabled(newState);
                if (newState) playNotificationSound();
            }}
            className={`px-3 py-2 rounded-lg transition-all active:scale-95 flex items-center gap-2 font-semibold text-xs ${
                soundEnabled 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200/70' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title={soundEnabled ? 'Mute Notifications' : 'Enable Notifications'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>

          {/* Property Selector */}
          <div className="relative group">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={selectedPropertyId}
              onChange={handlePropertyChange}
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 transition-all appearance-none"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <button 
            onClick={fetchOrders}
            className="p-2.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-all active:scale-95"
            title="Refresh Orders"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full min-w-[1400px]">
          
          <Column 
            title="New Orders" 
            orders={groupedOrders.pending} 
            config={STATUS_CONFIG.pending}
            onStatusUpdate={updateStatus}
            onViewDetails={setSelectedOrder}
            nextStatus="preparing"
            elapsedTime={getElapsedTime}
          />

          <Column 
            title="Preparing" 
            orders={groupedOrders.preparing} 
            config={STATUS_CONFIG.preparing}
            onStatusUpdate={updateStatus}
            onViewDetails={setSelectedOrder}
            nextStatus="ready"
            elapsedTime={getElapsedTime}
          />

          <Column 
            title="Ready for Pickup" 
            orders={groupedOrders.ready} 
            config={STATUS_CONFIG.ready}
            onStatusUpdate={updateStatus}
            onViewDetails={setSelectedOrder}
            nextStatus="delivered"
            elapsedTime={getElapsedTime}
          />

          <Column 
            title="Completed" 
            orders={groupedOrders.completed} 
            config={STATUS_CONFIG.delivered}
            onStatusUpdate={updateStatus}
            onViewDetails={setSelectedOrder}
            nextStatus="" // No next status
            elapsedTime={getElapsedTime}
            isCompletedColumn
          />

        </div>
      </main>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-slate-200/50"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Order Details</h2>
                  <p className="text-slate-500 text-sm font-medium">Room {selectedOrder.guest_room_number} • {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50">
                 {/* Guest Info */}
                 <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm font-medium">Guest Name</span>
                        <span className="text-slate-900 font-semibold">{selectedOrder.guest_name}</span>
                    </div>
                    {selectedOrder.guest_phone && (
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-sm font-medium">Phone</span>
                            <span className="text-slate-900 font-semibold">{selectedOrder.guest_phone}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm font-medium">Payment</span>
                        <span className="text-slate-900 font-semibold capitalize">{selectedOrder.payment_method?.replace('_', ' ') || 'Room Charge'}</span>
                    </div>
                 </div>

                 {/* Order Items */}
                 <div className="bg-white p-4 rounded-xl border border-slate-200/80">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Items</h3>
                    <div className="space-y-3">
                        {selectedOrder.order_items.map((item, i) => {
                            // Robust check for menu_items and its essential properties
                            if (!item.menu_items || !item.menu_items.name) {
                                return (
                                    <div key={i} className="flex items-center gap-3 text-sm text-slate-400 p-2 bg-slate-50 rounded-md">
                                        <span className="bg-slate-200 font-bold w-7 h-7 rounded-md flex items-center justify-center text-xs border border-slate-300">{item.quantity}x</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-500">Menu item data is unavailable.</p>
                                            {item.notes && (
                                                <div className="mt-1 text-amber-600 text-xs">
                                                    Note: {item.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={i} className="flex justify-between items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                    <div className="flex gap-3 w-full">
                                        {/* Quantity Badge */}
                                        <span className="bg-slate-100 text-slate-700 font-bold w-7 h-7 rounded-md flex items-center justify-center text-xs shrink-0 border border-slate-200 mt-1">
                                            {item.quantity}x
                                        </span>

                                        {/* Image (if available) */}
                                        {item.menu_items?.image_url && (
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                            <img src={item.menu_items.image_url} alt={item.menu_items.name} className="w-full h-full object-cover" />
                                        </div>
                                        )}

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-slate-800 text-sm">{item.menu_items?.name}</p>
                                                <p className="font-bold text-slate-900 text-sm">K{item.total_price?.toFixed(2) || '0.00'}</p>
                                            </div>
                                            
                                            {/* Description/Ingredients */}
                                            {(item.menu_items?.description || item.menu_items?.ingredients) && (
                                                <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                                                    {item.menu_items.description || item.menu_items.ingredients}
                                                </p>
                                            )}

                                            {item.notes && (
                                                <div className="mt-1.5 text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block">
                                                    Note: {item.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 </div>

                 {/* Kitchen Notes (Order Level) */}
                 {selectedOrder.notes && (
                    <div className="bg-white border border-slate-200/80 p-4 rounded-xl">
                        <h3 className="text-amber-600 font-bold text-sm mb-2 flex items-center gap-2">
                            <AlertCircle size={16} /> Special Instructions
                        </h3>
                        <p className="text-slate-600 font-medium text-sm leading-relaxed">{selectedOrder.notes}</p>
                    </div>
                 )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-white flex justify-between items-center">
                 <div>
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Total</p>
                    <p className="text-2xl font-black text-slate-900">K{selectedOrder.total_amount.toFixed(2)}</p>
                 </div>
                 <div className="flex gap-3">
                     <button 
                       onClick={() => setSelectedOrder(null)}
                       className="px-5 py-2.5 bg-slate-800 border border-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors text-sm active:scale-95 shadow-lg shadow-slate-800/10"
                     >
                        Done
                     </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ColumnProps {
  title: string;
  orders: Order[];
  config: any;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onViewDetails: (order: Order) => void;
  nextStatus: string;
  elapsedTime: (date: string) => string;
  isCompletedColumn?: boolean;
}

function Column({ title, orders, config, onStatusUpdate, onViewDetails, nextStatus, elapsedTime, isCompletedColumn }: ColumnProps) {
  return (
    <div className="flex flex-col w-1/4 h-full">
      <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${config.bg} border-x border-t ${config.border}`}>
        <div className="flex items-center gap-3">
          <config.icon className={`${config.color}`} size={20} />
          <h2 className={`text-sm font-bold ${config.color}`}>{title}</h2>
        </div>
        <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full ${config.badge}`}>
          {orders.length}
        </span>
      </div>
      <div className={`flex-1 overflow-y-auto bg-white border-x border-b rounded-b-xl ${config.border} shadow-sm`}>
        <div className="p-4 space-y-4">
          {orders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              config={config}
              onStatusUpdate={onStatusUpdate}
              onViewDetails={onViewDetails}
              nextStatus={nextStatus}
              elapsedTime={elapsedTime}
              isCompleted={isCompletedColumn}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  config: any;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onViewDetails: (order: Order) => void;
  nextStatus: string;
  elapsedTime: (date: string) => string;
  isCompleted?: boolean;
}

function OrderCard({ order, config, onStatusUpdate, onViewDetails, nextStatus, elapsedTime, isCompleted }: OrderCardProps) {
  const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`bg-white rounded-xl border ${config.border} shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-bold text-slate-800">Room {order.guest_room_number}</p>
            <p className="text-xs text-slate-500 font-medium">{order.guest_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.badge}`}>
              {elapsedTime(order.created_at)} ago
            </span>
            <button onClick={() => onViewDetails(order)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
              <Eye size={16} />
            </button>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200 my-3"></div>

        <div className="space-y-2 mb-4">
          {order.order_items.map(item => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">{item.quantity}x</span>
                <p className="text-slate-700 font-medium">{item.menu_items?.name || 'Unknown Item'}</p>
              </div>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="mb-4 p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg">
            <p className="text-xs text-amber-700 font-medium leading-snug">{order.notes}</p>
          </div>
        )}

        {!isCompleted && nextStatus && (
          <button 
            onClick={() => onStatusUpdate(order.id, nextStatus)}
            className={`w-full text-center py-2.5 rounded-lg font-bold text-sm transition-all duration-200 shadow-lg ${config.button} hover:shadow-xl active:scale-95`}
          >
            {`Move to ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`}
          </button>
        )}
      </div>
    </motion.div>
  );
}

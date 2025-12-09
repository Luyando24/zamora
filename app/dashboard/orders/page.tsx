'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Clock, CheckCircle2, ChefHat, Truck, AlertCircle, 
  RefreshCw, Building2, Utensils, XCircle, Volume2, VolumeX
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
  pending: { 
    label: 'New Orders', 
    icon: AlertCircle, 
    color: 'text-rose-600', 
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    accent: 'border-l-rose-500',
    badge: 'bg-rose-100 text-rose-700',
    button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
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
    label: 'Ready to Serve', 
    icon: CheckCircle2, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'border-l-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
  },
  delivered: { 
    label: 'Delivered', 
    icon: Truck, 
    color: 'text-slate-600', 
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    accent: 'border-l-slate-400',
    badge: 'bg-slate-100 text-slate-600',
    button: 'bg-slate-800 hover:bg-slate-900 text-white'
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: XCircle, 
    color: 'text-slate-400', 
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    accent: 'border-l-slate-300',
    badge: 'bg-slate-100 text-slate-500',
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
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-900 rounded-xl text-white">
            <Utensils size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kitchen Display</h1>
            <p className="text-slate-500 text-sm font-medium">Live orders & workflow</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          
          <button
            onClick={() => {
                const newState = !soundEnabled;
                setSoundEnabled(newState);
                if (newState) playNotificationSound(); // Test sound when enabling
            }}
            className={`p-2.5 rounded-lg transition-all active:scale-95 flex items-center gap-2 font-bold text-sm ${
                soundEnabled 
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title={soundEnabled ? 'Mute Notifications' : 'Enable Notifications'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>

          {/* Property Selector */}
          <div className="relative group">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors" size={16} />
            <select
              value={selectedPropertyId}
              onChange={handlePropertyChange}
              className="pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all cursor-pointer min-w-[200px] appearance-none"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
            </div>
          </div>

          <button 
            onClick={fetchOrders}
            className="p-2.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-all active:scale-95"
            title="Refresh Orders"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-8">
        <div className="flex gap-8 h-full min-w-[1400px]">
          
          <Column 
            title="New Orders" 
            orders={groupedOrders.pending} 
            config={STATUS_CONFIG.pending}
            onStatusUpdate={updateStatus}
            nextStatus="preparing"
            elapsedTime={getElapsedTime}
          />

          <Column 
            title="Preparing" 
            orders={groupedOrders.preparing} 
            config={STATUS_CONFIG.preparing}
            onStatusUpdate={updateStatus}
            nextStatus="ready"
            elapsedTime={getElapsedTime}
          />

          <Column 
            title="Ready to Serve" 
            orders={groupedOrders.ready} 
            config={STATUS_CONFIG.ready}
            onStatusUpdate={updateStatus}
            nextStatus="delivered"
            elapsedTime={getElapsedTime}
          />

          <Column 
            title="Completed" 
            orders={groupedOrders.completed} 
            config={STATUS_CONFIG.delivered}
            onStatusUpdate={updateStatus}
            nextStatus="" // No next status
            elapsedTime={getElapsedTime}
            isCompletedColumn
          />

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
  isCompletedColumn?: boolean;
}

function Column({ title, orders, config, onStatusUpdate, nextStatus, elapsedTime, isCompletedColumn }: ColumnProps) {
  const Icon = config.icon;

  return (
    <div className="flex-1 min-w-[320px] flex flex-col h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
            <Icon size={18} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">{title}</h3>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-200">
            {orders.length}
          </span>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`
                bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group
                ${isCompletedColumn ? 'opacity-75 hover:opacity-100 border-slate-200' : 'border-slate-200 hover:border-slate-300'}
              `}>
                <div className="flex">
                  {/* Status Strip */}
                  <div className={`w-1.5 ${config.accent.replace('border-l-', 'bg-')}`}></div>
                  
                  <div className="flex-1 p-5">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xl text-slate-900">Room {order.guest_room_number || 'N/A'}</span>
                          {isCompletedColumn && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              order.status === 'delivered' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {order.status}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-slate-500">{order.guest_name || 'Guest'}</div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <Clock size={12} />
                        {elapsedTime(order.created_at)}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3 mb-5">
                      {order.order_items.map((item, i) => (
                        <div key={i} className="flex justify-between items-start text-sm group/item">
                          <div className="flex gap-3">
                            <span className="font-bold text-slate-900 min-w-[20px] text-center bg-slate-100 rounded px-1 h-fit">
                              {item.quantity}
                            </span>
                            <span className="text-slate-600 font-medium leading-snug">{item.menu_items?.name || 'Unknown Item'}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="mb-5 text-xs bg-amber-50 text-amber-700 p-3 rounded-lg border border-amber-100 flex gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span className="font-medium">{order.notes}</span>
                      </div>
                    )}

                    {/* Action Button */}
                    {!isCompletedColumn && (
                      <button 
                        onClick={() => onStatusUpdate(order.id, nextStatus)}
                        className={`
                          w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm
                          ${config.button}
                        `}
                      >
                        {config.label === 'New Orders' && (
                          <>
                            <ChefHat size={16} />
                            Start Preparing
                          </>
                        )}
                        {config.label === 'Preparing' && (
                          <>
                            <CheckCircle2 size={16} />
                            Mark Ready
                          </>
                        )}
                        {config.label === 'Ready to Serve' && (
                          <>
                            <Truck size={16} />
                            Mark Delivered
                          </>
                        )}
                      </button>
                    )}
                    
                    {isCompletedColumn && (
                       <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                         <span>{order.order_items.length} items</span>
                         <span className="font-medium text-slate-600">Total: K{order.total_amount}</span>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {orders.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <div className={`p-4 rounded-full bg-slate-100 mb-3 opacity-50`}>
              <Icon size={24} />
            </div>
            <span className="text-sm font-semibold opacity-70">No {config.label.toLowerCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

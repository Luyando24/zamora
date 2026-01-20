'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '../context/PropertyContext';
import { 
  Clock, CheckCircle2, ChefHat, Truck, AlertCircle, 
  RefreshCw, Building2, Wine, XCircle, Eye, X, Sun, Armchair, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Property {
  id: string;
  name: string;
}

interface BarOrderItem {
  id: string;
  quantity: number;
  notes?: string;
  unit_price: number;
  total_price: number;
  // Snapshot fields
   item_name?: string;
   item_description?: string;
   item_ingredients?: string;
   item_image_url?: string;
   weight?: string;
   extras?: any;
   options?: any;
  
  bar_menu_items: {
    name: string;
    description?: string;
    ingredients?: string;
    image_url?: string;
    category?: string;
    weight?: string;
    dietary_info?: string;
  } | null;
}

interface BarOrder {
  id: string;
  created_at: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  guest_room_number: string;
  guest_name: string;
  total_amount: number;
  notes?: string;
  bar_order_items: BarOrderItem[];
  guest_phone?: string;
  payment_method?: string;
}

const STATUS_CONFIG = {
  pending: { 
    label: 'New Orders', 
    icon: AlertCircle, 
    color: 'text-purple-600', 
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    accent: 'border-l-purple-500',
    badge: 'bg-purple-100 text-purple-700',
    button: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'
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

export default function BarOrdersPage() {
  const supabase = createClient();
  const { selectedPropertyId } = useProperty();
  const [orders, setOrders] = useState<BarOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<BarOrder | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

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
    if (!selectedPropertyId || !userRole) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('bar_orders')
        .select(`
          *,
          payment_status,
          bar_order_items (
            id,
            quantity,
            notes,
            unit_price,
            total_price,
            item_name,
            item_description,
            item_ingredients,
            item_image_url,
            weight,
            extras,
            options,
            bar_menu_items (
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

      if (userRole === 'cashier') {
        query = query.eq('status', 'delivered');
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setOrders((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId, supabase, userRole]);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchOrders();

      const channel = supabase
        .channel(`bar-orders-list-${selectedPropertyId}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'bar_orders',
            filter: `property_id=eq.${selectedPropertyId}`
          },
          (payload) => {
            console.log('Realtime update received:', payload);
            fetchOrders();
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedPropertyId, fetchOrders, supabase]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bar_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Send SMS Notification
      const order = orders.find(o => o.id === orderId);
      if (order && order.guest_phone) {
          const statusMessages: Record<string, string> = {
            preparing: `Your drink is being prepared! 🍹`,
            ready: `Your drink is ready! 🥂`,
            delivered: `Your drink has been delivered. Cheers! 🍻`,
            cancelled: `Your order has been cancelled. Please contact staff.`
          };
          const msg = statusMessages[newStatus];
          if (msg) {
             fetch('/api/notifications/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Zamora: ${msg}`,
                    phone: order.guest_phone
                })
             }).catch(err => console.error('Failed to send SMS:', err));
          }
      }

      // Optimistic update
      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { ...o, status: newStatus as BarOrder['status'] } 
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

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('bar_orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.filter(o => o.id !== orderId));
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
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
          <div className="p-3 bg-purple-900 rounded-lg text-white shadow-lg shadow-purple-900/10">
            <Wine size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Bar Workflow</h1>
            <p className="text-slate-500 text-xs font-medium">Real-time bar order management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          {userRole !== 'cashier' && (
            <>
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
            </>
          )}

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
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    {selectedOrder.guest_room_number.toString().startsWith('Table Outdoor') ? (
                        <>
                        <Sun size={14} />
                        <span>Table: {selectedOrder.guest_room_number.replace('Table Outdoor', '').trim()} (Outdoor)</span>
                        </>
                    ) : selectedOrder.guest_room_number.toString().startsWith('Table') ? (
                        <>
                        <Armchair size={14} />
                        <span>Table: {selectedOrder.guest_room_number.replace('Table', '').trim()} (Indoor)</span>
                        </>
                    ) : (
                        <span>Room {selectedOrder.guest_room_number}</span>
                    )}
                    <span>• {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
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
                        {Array.isArray(selectedOrder.bar_order_items) && selectedOrder.bar_order_items.map((item, i) => {
                            const itemName = item.item_name || item.bar_menu_items?.name;
                             const itemImage = item.item_image_url || item.bar_menu_items?.image_url;
                             const description = item.item_description || item.bar_menu_items?.description;
                             const ingredients = item.item_ingredients || item.bar_menu_items?.ingredients;
 
                             if (!itemName) {
                                return (
                                    <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-slate-200 text-slate-600 font-bold w-7 h-7 rounded-md flex items-center justify-center text-xs shrink-0 border border-slate-300">
                                                {item.quantity}x
                                            </span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-600">Menu item data is unavailable</p>
                                                {item.notes && (
                                                    <div className="mt-1.5 text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block">
                                                        Note: {item.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={i} className="flex justify-between items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                    <div className="flex gap-3 w-full">
                                        <span className="bg-slate-100 text-slate-700 font-bold w-7 h-7 rounded-md flex items-center justify-center text-xs shrink-0 border border-slate-200 mt-1">
                                            {item.quantity}x
                                        </span>

                                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 relative">
                                            {itemImage ? (
                                                <Image 
                                                    src={itemImage} 
                                                    alt={itemName} 
                                                    fill
                                                    className="object-cover" 
                                                    unoptimized
                                                />
                                            ) : (
                                                <Wine className="text-slate-300 w-6 h-6 opacity-50" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-slate-800 text-sm">{itemName}</p>
                                                <p className="font-bold text-slate-900 text-sm">K{item.total_price?.toFixed(2) || '0.00'}</p>
                                            </div>
                                            
                                            {description && (
                                                <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                                                    {description}
                                                </p>
                                            )}
                                            
                                            {ingredients && (
                                                <p className="text-slate-500 text-xs mt-0.5 line-clamp-2 italic">
                                                    <span className="font-medium not-italic text-slate-400 mr-1">Ingredients:</span>
                                                    {ingredients}
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
                       onClick={() => deleteOrder(selectedOrder.id)}
                       className="px-4 py-2.5 bg-red-50 border border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors text-sm active:scale-95 flex items-center gap-2"
                     >
                        <Trash2 size={16} />
                        Delete
                     </button>
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
  orders: BarOrder[];
  config: any;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onViewDetails: (order: BarOrder) => void;
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
  order: BarOrder;
  config: any;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onViewDetails: (order: BarOrder) => void;
  nextStatus: string;
  elapsedTime: (date: string) => string;
  isCompleted?: boolean;
}

function OrderCard({ order, config, onStatusUpdate, onViewDetails, nextStatus, elapsedTime, isCompleted }: OrderCardProps) {
  const totalItems = order.bar_order_items.reduce((sum, item) => sum + item.quantity, 0);

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
            <div className="font-bold text-slate-800 flex items-center gap-2">
              {order.guest_room_number.toString().startsWith('Table Outdoor') ? (
                  <>
                    <Sun size={16} className="text-amber-500" />
                    <span>Table: {order.guest_room_number.replace('Table Outdoor', '').trim()} (Outdoor)</span>
                  </>
              ) : order.guest_room_number.toString().startsWith('Table') ? (
                  <>
                    <Armchair size={16} className="text-indigo-500" />
                    <span>Table: {order.guest_room_number.replace('Table', '').trim()} (Indoor)</span>
                  </>
              ) : (
                  <span>Room {order.guest_room_number}</span>
              )}
            </div>
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
          {order.bar_order_items.map(item => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">{item.quantity}x</span>
                <p className="text-slate-700 font-medium">{item.item_name || item.bar_menu_items?.name || 'Unknown Item'}</p>
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

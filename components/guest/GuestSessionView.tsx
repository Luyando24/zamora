'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import {
  X, Clock, CheckCircle2, ChefHat, Truck, AlertCircle,
  ShoppingBag, Plus, Receipt, Wine, Utensils, ArrowRight, Loader2, Bell
} from 'lucide-react';

interface GuestSessionViewProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  onAddItems: () => void;
  restaurantName?: string;
}

const STATUS_CONFIG: Record<string, any> = {
  pending: { label: 'Order Placed', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  preparing: { label: 'Kitchen Preparing', icon: ChefHat, color: 'text-amber-600', bg: 'bg-amber-50' },
  ready: { label: 'Ready to Serve', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  delivered: { label: 'Delivered', icon: Truck, color: 'text-slate-600', bg: 'bg-slate-50' },
  cancelled: { label: 'Cancelled', icon: X, color: 'text-slate-400', bg: 'bg-slate-50' },
};

export default function GuestSessionView({ isOpen, onClose, propertyId, onAddItems, restaurantName }: GuestSessionViewProps) {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<string>('');
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [callWaiterSuccess, setCallWaiterSuccess] = useState(false);
  
  // Track previous order statuses to trigger notifications
  const prevOrderStatusesRef = useRef<Record<string, string>>({});
  const [isCallWaiterModalOpen, setIsCallWaiterModalOpen] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png', // Assuming a standard icon exists or fallback
        badge: '/icons/icon-72x72.png',
        tag: 'order-update' // Groups notifications
      });
    }
  };

  const fetchOrders = useCallback(async () => {
    // Only set loading on initial load or if explicitly needed, to avoid flash
    // We can rely on 'orders' state to show content.
    // setLoading(true); // Removed to prevent flashing on every update
    
    const savedOrderIds = JSON.parse(localStorage.getItem('zamora_guest_order_ids') || '[]');

    if (savedOrderIds.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const { data: foodData } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .in('id', savedOrderIds)
        .eq('property_id', propertyId);

      const { data: barData } = await supabase
        .from('bar_orders')
        .select('*, items:bar_order_items(*)')
        .in('id', savedOrderIds)
        .eq('property_id', propertyId);

      const allOrders = [
        ...(foodData || []).map(o => ({ ...o, type: 'food' })),
        ...(barData || []).map(o => ({ ...o, type: 'bar' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(allOrders);

      // Check for status changes and trigger notifications
      const prevOrderStatuses = prevOrderStatusesRef.current;
      const newStatuses: Record<string, string> = {};
      
      allOrders.forEach(order => {
        newStatuses[order.id] = order.status;
        
        const oldStatus = prevOrderStatuses[order.id];
        // Only notify if status changed AND it's not the initial load (unless we want initial notifications, but usually better on change)
        if (oldStatus && oldStatus !== order.status) {
             let title = 'Order Update';
             let body = `Your order status has changed to ${order.status}.`;
             const rName = restaurantName || 'The Restaurant';
             const wName = order.waiter_name ? ` by ${order.waiter_name}` : '';

             switch (order.status) {
                 case 'preparing':
                     title = '👨‍🍳 Kitchen is Cooking!';
                     body = `Your order is being prepared at ${rName}.`;
                     break;
                 case 'ready':
                     title = '🛎️ Order Ready!';
                     body = `Your order is ready to serve${wName}.`;
                     break;
                 case 'delivered':
                     title = '🍽️ Bon Appétit!';
                     body = `Your order has been delivered${wName}. Enjoy your meal at ${rName}!`;
                     break;
                 case 'cancelled':
                     title = '⚠️ Order Update';
                     body = `Your order was cancelled. Please ask a staff member for details.`;
                     break;
             }
             sendNotification(title, body);
        }
      });
      prevOrderStatusesRef.current = newStatuses;

      // Infer table info from latest order
      if (allOrders.length > 0) {
        const latest = allOrders[0];
        setTableInfo(latest.table_number ? `Table ${latest.table_number}` : latest.guest_room_number || 'My Session');
      }

    } catch (err) {
      console.error('Error fetching session:', err);
    } finally {
      setLoading(false);
    }
  }, [propertyId, supabase, restaurantName]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true); // Set loading true ONLY when opening the modal
      fetchOrders();
      // Realtime subscription
      const channel = supabase.channel('guest_session_tracking')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, fetchOrders)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bar_orders' }, fetchOrders)
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
  }, [isOpen, fetchOrders, supabase]);

  const handleCallWaiter = async () => {
    setIsCallingWaiter(true);
    try {
      const savedOrderIds = JSON.parse(localStorage.getItem('zamora_guest_order_ids') || '[]');
      
      // Determine table info from orders if not explicitly known (fallback)
      let tableNum = null;
      let roomNum = null;
      
      if (orders.length > 0) {
          const latest = orders[0];
          tableNum = latest.table_number;
          roomNum = latest.guest_room_number;
      }

      if (!tableNum && !roomNum) {
          alert("Cannot identify table. Please place an order first.");
          return;
      }

      const response = await fetch('/api/mobile/service-requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          tableNumber: tableNum,
          roomNumber: roomNum,
          type: 'call_waiter',
          notes: 'Guest requested waiter via app'
        })
      });

      if (!response.ok) throw new Error('Failed to call waiter');

      setIsCallWaiterModalOpen(true);
      // setCallWaiterSuccess(true); // Replaced by modal
      // setTimeout(() => setCallWaiterSuccess(false), 3000); // Reset success state after 3s

    } catch (error) {
      console.error('Call Waiter Error:', error);
      alert('Failed to call waiter. Please try again.');
    } finally {
      setIsCallingWaiter(false);
    }
  };

  if (!isOpen) return null;

  const grandTotal = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total_amount : 0), 0);

  return (
    <>
      {/* Call Waiter Confirmation Modal */}
      {isCallWaiterModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-center mb-4">
               <div className="bg-green-100 p-4 rounded-full">
                 <CheckCircle2 size={48} className="text-green-600" />
               </div>
             </div>
             <h3 className="text-xl font-black text-center text-slate-900 mb-2">Waiter Called!</h3>
             <p className="text-slate-500 text-center text-sm mb-6">
               A notification has been sent to the staff. They will attend to your table shortly.
             </p>
             <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6">
                <p className="text-xs text-amber-700 text-center font-medium flex items-center justify-center gap-2">
                   <AlertCircle size={14} />
                   Note: If no one arrives within 5 minutes, please wave to a staff member.
                </p>
             </div>
             <button 
               onClick={() => setIsCallWaiterModalOpen(false)}
               className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
             >
               Okay, Got it
             </button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-black text-2xl text-slate-900">{tableInfo || 'Current Session'}</h2>
            <p className="text-sm text-slate-500 font-medium">Active Orders & Bill</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && orders.length === 0 ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : orders.length === 0 ? (
             <div className="text-center py-10 text-slate-500">No active orders found.</div>
          ) : (
            orders.map(order => {
               const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
               const StatusIcon = status.icon;
               
               return (
                 <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-50">
                       <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${status.bg} ${status.color}`}>
                             <StatusIcon size={16} />
                          </div>
                          <div>
                             <p className={`text-xs font-bold uppercase ${status.color}`}>{status.label}</p>
                             <p className="text-[10px] text-slate-400">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                       </div>
                       <span className="font-black text-slate-900">K{order.total_amount}</span>
                    </div>
                    
                    <div className="space-y-2">
                       {order.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-start text-sm">
                             <span className="text-slate-700 font-medium">
                                {item.quantity}x {item.item_name || item.name || 'Item'}
                             </span>
                             <span className="text-slate-400">K{item.total_price}</span>
                          </div>
                       ))}
                    </div>
                 </div>
               );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white p-6 border-t border-slate-100 shrink-0 space-y-4">
           <div className="flex justify-between items-end">
              <span className="text-slate-500 font-medium">Total Bill</span>
              <span className="text-3xl font-black text-slate-900">K{grandTotal.toFixed(2)}</span>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleCallWaiter}
                disabled={isCallingWaiter}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all shadow-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`}
              >
                {isCallingWaiter ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <>
                        <Bell size={18} />
                        <span>Call Waiter</span>
                    </>
                )}
              </button>

              <button 
                onClick={onAddItems}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-50 transition-colors"
              >
                <Plus size={18} /> Add Items
              </button>
           </div>
           
           <button 
             className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
           >
             <Receipt size={18} /> Request Bill
           </button>
        </div>
      </div>
    </div>
    </>
  );
}
  );
}

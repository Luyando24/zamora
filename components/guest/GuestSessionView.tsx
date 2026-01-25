'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import {
  X, Clock, CheckCircle2, ChefHat, Truck, AlertCircle,
  ShoppingBag, Plus, Receipt, Wine, Utensils, ArrowRight, Loader2
} from 'lucide-react';

interface GuestSessionViewProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  onAddItems: () => void;
}

const STATUS_CONFIG: Record<string, any> = {
  pending: { label: 'Order Placed', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  preparing: { label: 'Kitchen Preparing', icon: ChefHat, color: 'text-amber-600', bg: 'bg-amber-50' },
  ready: { label: 'Ready to Serve', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  delivered: { label: 'Delivered', icon: Truck, color: 'text-slate-600', bg: 'bg-slate-50' },
  cancelled: { label: 'Cancelled', icon: X, color: 'text-slate-400', bg: 'bg-slate-50' },
};

export default function GuestSessionView({ isOpen, onClose, propertyId, onAddItems, restaurantName }: GuestSessionViewProps & { restaurantName?: string }) {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<string>('');
  
  // Track previous order statuses to trigger notifications
  const [prevOrderStatuses, setPrevOrderStatuses] = useState<Record<string, string>>({});

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
    setLoading(true);
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
      const newStatuses: Record<string, string> = {};
      allOrders.forEach(order => {
        newStatuses[order.id] = order.status;
        
        const oldStatus = prevOrderStatuses[order.id];
        // Only notify if status changed AND it's not the initial load (unless we want initial notifications, but usually better on change)
        // Actually, for initial load we might skip, but let's check if we have prevStatuses populated.
        // Simple check: if oldStatus exists and is different.
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
      setPrevOrderStatuses(newStatuses);

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
  }, [propertyId, supabase]);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      // Realtime subscription
      const channel = supabase.channel('guest_session_tracking')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, fetchOrders)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bar_orders' }, fetchOrders)
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
  }, [isOpen, fetchOrders, supabase]);

  if (!isOpen) return null;

  const grandTotal = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total_amount : 0), 0);

  return (
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
          {loading ? (
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
                onClick={onAddItems}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-50 transition-colors"
              >
                <Plus size={18} /> Add Items
              </button>
              
              <button 
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
              >
                <Receipt size={18} /> Request Bill
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

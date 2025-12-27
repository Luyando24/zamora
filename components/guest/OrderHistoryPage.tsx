'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { 
  X, Clock, CheckCircle2, ChefHat, Truck, AlertCircle, 
  ShoppingBag, ChevronRight, RefreshCw, Calendar, Wine, Utensils
} from 'lucide-react';

interface OrderHistoryPageProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
}

const STATUS_CONFIG: Record<string, any> = {
  pending: { 
    label: 'Order Placed', 
    icon: AlertCircle, 
    color: 'text-rose-600', 
    bg: 'bg-rose-50',
    border: 'border-rose-200'
  },
  preparing: { 
    label: 'Kitchen Preparing', 
    icon: ChefHat, 
    color: 'text-amber-600', 
    bg: 'bg-amber-50',
    border: 'border-amber-200'
  },
  ready: { 
    label: 'Ready to Serve', 
    icon: CheckCircle2, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    border: 'border-emerald-200'
  },
  delivered: { 
    label: 'Delivered', 
    icon: Truck, 
    color: 'text-slate-600', 
    bg: 'bg-slate-50',
    border: 'border-slate-200'
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: X, 
    color: 'text-slate-400', 
    bg: 'bg-slate-50',
    border: 'border-slate-200'
  },
};

export default function OrderHistoryPage({ isOpen, onClose, propertyId }: OrderHistoryPageProps) {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const savedOrderIds = JSON.parse(localStorage.getItem('zamora_guest_order_ids') || '[]');
    
    if (savedOrderIds.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch Food Orders
      const foodQuery = supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            *
          )
        `)
        .in('id', savedOrderIds)
        .eq('property_id', propertyId);

      // Fetch Bar Orders
      const barQuery = supabase
        .from('bar_orders')
        .select(`
          *,
          items:bar_order_items (
            *
          )
        `)
        .in('id', savedOrderIds)
        .eq('property_id', propertyId);

      const [foodRes, barRes] = await Promise.all([foodQuery, barQuery]);

      if (foodRes.error) throw foodRes.error;
      if (barRes.error) throw barRes.error;

      // Combine and Sort
      const allOrders = [
        ...(foodRes.data || []).map(o => ({ ...o, type: 'food' })), 
        ...(barRes.data || []).map(o => ({ ...o, type: 'bar' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(allOrders);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }, [propertyId, supabase]);

  useEffect(() => {
    let channel: any;

    if (isOpen) {
      fetchOrders();
      
      // Set up Realtime Subscription
      const savedOrderIds = JSON.parse(localStorage.getItem('zamora_guest_order_ids') || '[]');
      
      if (savedOrderIds.length > 0) {
        channel = supabase
          .channel('guest_orders_tracking')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `property_id=eq.${propertyId}`,
            },
            (payload) => {
              if (savedOrderIds.includes(payload.new.id)) {
                setOrders((prev) => 
                  prev.map((order) => 
                    order.id === payload.new.id 
                      ? { ...order, ...payload.new } 
                      : order
                  )
                );
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'bar_orders',
              filter: `property_id=eq.${propertyId}`,
            },
            (payload) => {
              if (savedOrderIds.includes(payload.new.id)) {
                setOrders((prev) => 
                  prev.map((order) => 
                    order.id === payload.new.id 
                      ? { ...order, ...payload.new } 
                      : order
                  )
                );
              }
            }
          )
          .subscribe();
      }
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOpen, propertyId, fetchOrders, supabase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="font-black text-2xl flex items-center gap-2 tracking-tight text-slate-900">
            <Clock size={24} className="text-black" /> Order History
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <RefreshCw className="animate-spin text-slate-400" size={32} />
              <p className="text-slate-500 font-medium">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
                <ShoppingBag size={40} className="text-slate-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">No Past Orders</h3>
                <p className="text-slate-500 mt-2 max-w-[200px] mx-auto">
                You haven&apos;t placed any orders at this property yet.
              </p>
              </div>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
              >
                Start Ordering
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const StatusIcon = status.icon;

                return (
                  <div key={order.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm overflow-hidden">
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-50">
                      <div>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold mb-2 ${status.bg} ${status.color}`}>
                          <StatusIcon size={14} />
                          {status.label}
                        </div>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="font-black text-lg text-slate-900">
                        K{order.total_amount}
                      </span>
                    </div>

                    {/* Order Items Preview */}
                    <div className="space-y-3">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex gap-3 items-center">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 relative">
                            {item.details?.image_url || item.item_image_url ? (
                                <Image src={item.details?.image_url || item.item_image_url} alt={item.details?.name || item.item_name || 'Order Item'} fill className="object-cover" unoptimized />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    {order.type === 'bar' ? <Wine size={14} /> : <Utensils size={14} />}
                                </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {item.quantity}x {item.details?.name || item.item_name || 'Unknown Item'}
                            </p>
                            {item.notes && (
                                <p className="text-xs text-slate-400 truncate">{item.notes}</p>
                            )}
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            K{item.total_price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

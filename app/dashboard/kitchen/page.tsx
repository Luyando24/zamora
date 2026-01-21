'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '../context/PropertyContext';
import {
    Clock, CheckCircle2, ChefHat, AlertCircle,
    RefreshCw, Utensils, Eye, X, Timer, Play, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

// Types
interface OrderItem {
    id: string;
    quantity: number;
    notes?: string;
    unit_price: number;
    total_price: number;
    item_name?: string;
    menu_items: {
        name: string;
        image_url?: string;
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
    waiter_name?: string;
}

const KITCHEN_STATUS_CONFIG = {
    pending: {
        label: 'New Orders',
        icon: AlertCircle,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        actionLabel: 'Start Preparing',
        actionIcon: Play,
        nextStatus: 'preparing'
    },
    preparing: {
        label: 'Preparing',
        icon: Timer,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        button: 'bg-amber-500 hover:bg-amber-600 text-white',
        actionLabel: 'Mark as Ready',
        actionIcon: CheckSquare,
        nextStatus: 'ready'
    },
    ready: {
        label: 'Ready for Serving',
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        actionLabel: 'Mark as Served',
        actionIcon: Utensils,
        nextStatus: 'delivered'
    }
};

export default function KitchenDashboard() {
    const { selectedPropertyId } = useProperty();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const supabase = createClient();

    const fetchOrders = useCallback(async () => {
        if (!selectedPropertyId) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (
            id, quantity, notes, unit_price, total_price,
            item_name,
            menu_items ( name, image_url )
          )
        `)
                .eq('property_id', selectedPropertyId)
                .in('status', ['pending', 'preparing', 'ready'])
                .order('created_at', { ascending: true }); // OLDEST FIRST for kitchen

            if (error) throw error;
            setOrders((data as any[]) || []);
        } catch (error) {
            console.error('Error fetching kitchen orders:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedPropertyId, supabase]);

    useEffect(() => {
        fetchOrders();

        if (selectedPropertyId) {
            const channel = supabase
                .channel(`kitchen-orders-${selectedPropertyId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `property_id=eq.${selectedPropertyId}`
                }, () => {
                    fetchOrders();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [fetchOrders, selectedPropertyId, supabase]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o));
            if (selectedOrder?.id === orderId) setSelectedOrder(null);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const getOrdersByStatus = (status: 'pending' | 'preparing' | 'ready') => {
        return orders.filter(o => o.status === status);
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <ChefHat className="text-slate-700" size={28} />
                        Kitchen Dashboard
                    </h1>
                    <p className="text-slate-500 text-sm">Real-time order management for chefs</p>
                </div>

                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors font-bold text-sm"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {(['pending', 'preparing', 'ready'] as const).map((status) => {
                    const config = KITCHEN_STATUS_CONFIG[status];
                    const statusOrders = getOrdersByStatus(status);

                    return (
                        <div key={status} className="flex flex-col h-full min-h-[500px] bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden">
                            <div className={`p-4 border-b border-slate-200 flex items-center justify-between bg-white`}>
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}>
                                        <config.icon size={18} />
                                    </div>
                                    <h2 className="font-bold text-slate-800">{config.label}</h2>
                                    <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-black">
                                        {statusOrders.length}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {statusOrders.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-2 py-12">
                                        <Utensils size={40} strokeWidth={1} />
                                        <p className="text-sm font-medium">No orders in {status}</p>
                                    </div>
                                ) : (
                                    statusOrders.map((order) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={order.id}
                                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">
                                                        Order #{order.id.slice(0, 8)}
                                                    </p>
                                                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                                                        {order.guest_room_number}
                                                    </h3>
                                                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                                                        {order.guest_name} • {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                {order.order_items.map((item) => (
                                                    <div key={item.id} className="flex gap-2 text-sm">
                                                        <span className="font-black text-slate-900 min-w-[24px] bg-slate-100 px-1 rounded text-center h-fit mt-0.5">
                                                            {item.quantity}x
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-slate-800 m-0 leading-tight">
                                                                {item.item_name || item.menu_items?.name}
                                                            </p>
                                                            {item.notes && (
                                                                <p className="text-xs font-medium text-rose-500 mt-1 italic">
                                                                    Note: {item.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {order.notes && (
                                                <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-500 mb-4">
                                                    <p className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        Waiter Note: {order.notes}
                                                    </p>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => updateStatus(order.id, config.nextStatus)}
                                                className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-black text-sm transition-transform active:scale-95 shadow-sm ${config.button}`}
                                            >
                                                <config.actionIcon size={18} />
                                                {config.actionLabel}
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setSelectedOrder(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-none">Order Details</h3>
                                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">#{selectedOrder.id}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                        <Utensils size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{selectedOrder.guest_room_number}</h4>
                                        <p className="text-sm font-bold text-slate-500 capitalize">{selectedOrder.guest_name}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ordered Items</h5>
                                        <div className="space-y-4">
                                            {selectedOrder.order_items.map((item, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-900 border border-slate-200">
                                                        {item.quantity}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-slate-800">{item.item_name || item.menu_items?.name}</p>
                                                        {item.notes && <p className="text-xs font-bold text-rose-500 mt-1 italic">Note: {item.notes}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedOrder.notes && (
                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                            <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Order Notes</h5>
                                            <p className="text-sm font-bold text-amber-800 leading-relaxed">{selectedOrder.notes}</p>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Time Since Order</span>
                                            <span className="font-black text-slate-900">{formatDistanceToNow(new Date(selectedOrder.created_at), { addSuffix: true })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Waiter</span>
                                            <span className="font-black text-slate-900">{selectedOrder.waiter_name || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all"
                                >
                                    Close
                                </button>
                                {selectedOrder.status !== 'ready' && (
                                    <button
                                        onClick={() => updateStatus(selectedOrder.id, KITCHEN_STATUS_CONFIG[selectedOrder.status as keyof typeof KITCHEN_STATUS_CONFIG].nextStatus)}
                                        className={`flex-[2] py-3 font-black text-white rounded-2xl transition-all shadow-lg active:scale-95 ${KITCHEN_STATUS_CONFIG[selectedOrder.status as keyof typeof KITCHEN_STATUS_CONFIG].button}`}
                                    >
                                        {KITCHEN_STATUS_CONFIG[selectedOrder.status as keyof typeof KITCHEN_STATUS_CONFIG].actionLabel}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

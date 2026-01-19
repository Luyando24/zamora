'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  LogOut, ArrowLeft, ShoppingBag, Utensils, Beer, Clock, CheckCircle, XCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import GuestBottomNav from '@/components/guest/GuestBottomNav';

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  total_price: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  property_id: string;
  type: 'food' | 'bar';
  items: OrderItem[];
  properties: {
    name: string;
    cover_image_url: string;
    slug: string;
  };
}

export default function OrdersPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchOrders = useCallback(async (userId: string) => {
    // Fetch Food Orders
    const { data: foodOrders, error: foodError } = await supabase
      .from('orders')
      .select(`
        id, created_at, status, total_amount, property_id,
        order_items (id, item_name, quantity, total_price),
        properties (name, cover_image_url, slug)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Fetch Bar Orders
    const { data: barOrders, error: barError } = await supabase
      .from('bar_orders')
      .select(`
        id, created_at, status, total_amount, property_id,
        bar_order_items (id, item_name, quantity, total_price),
        properties (name, cover_image_url, slug)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (foodError) console.error('Error fetching food orders:', foodError);
    if (barError) console.error('Error fetching bar orders:', barError);

    const formattedFoodOrders = (foodOrders || []).map((o: any) => ({
      ...o,
      type: 'food' as const,
      items: o.order_items
    }));

    const formattedBarOrders = (barOrders || []).map((o: any) => ({
      ...o,
      type: 'bar' as const,
      items: o.bar_order_items
    }));

    const allOrders = [...formattedFoodOrders, ...formattedBarOrders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setOrders(allOrders);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login?next=/account/orders');
        return;
      }
      setUser(user);
      fetchOrders(user.id);
    };

    checkUser();
  }, [router, supabase, fetchOrders]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'preparing':
      case 'ready':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          <p className="text-slate-500 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-pink-400 flex items-center justify-center font-bold text-xl shadow-lg shadow-pink-600/20 text-white">Z</div>
            <span className="hidden md:block font-bold text-2xl tracking-tight uppercase text-slate-900">Zamora</span>
          </Link>
          <div className="flex items-center gap-4">
             <Link href="/explore" className="text-sm font-bold text-slate-500 hover:text-slate-900">Explore</Link>
             <button onClick={handleSignOut} className="text-sm font-bold text-slate-500 hover:text-red-600 flex items-center gap-2">
                <LogOut size={16} /> Sign Out
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        <div className="mb-8">
            <Link href="/account" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <ShoppingBag className="text-zambia-red" /> My Orders
            </h1>
        </div>

        {orders.length > 0 ? (
            <div className="space-y-4">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden relative shrink-0">
                           {order.properties?.cover_image_url ? (
                             <Image 
                                 src={order.properties.cover_image_url} 
                                 className="object-cover" 
                                 alt={order.properties.name} 
                                 fill
                                 unoptimized
                             />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-300">
                                {order.type === 'food' ? <Utensils size={24} /> : <Beer size={24} />}
                             </div>
                           )}
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{order.properties?.name || 'Unknown Property'}</h3>
                                    <p className="text-sm text-slate-500">{format(new Date(order.created_at), 'MMM d, yyyy • h:mm a')}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            
                            <div className="space-y-1 mb-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm text-slate-600">
                                        <span>{item.quantity}x {item.item_name}</span>
                                        <span className="font-medium">K{item.total_price}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                <div className="font-bold text-lg">Total: K{order.total_amount}</div>
                                {order.status === 'delivered' && (
                                    <button className="text-xs font-bold text-zambia-red hover:underline">
                                        Reorder
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center max-w-lg mx-auto">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <ShoppingBag size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No orders yet</h3>
                <p className="text-slate-500 mb-6">Order food and drinks from your favorite properties.</p>
                <Link href="/explore" className="inline-block px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
                    Explore Menu
                </Link>
            </div>
        )}
      </main>
      <GuestBottomNav />
    </div>
  );
}

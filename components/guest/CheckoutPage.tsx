'use client';

import { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, CreditCard, Wallet, Banknote, 
  MapPin, Phone, MessageSquare, CheckCircle2,
  Loader2, Utensils, Smartphone, Wine
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

interface CheckoutPageProps {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  property: any;
  onOrderSuccess: () => void;
  roomNumber?: string;
  tableNumber?: string;
}

export default function CheckoutPage({ isOpen, onClose, cart, property, onOrderSuccess, roomNumber, tableNumber }: CheckoutPageProps) {
  const supabase = createClient();
  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    roomNumber: roomNumber || '',
    tableNumber: tableNumber || '',
    name: 'Guest', // Default name for quick checkout
    phone: '',
    notes: '',
    paymentMethod: 'cash' // Default to cash for quick checkout
  });

  useEffect(() => {
    if (isOpen) {
      if (roomNumber) {
        setFormData(prev => ({ ...prev, roomNumber: roomNumber }));
      }
      if (tableNumber) {
        setFormData(prev => ({ ...prev, tableNumber: tableNumber }));
      }
      setStep('details'); // Reset step when modal opens
    }
  }, [isOpen, roomNumber, tableNumber]);

  if (!isOpen) return null;

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || item.base_price) * item.quantity, 0);
  // const serviceCharge = cartTotal * 0.10; // Removed service charge
  const grandTotal = cartTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const foodCart = cart.filter(i => i.type === 'food' || !i.type);
      const barCart = cart.filter(i => i.type === 'bar');
      const newOrderIds: string[] = [];

      // 1. Process Food Order
      if (foodCart.length > 0) {
        const foodOrderId = crypto.randomUUID();
        const foodTotal = foodCart.reduce((sum, i) => sum + (i.price || i.base_price) * i.quantity, 0);
        // const foodServiceCharge = foodTotal * 0.10; // Removed service charge
        const foodGrandTotal = foodTotal;
        
        // Determine location string and Table ID
        const locationString = formData.tableNumber 
            ? `Table ${formData.tableNumber}` 
            : formData.roomNumber;
            
        let tableId = null;
        if (formData.tableNumber) {
            // Lookup table ID from rooms table
            const { data: roomData } = await supabase
                .from('rooms')
                .select('id')
                .eq('property_id', property.id)
                .eq('room_number', formData.tableNumber)
                .single();
            
            if (roomData) {
                tableId = roomData.id;
            }
        }

        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            id: foodOrderId,
            property_id: property.id,
            status: 'pending',
            total_amount: foodGrandTotal,
            payment_method: formData.paymentMethod,
            guest_name: formData.name,
            guest_phone: formData.phone,
            guest_room_number: locationString,
            table_number: formData.tableNumber ? String(formData.tableNumber) : null,
            table_id: tableId, // Link to table entity
            notes: formData.notes,
            // Snapshot fields (Summary)
            item_name: foodCart.map(i => `${i.quantity}x ${i.name}`).join(', '),
            item_description: foodCart.map(i => i.description).filter(Boolean).join('; '),
            item_ingredients: foodCart.map(i => i.ingredients).filter(Boolean).join('; '),
            item_image_url: foodCart[0]?.image_url,
            weight: foodCart.map(i => i.weight).filter(Boolean).join(', '),
            category: foodCart[0]?.category, 
            options: JSON.stringify(foodCart.flatMap(i => i.selectedOptions || [])),
            extras: JSON.stringify([]) 
          });

        if (orderError) throw orderError;

        const orderItems = foodCart.map(item => ({
          order_id: foodOrderId,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price || item.base_price,
          total_price: (item.price || item.base_price) * item.quantity,
          notes: item.selectedOptions?.join(', '),
          // Snapshot fields
          item_name: item.name,
          item_description: item.description,
          item_ingredients: item.ingredients,
          item_image_url: item.image_url,
          weight: item.weight,
          category: item.category,
          options: item.selectedOptions ? JSON.stringify(item.selectedOptions) : JSON.stringify([])
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
        newOrderIds.push(foodOrderId);

        // Update Table Status to 'occupied'
        if (formData.tableNumber) {
            await supabase
                .from('rooms')
                .update({ status: 'occupied' })
                .eq('property_id', property.id)
                .eq('room_number', formData.tableNumber);
        }

        // Notify via SMS
        fetch('/api/notifications/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `New Food Order #${foodOrderId.slice(0, 8)} from ${locationString || 'N/A'}. Total: ${foodGrandTotal}`,
                propertyId: property.id
            })
        }).catch(err => console.error('Failed to send SMS notification', err));

        // Notify via Push
        fetch('/api/notifications/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: property.id,
            title: 'New Food Order 🍔',
            message: `Order #${foodOrderId.slice(0, 8)} from ${locationString || 'N/A'}. Total: K${foodGrandTotal}`,
            url: `/dashboard/orders?propertyId=${property.id}`
          })
        }).catch(err => console.error('Failed to send push notification', err));
      }

      // 2. Process Bar Order
      if (barCart.length > 0) {
        // Use API route to bypass RLS issues for guest users
        const response = await fetch('/api/bar-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barCart,
            formData,
            propertyId: property.id
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to place bar order');
        }

        if (data.orderId) {
            newOrderIds.push(data.orderId);
        }
      }

      // Save Order ID to LocalStorage for Guest History
      const savedOrders = JSON.parse(localStorage.getItem('zamora_guest_order_ids') || '[]');
      localStorage.setItem('zamora_guest_order_ids', JSON.stringify([...savedOrders, ...newOrderIds]));

      setStep('success');
      setTimeout(() => {
        onOrderSuccess();
      }, 3000);

    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Failed to place order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle">
          <CheckCircle2 size={48} className="text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">Order Placed!</h2>
        <p className="text-slate-500 text-center max-w-xs mb-8">
          The kitchen has received your order and will begin preparation shortly.
        </p>
        <button 
          onClick={onOrderSuccess}
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors"
        >
          View Active Session
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-50 flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-bottom duration-300">
      
      {/* Header (Mobile) */}
      <div className="md:hidden bg-white px-4 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full">
          <ArrowLeft size={24} className="text-slate-900" />
        </button>
        <h1 className="font-black text-lg text-slate-900">Checkout</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Scrollable Content Wrapper for Mobile */}
      <div className="flex-1 overflow-y-auto flex flex-col md:contents">

      {/* LEFT COLUMN: Order Summary */}
      <div className="shrink-0 order-2 md:order-1 bg-white md:bg-slate-50 md:p-8 md:flex-1 md:overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-0">
            
            {/* Desktop Header */}
            <div className="hidden md:flex items-center gap-4 mb-8">
                <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-slate-900" />
                </button>
                <h1 className="font-black text-3xl text-slate-900">Checkout</h1>
            </div>

            {/* Cart Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <Utensils size={16} className="text-slate-500" />
                    <span className="font-bold text-slate-700 text-sm">Order Summary</span>
                </div>
                <div className="divide-y divide-slate-50">
                    {cart.map((item, idx) => (
                        <div key={idx} className="p-4 flex gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 relative">
                                {item.image_url ? (
                                    <Image 
                                        src={item.image_url} 
                                        alt={item.name} 
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        {item.type === 'bar' ? <Wine size={16} /> : <Utensils size={16} />}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                                    <span className="font-bold text-slate-900">K{(item.price || item.base_price) * item.quantity}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-1">{item.quantity} x K{item.price || item.base_price}</p>
                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {item.selectedOptions.map((opt: string, i: number) => (
                                            <span key={i} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                                                {opt}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Totals */}
                <div className="p-4 bg-slate-50 space-y-2 border-t border-slate-100">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span className="font-medium">K{(cartTotal || 0).toFixed(2)}</span>
                    </div>
                    {/* <div className="flex justify-between text-sm text-slate-500">
                        <span>Service Charge (10%)</span>
                        <span className="font-medium">K{(serviceCharge || 0).toFixed(2)}</span>
                    </div> */}
                    <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200 mt-2">
                        <span>Total</span>
                        <span>K{(grandTotal || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Form */}
      <div className="w-full md:w-[480px] bg-white border-l border-slate-100 order-1 md:order-2 shrink-0 md:overflow-y-auto">
         <div className="p-6 md:p-8 md:h-full flex flex-col">
            <h2 className="text-xl font-black text-slate-900 mb-6">Confirm Order</h2>
            
            <form id="checkout-form" onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
                
                    {/* Room & Guest Info - Simplified/Hidden if detected */}
                    <div className="space-y-4">
                        {(roomNumber || tableNumber) && (
                             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0">
                                    {roomNumber ? <CheckCircle2 size={20} /> : <Utensils size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-emerald-900 text-sm">✓ Location Verified</p>
                                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                                        Delivering to <span className="font-bold">{roomNumber ? `Room ${roomNumber}` : `Table ${tableNumber}`}</span>.
                                    </p>
                                </div>
                            </div>
                        )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Notes (Optional)</label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 text-slate-400" size={18} />
                            <textarea 
                                rows={2}
                                placeholder="Allergies, extra spicy, etc."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium resize-none"
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Simplified Payment - Default to 'Pay Later' visually */}
                <div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="bg-white p-2 rounded-full border border-slate-100 shadow-sm">
                            <Banknote size={20} className="text-slate-900" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-900">Payment Due Later</p>
                            <p className="text-xs text-slate-500">Pay your waiter or at checkout.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-6 hidden md:block">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Place Order'}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-4">
                        Total Amount: K{grandTotal.toFixed(2)}
                    </p>
                </div>
            </form>
         </div>
      </div>
      
      </div>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         <button 
             type="submit"
             form="checkout-form"
             disabled={loading}
             className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:opacity-100"
         >
             {loading ? <Loader2 className="animate-spin" /> : 'Confirm Order'}
         </button>
      </div>

    </div>
  );
}

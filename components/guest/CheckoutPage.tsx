'use client';

import { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, CreditCard, Wallet, Banknote, 
  MapPin, Phone, MessageSquare, CheckCircle2,
  Loader2, Utensils, Smartphone
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface CheckoutPageProps {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  property: any;
  onOrderSuccess: () => void;
  roomNumber?: string;
}

export default function CheckoutPage({ isOpen, onClose, cart, property, onOrderSuccess, roomNumber }: CheckoutPageProps) {
  const supabase = createClient();
  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    roomNumber: roomNumber || '',
    name: '',
    phone: '',
    notes: '',
    paymentMethod: 'room_charge' // room_charge, cash, card, mobile_money
  });

  useEffect(() => {
    if (isOpen && roomNumber) {
      setFormData(prev => ({ ...prev, roomNumber: roomNumber }));
    }
  }, [isOpen, roomNumber]);

  if (!isOpen) return null;

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || item.base_price) * item.quantity, 0);
  const serviceCharge = cartTotal * 0.10; // 10% service charge example
  const grandTotal = cartTotal + serviceCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderId = crypto.randomUUID();

      // 1. Create Order
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          property_id: property.id,
          status: 'pending',
          total_amount: grandTotal,
          payment_method: formData.paymentMethod,
          guest_name: formData.name,
          guest_phone: formData.phone,
          guest_room_number: formData.roomNumber,
          notes: formData.notes
        });

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItems = cart.map(item => ({
        order_id: orderId,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price || item.base_price,
        total_price: (item.price || item.base_price) * item.quantity,
        notes: item.selectedOptions?.join(', ') // Simplified options handling
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

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
          Back to Menu
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
                            <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Utensils size={16} />
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
                        <span className="font-medium">K{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Service Charge (10%)</span>
                        <span className="font-medium">K{serviceCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200 mt-2">
                        <span>Total</span>
                        <span>K{grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Form */}
      <div className="w-full md:w-[480px] bg-white border-l border-slate-100 order-1 md:order-2 shrink-0 md:overflow-y-auto">
         <div className="p-6 md:p-8 md:h-full flex flex-col">
            <h2 className="text-xl font-black text-slate-900 mb-6">Delivery Details</h2>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
                
                    {/* Room & Guest Info */}
                    <div className="space-y-4">
                        {roomNumber ? (
                             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-emerald-900 text-sm">✓ Delivery Location Verified</p>
                                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                                        Rest assured, we know you are in <span className="font-bold">Room {roomNumber}</span>. 
                                        Your order will be delivered directly to your door.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Manual Room Number Input - Commented out as requested
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Room Number <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input 
                                        required
                                        type="text"
                                        placeholder="e.g. 104"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                        value={formData.roomNumber}
                                        onChange={e => setFormData({...formData, roomNumber: e.target.value})}
                                    />
                                </div>
                            </div>
                            */
                            null
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Guest Name <span className="text-red-500">*</span></label>
                            <input 
                                required
                            type="text"
                            placeholder="Your Full Name"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="tel"
                                placeholder="+260..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Notes for Kitchen</label>
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

                {/* Payment Method */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'room_charge', label: 'Room Charge', icon: MapPin },
                            { id: 'cash', label: 'Cash', icon: Banknote },
                            { id: 'card', label: 'Card', icon: CreditCard },
                            { id: 'mobile_money', label: 'Mobile Money', icon: Wallet },
                        ].map((method) => (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => setFormData({...formData, paymentMethod: method.id})}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                    formData.paymentMethod === method.id 
                                    ? 'border-black bg-black text-white shadow-md' 
                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <method.icon size={24} className="mb-2" />
                                <span className="text-xs font-bold">{method.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-6">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Confirm Order'}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-4">
                        By placing this order, you agree to pay the total amount of K{grandTotal.toFixed(2)} upon delivery or checkout.
                    </p>
                </div>
            </form>
         </div>
      </div>
      
      </div>

    </div>
  );
}

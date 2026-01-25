'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, Plus, Minus, RefreshCw, Trash2 } from 'lucide-react';
import { InventoryItem } from '@/hooks/useERP';

type TransactionType = 'in' | 'out' | 'adjustment' | 'waste';

interface StockAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    item: InventoryItem | null;
    onSuccess: () => void;
    defaultType?: TransactionType;
}

export default function StockAdjustmentModal({
    isOpen,
    onClose,
    propertyId,
    item,
    onSuccess,
    defaultType = 'in'
}: StockAdjustmentModalProps) {
    const [loading, setLoading] = useState(false);
    const [transactionType, setTransactionType] = useState<TransactionType>(defaultType);
    const [quantity, setQuantity] = useState<number>(0);
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTransactionType(defaultType);
            setQuantity(0);
            setReason('');
        }
    }, [isOpen, defaultType]);

    if (!isOpen || !item) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity <= 0 && transactionType !== 'adjustment') {
            alert('Quantity must be greater than 0');
            return;
        }

        setLoading(true);
        const supabase = createClient();

        try {
            const currentQuantity = item.quantity || 0;
            let newQuantity = currentQuantity;
            let quantityChange = quantity;

            switch (transactionType) {
                case 'in':
                    newQuantity = currentQuantity + quantity;
                    break;
                case 'out':
                case 'waste':
                    newQuantity = Math.max(0, currentQuantity - quantity);
                    quantityChange = -quantity;
                    break;
                case 'adjustment':
                    newQuantity = quantity;
                    quantityChange = quantity - currentQuantity;
                    break;
            }

            // Update inventory item
            const { error: updateError } = await supabase
                .from('inventory_items')
                .update({
                    quantity: newQuantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', item.id)
                .eq('property_id', propertyId);

            if (updateError) throw updateError;

            // Log transaction
            const { error: txnError } = await supabase
                .from('inventory_transactions')
                .insert({
                    item_id: item.id,
                    type: transactionType,
                    quantity: quantityChange,
                    reason: reason || getDefaultReason(transactionType),
                    cost_at_time: item.cost_per_unit
                });

            if (txnError) {
                console.error('Transaction log error:', txnError);
                // Don't fail - stock update succeeded
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adjusting stock:', error);
            alert('Failed to adjust stock');
        } finally {
            setLoading(false);
        }
    };

    const getDefaultReason = (type: TransactionType): string => {
        const reasons: Record<TransactionType, string> = {
            in: 'Restock',
            out: 'Manual deduction',
            adjustment: 'Stock count adjustment',
            waste: 'Waste/Spoilage'
        };
        return reasons[type];
    };

    const getTypeConfig = (type: TransactionType) => {
        const configs: Record<TransactionType, { icon: any; label: string; color: string; bg: string }> = {
            in: { icon: Plus, label: 'Restock', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
            out: { icon: Minus, label: 'Use/Deduct', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
            adjustment: { icon: RefreshCw, label: 'Set Count', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
            waste: { icon: Trash2, label: 'Waste', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
        };
        return configs[type];
    };

    const currentQty = item.quantity || 0;
    const previewQty = transactionType === 'adjustment'
        ? quantity
        : transactionType === 'in'
            ? currentQty + quantity
            : Math.max(0, currentQty - quantity);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Adjust Stock</h3>
                        <p className="text-sm text-slate-500 mt-1">{item.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Current Stock Display */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Current Stock</span>
                        <span className="text-2xl font-bold text-slate-900">
                            {currentQty} <span className="text-sm font-normal text-slate-500">{item.unit}</span>
                        </span>
                    </div>
                </div>

                {/* Transaction Type Selector */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    {(['in', 'out', 'adjustment', 'waste'] as TransactionType[]).map((type) => {
                        const config = getTypeConfig(type);
                        const Icon = config.icon;
                        const isActive = transactionType === type;

                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setTransactionType(type)}
                                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${isActive
                                        ? `${config.bg} ${config.color} border-current`
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="text-xs font-medium mt-1">{config.label}</span>
                            </button>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {transactionType === 'adjustment' ? 'New Quantity' : 'Quantity'}
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-lg font-medium"
                                value={quantity}
                                onChange={e => setQuantity(Number(e.target.value))}
                                placeholder={transactionType === 'adjustment' ? 'Set to...' : 'Enter amount...'}
                            />
                            <span className="text-slate-500 font-medium">{item.unit}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder={getDefaultReason(transactionType)}
                        />
                    </div>

                    {/* Preview */}
                    {quantity > 0 && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">New Stock Level</span>
                                <span className={`text-2xl font-bold ${previewQty < (item.min_quantity || 0) ? 'text-amber-600' : 'text-green-600'}`}>
                                    {previewQty.toFixed(2)} <span className="text-sm font-normal text-slate-500">{item.unit}</span>
                                </span>
                            </div>
                            {previewQty < (item.min_quantity || 0) && (
                                <p className="text-xs text-amber-600 mt-2">⚠️ This will put the item below minimum stock level</p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (quantity <= 0 && transactionType !== 'adjustment')}
                            className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '../../context/PropertyContext';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Trash2, Filter, Calendar, Package, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
    id: string;
    item_id: string;
    type: 'in' | 'out' | 'adjustment' | 'waste';
    quantity: number;
    reason: string | null;
    cost_at_time: number | null;
    performed_by: string | null;
    created_at: string;
    inventory_items?: {
        name: string;
    };
}

const TYPE_CONFIG = {
    in: {
        label: 'Restock',
        icon: ArrowUpRight,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200'
    },
    out: {
        label: 'Used/Sold',
        icon: ArrowDownRight,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200'
    },
    adjustment: {
        label: 'Adjustment',
        icon: RefreshCw,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200'
    },
    waste: {
        label: 'Waste',
        icon: Trash2,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200'
    }
};

export default function StockMovementsPage() {
    const { selectedPropertyId } = useProperty();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');
    const [dateRange, setDateRange] = useState<string>('7'); // days
    const supabase = createClient();

    const fetchTransactions = useCallback(async () => {
        if (!selectedPropertyId) return;

        setLoading(true);
        try {
            // Calculate date filter
            const daysAgo = parseInt(dateRange);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysAgo);

            let query = supabase
                .from('inventory_transactions')
                .select(`
          *,
          inventory_items!inner (name, property_id)
        `)
                .eq('inventory_items.property_id', selectedPropertyId)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false })
                .limit(200);

            if (filterType !== 'all') {
                query = query.eq('type', filterType);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching transactions:', error);
            } else {
                setTransactions(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedPropertyId, filterType, dateRange, supabase]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium">Loading transactions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/stock"
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Movements</h2>
                        <p className="text-slate-500 text-sm">Transaction history for all inventory items.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Type Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="in">Restocks</option>
                            <option value="out">Used/Sold</option>
                            <option value="adjustment">Adjustments</option>
                            <option value="waste">Waste</option>
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={dateRange}
                            onChange={e => setDateRange(e.target.value)}
                        >
                            <option value="1">Today</option>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchTransactions}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Package size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-slate-900 font-medium text-lg">No transactions found</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                Stock movements will appear here when items are restocked or used.
                            </p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {transactions.map((txn) => {
                                    const config = TYPE_CONFIG[txn.type] || TYPE_CONFIG.adjustment;
                                    const Icon = config.icon;

                                    return (
                                        <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-600">{formatDate(txn.created_at)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-slate-900">
                                                    {(txn.inventory_items as any)?.name || 'Unknown Item'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}>
                                                    <Icon size={12} />
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`text-sm font-bold ${txn.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {txn.quantity >= 0 ? '+' : ''}{txn.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-500 truncate max-w-[200px] block">
                                                    {txn.reason || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

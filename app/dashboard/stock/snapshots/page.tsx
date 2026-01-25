'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useProperty } from '../../context/PropertyContext';
import { Camera, Calendar, DollarSign, Package, ChevronLeft, Eye, RefreshCw, Sun, CalendarDays, CalendarRange } from 'lucide-react';
import Link from 'next/link';

interface Snapshot {
    id: string;
    snapshot_type: 'daily' | 'weekly' | 'monthly';
    snapshot_date: string;
    items: Array<{
        item_id: string;
        name: string;
        quantity: number;
        unit: string;
        cost_per_unit: number;
    }>;
    total_value: number;
    notes: string | null;
    created_at: string;
}

const TYPE_CONFIG = {
    daily: { icon: Sun, label: 'Daily', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    weekly: { icon: CalendarDays, label: 'Weekly', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    monthly: { icon: CalendarRange, label: 'Monthly', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' }
};

export default function StockSnapshotsPage() {
    const { selectedPropertyId } = useProperty();
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [takingSnapshot, setTakingSnapshot] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
    const supabase = createClient();

    const fetchSnapshots = useCallback(async () => {
        if (!selectedPropertyId) return;

        setLoading(true);
        try {
            let query = supabase
                .from('stock_snapshots')
                .select('*')
                .eq('property_id', selectedPropertyId)
                .order('snapshot_date', { ascending: false })
                .limit(50);

            if (filterType !== 'all') {
                query = query.eq('snapshot_type', filterType);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching snapshots:', error);
            } else {
                setSnapshots(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedPropertyId, filterType, supabase]);

    useEffect(() => {
        fetchSnapshots();
    }, [fetchSnapshots]);

    const takeSnapshot = async (type: 'daily' | 'weekly' | 'monthly') => {
        if (!selectedPropertyId) return;

        setTakingSnapshot(true);
        try {
            // Fetch all inventory items
            const { data: items, error: fetchError } = await supabase
                .from('inventory_items')
                .select('id, name, quantity, unit, cost_per_unit')
                .eq('property_id', selectedPropertyId)
                .order('name');

            if (fetchError) throw fetchError;

            // Calculate total value
            const totalValue = (items || []).reduce((sum, item) => {
                return sum + ((item.quantity || 0) * (item.cost_per_unit || 0));
            }, 0);

            // Format items for JSON storage
            const snapshotItems = (items || []).map(item => ({
                item_id: item.id,
                name: item.name,
                quantity: item.quantity || 0,
                unit: item.unit || 'unit',
                cost_per_unit: item.cost_per_unit || 0
            }));

            const today = new Date().toISOString().split('T')[0];
            const typeLabels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

            // Upsert snapshot
            const { error: insertError } = await supabase
                .from('stock_snapshots')
                .upsert({
                    property_id: selectedPropertyId,
                    snapshot_type: type,
                    snapshot_date: today,
                    items: snapshotItems,
                    total_value: totalValue,
                    notes: `${typeLabels[type]} opening stock snapshot`
                }, {
                    onConflict: 'property_id,snapshot_type,snapshot_date'
                });

            if (insertError) throw insertError;

            alert(`${typeLabels[type]} snapshot created successfully!`);
            fetchSnapshots();
        } catch (error: any) {
            console.error('Error taking snapshot:', error);
            alert('Failed to take snapshot: ' + error.message);
        } finally {
            setTakingSnapshot(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return `K${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium">Loading snapshots...</p>
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
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Snapshots</h2>
                        <p className="text-slate-500 text-sm">Opening stock records for inventory tracking.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Take Snapshot Buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => takeSnapshot('daily')}
                            disabled={takingSnapshot}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Take daily snapshot"
                        >
                            <Sun size={14} />
                            Daily
                        </button>
                        <button
                            onClick={() => takeSnapshot('weekly')}
                            disabled={takingSnapshot}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Take weekly snapshot"
                        >
                            <CalendarDays size={14} />
                            Weekly
                        </button>
                        <button
                            onClick={() => takeSnapshot('monthly')}
                            disabled={takingSnapshot}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Take monthly snapshot"
                        >
                            <CalendarRange size={14} />
                            Monthly
                        </button>
                    </div>

                    {/* Type Filter */}
                    <select
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>

                    <button
                        onClick={fetchSnapshots}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Snapshots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {snapshots.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Camera size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-slate-900 font-medium text-lg">No snapshots yet</h3>
                        <p className="text-slate-500 text-sm mt-1 text-center max-w-md">
                            Take a snapshot to record your current stock levels.
                            Use daily for opening stock, weekly for weekly reviews, and monthly for accounting.
                        </p>
                    </div>
                ) : (
                    snapshots.map((snapshot) => {
                        const config = TYPE_CONFIG[snapshot.snapshot_type];
                        const Icon = config.icon;
                        const itemCount = Array.isArray(snapshot.items) ? snapshot.items.length : 0;

                        return (
                            <div
                                key={snapshot.id}
                                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 ${config.bg} ${config.color} rounded-xl flex items-center justify-center`}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}>
                                                {config.label}
                                            </span>
                                            <p className="text-slate-900 font-bold mt-1">{formatDate(snapshot.snapshot_date)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSnapshot(snapshot)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="View details"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-1.5">
                                            <Package size={14} /> Items
                                        </span>
                                        <span className="font-medium text-slate-900">{itemCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-1.5">
                                            <DollarSign size={14} /> Total Value
                                        </span>
                                        <span className="font-bold text-slate-900">{formatCurrency(snapshot.total_value || 0)}</span>
                                    </div>
                                </div>

                                {snapshot.notes && (
                                    <p className="text-xs text-slate-400 mt-3 truncate">{snapshot.notes}</p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Snapshot Detail Modal */}
            {selectedSnapshot && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setSelectedSnapshot(null)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Snapshot Details</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {formatDate(selectedSnapshot.snapshot_date)} • {TYPE_CONFIG[selectedSnapshot.snapshot_type].label}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSnapshot(null)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 overflow-auto flex-1">
                            <div className="bg-slate-50 rounded-xl p-4 mb-4 flex justify-between items-center">
                                <span className="text-slate-600">Total Inventory Value</span>
                                <span className="text-2xl font-bold text-slate-900">
                                    {formatCurrency(selectedSnapshot.total_value || 0)}
                                </span>
                            </div>

                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                Items ({Array.isArray(selectedSnapshot.items) ? selectedSnapshot.items.length : 0})
                            </h4>

                            <div className="space-y-2">
                                {Array.isArray(selectedSnapshot.items) && selectedSnapshot.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100">
                                        <div>
                                            <p className="font-medium text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-500">{formatCurrency(item.cost_per_unit || 0)} / {item.unit}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">{item.quantity} {item.unit}</p>
                                            <p className="text-xs text-slate-500">
                                                Value: {formatCurrency((item.quantity || 0) * (item.cost_per_unit || 0))}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

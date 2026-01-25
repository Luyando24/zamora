import { NextRequest, NextResponse } from 'next/server';
import { verifyManagerAccess } from '../../utils';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const startDate = searchParams.get('startDate'); // ISO string YYYY-MM-DD
        const endDate = searchParams.get('endDate');     // ISO string YYYY-MM-DD

        const access = await verifyManagerAccess(req, propertyId || '');
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();

        // Prepare date filters
        const start = startDate ? new Date(startDate).toISOString() : new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(); // Default 30 days
        const end = endDate ? new Date(endDate).toISOString() : new Date().toISOString();

        // Fetch Food Orders
        const { data: foodOrders, error: foodError } = await supabase
            .from('orders')
            .select('payment_method, total_amount')
            .eq('property_id', propertyId)
            .gte('created_at', start)
            .lte('created_at', end)
            .not('payment_method', 'is', null);

        if (foodError) throw foodError;

        // Fetch Bar Orders
        const { data: barOrders, error: barError } = await supabase
            .from('bar_orders')
            .select('payment_method, total_amount')
            .eq('property_id', propertyId)
            .gte('created_at', start)
            .lte('created_at', end)
            .not('payment_method', 'is', null);

        if (barError) throw barError;

        // Aggregate Data
        const stats: Record<string, { count: number; total: number }> = {};

        const processOrder = (order: any) => {
            const method = order.payment_method || 'Unknown';
            if (!stats[method]) {
                stats[method] = { count: 0, total: 0 };
            }
            stats[method].count += 1;
            stats[method].total += (order.total_amount || 0);
        };

        foodOrders?.forEach(processOrder);
        barOrders?.forEach(processOrder);

        // Format for response
        const breakdown = Object.entries(stats).map(([method, data]) => ({
            method,
            count: data.count,
            total_revenue: parseFloat(data.total.toFixed(2))
        })).sort((a, b) => b.total_revenue - a.total_revenue);

        return NextResponse.json({
            period: { start, end },
            breakdown
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

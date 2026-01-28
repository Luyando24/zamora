import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { verifyManagerAccess } from '../utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const period = searchParams.get('period') || 'today';

        if (!propertyId) return NextResponse.json({ error: 'Property ID required' }, { status: 400 });

        // Verify Access
        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();

        // Determine Date Range - Use UTC consistently since DB stores timestamps in UTC
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
            case 'today':
                // Exactly last 24 hours to ensure "Today" data is always visible regardless of midnight cross
                startDate.setTime(now.getTime() - (24 * 60 * 60 * 1000));
                break;
            case 'week':
                // Last 7 days in UTC
                startDate.setUTCDate(now.getUTCDate() - 7);
                startDate.setUTCHours(0, 0, 0, 0);
                break;
            case 'month':
                // Last 30 days in UTC
                startDate.setUTCDate(now.getUTCDate() - 30);
                startDate.setUTCHours(0, 0, 0, 0);
                break;
            case 'year':
                // Last 365 days in UTC
                startDate.setUTCDate(now.getUTCDate() - 365);
                startDate.setUTCHours(0, 0, 0, 0);
                break;
            default:
                // Default to last 24 hours
                startDate.setTime(now.getTime() - (24 * 60 * 60 * 1000));
        }

        const startDateStr = startDate.toISOString();

        // 1. Fetch Orders (Food)
        const { data: foodOrders, error: foodError } = await supabase
            .from('orders')
            .select('id, status, total_amount, created_at, order_items(item_name, quantity, unit_price)')
            .eq('property_id', propertyId)
            .gte('created_at', startDateStr)
            .order('created_at', { ascending: false })
            .limit(5000);

        if (foodError) throw foodError;

        // 2. Fetch Orders (Bar)
        const { data: barOrders, error: barError } = await supabase
            .from('bar_orders')
            .select('id, status, total_amount, created_at, bar_order_items(item_name, quantity, unit_price)')
            .eq('property_id', propertyId)
            .gte('created_at', startDateStr)
            .order('created_at', { ascending: false })
            .limit(5000);

        if (barError) throw barError;

        // 3. Process Data
        const allOrders = [
            ...(foodOrders || []).map(o => ({ 
                ...o, 
                type: 'food', 
                items: o.order_items?.map((i: any) => ({ 
                    name: i.item_name, 
                    quantity: i.quantity, 
                    price: i.unit_price 
                })) 
            })),
            ...(barOrders || []).map(o => ({ 
                ...o, 
                type: 'bar', 
                items: o.bar_order_items?.map((i: any) => ({ 
                    name: i.item_name, 
                    quantity: i.quantity, 
                    price: i.unit_price 
                })) 
            }))
        ];

        const totalOrders = allOrders.length;
        const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Orders by Status
        const ordersByStatus: Record<string, number> = {};
        allOrders.forEach(o => {
            const status = o.status || 'unknown';
            ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
        });

        // Top Items
        const itemMap: Record<string, { quantity: number, revenue: number }> = {};
        allOrders.forEach(o => {
            if (o.items && Array.isArray(o.items)) {
                o.items.forEach((item: any) => {
                    const name = item.name || 'Unknown Item';
                    const qty = Number(item.quantity) || 0;
                    const price = Number(item.price) || 0;
                    
                    if (!itemMap[name]) itemMap[name] = { quantity: 0, revenue: 0 };
                    itemMap[name].quantity += qty;
                    itemMap[name].revenue += (qty * price);
                });
            }
        });

        const topItems = Object.entries(itemMap)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5); // Top 5

        return NextResponse.json({
            period,
            totalOrders,
            totalRevenue,
            averageOrderValue,
            summary: {
                totalOrders,
                totalRevenue,
                averageOrderValue
            },
            ordersByStatus,
            topItems
        });

    } catch (error: any) {
        console.error('Performance API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

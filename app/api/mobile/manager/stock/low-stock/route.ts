/**
 * Low Stock Alert API
 * 
 * GET /api/mobile/manager/stock/low-stock?propertyId=xxx
 * Returns a list of all items below their minimum quantity threshold.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');

        if (!propertyId) {
            return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
        }

        // Verify auth
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = getSupabaseAdmin();

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Fetch all items and filter for low stock
        // Using raw query because Supabase doesn't easily support column-to-column comparison
        const { data: items, error } = await supabase
            .from('inventory_items')
            .select(`
        id,
        name,
        sku,
        category,
        unit,
        quantity,
        min_quantity,
        cost_per_unit,
        location,
        suppliers (id, name)
      `)
            .eq('property_id', propertyId)
            .order('quantity', { ascending: true });

        if (error) {
            console.error('Low stock fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Filter for items where quantity <= min_quantity
        const lowStockItems = (items || [])
            .filter(item => (item.quantity || 0) <= (item.min_quantity || 0))
            .map(item => ({
                id: item.id,
                name: item.name,
                sku: item.sku,
                category: item.category,
                unit: item.unit,
                current_quantity: item.quantity,
                min_quantity: item.min_quantity,
                shortage: (item.min_quantity || 0) - (item.quantity || 0),
                cost_per_unit: item.cost_per_unit,
                location: item.location,
                supplier_name: (item.suppliers as any)?.name || null,
                urgency: (item.quantity || 0) === 0 ? 'critical' :
                    (item.quantity || 0) <= (item.min_quantity || 0) / 2 ? 'high' : 'medium'
            }));

        // Sort by urgency (critical first) then by shortage amount
        lowStockItems.sort((a, b) => {
            const urgencyOrder = { critical: 0, high: 1, medium: 2 };
            const urgencyDiff = (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 2) -
                (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 2);
            if (urgencyDiff !== 0) return urgencyDiff;
            return b.shortage - a.shortage;
        });

        return NextResponse.json({
            success: true,
            count: lowStockItems.length,
            items: lowStockItems,
            alert_message: lowStockItems.length > 0
                ? `${lowStockItems.length} item(s) need restocking`
                : 'All stock levels are healthy'
        });

    } catch (error: any) {
        console.error('Low stock API error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}

/**
 * Stock Management API - Single Item
 * 
 * GET /api/mobile/manager/stock/[itemId]?propertyId=xxx
 * Returns a single inventory item with recent transactions.
 * 
 * PUT /api/mobile/manager/stock/[itemId]
 * Updates an inventory item.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { itemId } = await params;
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

        // Fetch the item
        const { data: item, error: itemError } = await supabase
            .from('inventory_items')
            .select(`
        *,
        suppliers (id, name, phone, email)
      `)
            .eq('id', itemId)
            .eq('property_id', propertyId)
            .single();

        if (itemError || !item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Fetch recent transactions
        const { data: transactions } = await supabase
            .from('inventory_transactions')
            .select('*')
            .eq('item_id', itemId)
            .order('created_at', { ascending: false })
            .limit(20);

        return NextResponse.json({
            success: true,
            item: {
                ...item,
                is_low_stock: (item.quantity || 0) <= (item.min_quantity || 0),
                supplier_name: (item.suppliers as any)?.name || null
            },
            transactions: transactions || []
        });

    } catch (error: any) {
        console.error('Stock item GET error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { itemId } = await params;
        const body = await req.json();
        const { propertyId, name, category, unit, min_quantity, cost_per_unit, location, supplier_id } = body;

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

        // Verify user has manager role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, property_id')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'manager', 'owner', 'super_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Build update object
        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString()
        };

        if (name !== undefined) updateData.name = name;
        if (category !== undefined) updateData.category = category;
        if (unit !== undefined) updateData.unit = unit;
        if (min_quantity !== undefined) updateData.min_quantity = min_quantity;
        if (cost_per_unit !== undefined) updateData.cost_per_unit = cost_per_unit;
        if (location !== undefined) updateData.location = location;
        if (supplier_id !== undefined) updateData.supplier_id = supplier_id || null;

        // Update item
        const { data: updatedItem, error: updateError } = await supabase
            .from('inventory_items')
            .update(updateData)
            .eq('id', itemId)
            .eq('property_id', propertyId)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            item: updatedItem
        });

    } catch (error: any) {
        console.error('Stock item PUT error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}

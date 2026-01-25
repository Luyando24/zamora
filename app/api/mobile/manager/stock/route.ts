/**
 * Stock Management API - List Items
 * 
 * GET /api/mobile/manager/stock?propertyId=xxx
 * Returns all inventory items for a property with low-stock indicators.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            propertyId,
            name,
            category,
            unit,
            min_quantity,
            cost_per_unit,
            supplier_id,
            initial_quantity
        } = body;

        if (!propertyId || !name) {
            return NextResponse.json({ error: 'Missing required fields: propertyId, name' }, { status: 400 });
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

        // Verify user permission
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, property_id')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.property_id !== propertyId && !['admin', 'super_admin'].includes(profile.role))) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Create Item
        const { data: newItem, error: insertError } = await supabase
            .from('inventory_items')
            .insert({
                property_id: propertyId,
                name,
                category: category || 'food',
                unit: unit || 'unit',
                min_quantity: min_quantity || 0,
                cost_per_unit: cost_per_unit || 0,
                supplier_id: supplier_id || null,
                quantity: initial_quantity || 0,
                // created_at and updated_at are usually handled by DB defaults, but we can set updated_at
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Handle Initial Stock Transaction
        if (initial_quantity && initial_quantity > 0) {
            const { error: txnError } = await supabase
                .from('inventory_transactions')
                .insert({
                    item_id: newItem.id,
                    type: 'in',
                    quantity: initial_quantity,
                    reason: 'Initial Stock',
                    cost_at_time: cost_per_unit || 0,
                    performed_by: user.id
                });
            
            if (txnError) {
                console.error('Failed to log initial stock transaction:', txnError);
                // We don't fail the request, but we log the error
            }
        }

        return NextResponse.json({ success: true, item: newItem });

    } catch (error: any) {
        console.error('Stock creation error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const category = searchParams.get('category');
        const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
        const search = searchParams.get('search');

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

        // Verify user belongs to property
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, property_id')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.property_id !== propertyId && !['admin', 'super_admin'].includes(profile.role))) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Build query
        let query = supabase
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
        supplier_id,
        created_at,
        updated_at,
        suppliers (id, name)
      `)
            .eq('property_id', propertyId)
            .order('name');

        // Apply filters
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data: items, error } = await query;

        if (error) {
            console.error('Stock fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Process items to add low_stock flag
        const processedItems = (items || []).map(item => ({
            ...item,
            is_low_stock: (item.quantity || 0) <= (item.min_quantity || 0),
            supplier_name: (item.suppliers as any)?.name || null
        }));

        // Filter for low stock only if requested
        const finalItems = lowStockOnly
            ? processedItems.filter(item => item.is_low_stock)
            : processedItems;

        // Calculate summary stats
        const totalItems = processedItems.length;
        const lowStockCount = processedItems.filter(i => i.is_low_stock).length;
        const totalValue = processedItems.reduce((sum, item) =>
            sum + ((item.quantity || 0) * (item.cost_per_unit || 0)), 0
        );

        return NextResponse.json({
            success: true,
            items: finalItems,
            summary: {
                total_items: totalItems,
                low_stock_count: lowStockCount,
                total_inventory_value: totalValue
            }
        });

    } catch (error: any) {
        console.error('Stock API error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}

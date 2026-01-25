/**
 * Stock Transactions API
 * 
 * POST /api/mobile/manager/stock/transactions
 * Creates a stock transaction (restock, adjustment, waste).
 * 
 * GET /api/mobile/manager/stock/transactions?propertyId=xxx
 * Lists recent transactions for a property.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            propertyId,
            itemId,
            type, // 'in', 'out', 'adjustment', 'waste'
            quantity, // Positive number
            reason,
            costAtTime
        } = body;

        if (!propertyId || !itemId || !type || quantity === undefined) {
            return NextResponse.json({
                error: 'Missing required fields: propertyId, itemId, type, quantity'
            }, { status: 400 });
        }

        if (!['in', 'out', 'adjustment', 'waste'].includes(type)) {
            return NextResponse.json({
                error: 'Invalid type. Must be: in, out, adjustment, or waste'
            }, { status: 400 });
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

        // Verify user has permission
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, property_id')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'manager', 'owner', 'staff', 'chef', 'bartender', 'super_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Fetch current item
        const { data: item, error: itemError } = await supabase
            .from('inventory_items')
            .select('id, name, quantity, cost_per_unit')
            .eq('id', itemId)
            .eq('property_id', propertyId)
            .single();

        if (itemError || !item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Calculate new quantity
        let quantityChange = Math.abs(quantity);
        let newQuantity = item.quantity || 0;

        switch (type) {
            case 'in':
                newQuantity += quantityChange;
                break;
            case 'out':
            case 'waste':
                newQuantity = Math.max(0, newQuantity - quantityChange);
                quantityChange = -quantityChange; // Store as negative
                break;
            case 'adjustment':
                // Adjustment sets the quantity to the provided value
                newQuantity = quantity;
                quantityChange = quantity - (item.quantity || 0); // Calculate delta
                break;
        }

        // Update inventory item
        const { error: updateError } = await supabase
            .from('inventory_items')
            .update({
                quantity: newQuantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', itemId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Log transaction
        const { data: transaction, error: txnError } = await supabase
            .from('inventory_transactions')
            .insert({
                item_id: itemId,
                type,
                quantity: quantityChange,
                reason: reason || `${type.charAt(0).toUpperCase() + type.slice(1)} by ${profile.role}`,
                cost_at_time: costAtTime || item.cost_per_unit,
                performed_by: user.id
            })
            .select()
            .single();

        if (txnError) {
            console.error('Transaction log error:', txnError);
            // Don't fail - the stock update succeeded
        }

        return NextResponse.json({
            success: true,
            item_name: item.name,
            previous_quantity: item.quantity,
            new_quantity: newQuantity,
            quantity_change: quantityChange,
            transaction_id: transaction?.id
        });

    } catch (error: any) {
        console.error('Stock transaction error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const itemId = searchParams.get('itemId');
        const type = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit') || '50');

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

        // Build query - join with inventory_items to filter by property
        let query = supabase
            .from('inventory_transactions')
            .select(`
        id,
        type,
        quantity,
        reason,
        cost_at_time,
        performed_by,
        created_at,
        inventory_items!inner (id, name, property_id)
      `)
            .eq('inventory_items.property_id', propertyId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (itemId) {
            query = query.eq('item_id', itemId);
        }

        if (type && ['in', 'out', 'adjustment', 'waste'].includes(type)) {
            query = query.eq('type', type);
        }

        const { data: transactions, error } = await query;

        if (error) {
            console.error('Transactions fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format response
        const formattedTransactions = (transactions || []).map((txn: any) => ({
            id: txn.id,
            type: txn.type,
            quantity: txn.quantity,
            reason: txn.reason,
            cost_at_time: txn.cost_at_time,
            performed_by: txn.performed_by,
            created_at: txn.created_at,
            item_id: txn.inventory_items?.id,
            item_name: txn.inventory_items?.name
        }));

        return NextResponse.json({
            success: true,
            transactions: formattedTransactions
        });

    } catch (error: any) {
        console.error('Transactions GET error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}

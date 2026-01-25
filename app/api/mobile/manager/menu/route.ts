import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { verifyManagerAccess } from '../utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const type = searchParams.get('type'); // 'food', 'bar', or null (all)

        if (!propertyId) return NextResponse.json({ error: 'Property ID required' }, { status: 400 });

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();

        const fetchFood = !type || type === 'food';
        const fetchBar = !type || type === 'bar';

        let menuItems: any[] = [];
        let barMenuItems: any[] = [];

        if (fetchFood) {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*, menu_item_properties!inner(property_id)')
                .eq('menu_item_properties.property_id', propertyId)
                .order('name');
            if (error) throw error;
            menuItems = data || [];
        }

        if (fetchBar) {
            const { data, error } = await supabase
                .from('bar_menu_items')
                .select('*, bar_menu_item_properties!inner(property_id)')
                .eq('bar_menu_item_properties.property_id', propertyId)
                .order('name');
            if (error) throw error;
            barMenuItems = data || [];
        }

        return NextResponse.json({ 
            menuItems: menuItems.map(i => ({ ...i, type: 'food' })), 
            barMenuItems: barMenuItems.map(i => ({ ...i, type: 'bar' })) 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            propertyId, type, name, description, category, price, 
            image_url, is_available, ingredients, dietary_info, 
            weight, original_price, discount_badge 
        } = body;

        if (!propertyId || !name || !price || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();
        const table = type === 'bar' ? 'bar_menu_items' : 'menu_items';
        const junctionTable = type === 'bar' ? 'bar_menu_item_properties' : 'menu_item_properties';

        const payload: any = {
            name,
            description,
            category,
            price,
            image_url,
            is_available: is_available !== undefined ? is_available : true,
            created_by: access.user.id,
            property_id: propertyId // Legacy support / Direct column
        };

        // Add stock fields for bar items
        if (type === 'bar') {
            const { track_stock, stock_quantity, low_stock_threshold, cost_price } = body;
            if (track_stock !== undefined) payload.track_stock = track_stock;
            if (stock_quantity !== undefined) payload.stock_quantity = stock_quantity;
            if (low_stock_threshold !== undefined) payload.low_stock_threshold = low_stock_threshold;
            if (cost_price !== undefined) payload.cost_price = cost_price;
        }

        // Add optional fields if present
        if (ingredients) payload.ingredients = ingredients;
        if (dietary_info) payload.dietary_info = dietary_info;
        if (weight) payload.weight = weight;
        if (original_price) payload.original_price = original_price;
        if (discount_badge) payload.discount_badge = discount_badge;

        // 1. Insert Item
        const { data: newItem, error: insertError } = await supabase
            .from(table)
            .insert(payload)
            .select()
            .single();

        if (insertError) throw insertError;

        // 2. Insert Junction
        const { error: junctionError } = await supabase
            .from(junctionTable)
            .insert({
                menu_item_id: newItem.id,
                property_id: propertyId
            });

        if (junctionError) {
            // Cleanup item if junction fails?
            console.error('Junction insert failed:', junctionError);
            // return NextResponse.json({ error: 'Item created but property link failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, item: { ...newItem, type } });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

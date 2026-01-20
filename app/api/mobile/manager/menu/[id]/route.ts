import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { verifyManagerAccess } from '../../utils';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const type = searchParams.get('type'); // 'food' or 'bar'

        if (!propertyId || !type) return NextResponse.json({ error: 'Property ID and Type required' }, { status: 400 });

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();
        const table = type === 'bar' ? 'bar_menu_items' : 'menu_items';
        const junctionTable = type === 'bar' ? 'bar_menu_item_properties' : 'menu_item_properties';

        // Check if item exists and belongs to property
        // We check the junction table first
        const { data: link } = await supabase
            .from(junctionTable)
            .select('*')
            .eq('menu_item_id', params.id)
            .eq('property_id', propertyId)
            .single();

        if (!link) {
            return NextResponse.json({ error: 'Item not found in this property' }, { status: 404 });
        }

        // Delete from Junction first (if no cascade)
        await supabase
            .from(junctionTable)
            .delete()
            .eq('menu_item_id', params.id)
            .eq('property_id', propertyId);

        // Delete Item?
        // Only if it's not used by other properties? 
        // For now, let's assume items are 1:1 copies per property (from wizard logic).
        // The wizard logic says: "Create a separate item copy for EACH selected property".
        // So safe to delete the item itself.
        
        const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('id', params.id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { 
            propertyId, type, name, description, category, price, 
            image_url, is_available, ingredients, dietary_info, 
            weight, original_price, discount_badge 
        } = body;

        if (!propertyId || !type) return NextResponse.json({ error: 'Property ID and Type required' }, { status: 400 });

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();
        const table = type === 'bar' ? 'bar_menu_items' : 'menu_items';
        const junctionTable = type === 'bar' ? 'bar_menu_item_properties' : 'menu_item_properties';

        // Verify Access
        const { data: link } = await supabase
            .from(junctionTable)
            .select('*')
            .eq('menu_item_id', params.id)
            .eq('property_id', propertyId)
            .single();

        if (!link) {
            return NextResponse.json({ error: 'Item not found in this property' }, { status: 404 });
        }

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (category !== undefined) updates.category = category;
        if (price !== undefined) updates.price = price;
        if (image_url !== undefined) updates.image_url = image_url;
        if (is_available !== undefined) updates.is_available = is_available;
        if (ingredients !== undefined) updates.ingredients = ingredients;
        if (dietary_info !== undefined) updates.dietary_info = dietary_info;
        if (weight !== undefined) updates.weight = weight;
        if (original_price !== undefined) updates.original_price = original_price;
        if (discount_badge !== undefined) updates.discount_badge = discount_badge;

        const { error: updateError } = await supabase
            .from(table)
            .update(updates)
            .eq('id', params.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

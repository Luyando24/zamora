import { NextRequest, NextResponse } from 'next/server';
import { verifyManagerAccess } from '../../utils';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { propertyId, name, description, capacity, base_price, image_url } = body;

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();
        
        // Verify ownership
        const { data: existing } = await supabase.from('room_types').select('property_id').eq('id', id).single();
        if (!existing || existing.property_id !== propertyId) {
             return NextResponse.json({ error: 'Table Type not found or access denied' }, { status: 404 });
        }

        const updates: any = {};
        if (name) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (capacity !== undefined) updates.capacity = capacity;
        if (base_price !== undefined) updates.base_price = base_price;
        if (image_url !== undefined) updates.image_url = image_url;

        const { data: type, error } = await supabase
            .from('room_types')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(type);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');

        const access = await verifyManagerAccess(req, propertyId || '');
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();

        // Verify ownership
        const { data: existing } = await supabase.from('room_types').select('property_id').eq('id', id).single();
        if (!existing || existing.property_id !== propertyId) {
             return NextResponse.json({ error: 'Table Type not found or access denied' }, { status: 404 });
        }

        const { error } = await supabase
            .from('room_types')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

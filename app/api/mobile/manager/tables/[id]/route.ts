import { NextRequest, NextResponse } from 'next/server';
import { verifyManagerAccess } from '../../utils';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { propertyId, room_number, room_type_id, status, notes } = body;

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();
        
        // Verify the table belongs to the property
        const { data: existing } = await supabase.from('rooms').select('property_id').eq('id', id).single();
        if (!existing || existing.property_id !== propertyId) {
             return NextResponse.json({ error: 'Table not found or access denied' }, { status: 404 });
        }

        const updates: any = {};
        if (room_number) updates.room_number = room_number;
        if (room_type_id) updates.room_type_id = room_type_id;
        if (status) updates.status = status;
        if (notes !== undefined) updates.notes = notes;

        const { data: table, error } = await supabase
            .from('rooms')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(table);
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

        // Verify the table belongs to the property
        const { data: existing } = await supabase.from('rooms').select('property_id').eq('id', id).single();
        if (!existing || existing.property_id !== propertyId) {
             return NextResponse.json({ error: 'Table not found or access denied' }, { status: 404 });
        }

        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffAccess, verifyManagerAccess } from '../../utils';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        
        const access = await verifyStaffAccess(req, propertyId || '');
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();
        const { data: table, error } = await supabase
            .from('rooms')
            .select('*, room_types!inner(name, category)')
            .eq('id', params.id)
            .single();

        if (error) throw error;

        // Fetch active orders for this specific table to determine status
        const [{ data: foodOrders }, { data: barOrders }] = await Promise.all([
            supabase.from('orders')
                .select('id')
                .eq('property_id', table.property_id)
                .eq('table_number', table.room_number)
                .not('status', 'in', '("cancelled", "pos_completed")')
                .neq('payment_status', 'paid')
                .limit(1),
            supabase.from('bar_orders')
                .select('id')
                .eq('property_id', table.property_id)
                .eq('table_number', table.room_number)
                .not('status', 'in', '("cancelled", "pos_completed")')
                .neq('payment_status', 'paid')
                .limit(1)
        ]);

        const isOccupied = (foodOrders?.length || 0) > 0 || (barOrders?.length || 0) > 0;

        return NextResponse.json({
            ...table,
            status: isOccupied ? 'occupied' : 'available'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { propertyId, room_number, room_type_id, status, notes, qr_url } = body;

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from('rooms')
            .update({
                room_number: room_number === '' ? null : room_number,
                room_type_id,
                status,
                notes,
                qr_url: qr_url === '' ? null : qr_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');

        const access = await verifyManagerAccess(req, propertyId || '');
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

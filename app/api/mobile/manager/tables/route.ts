import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffAccess, verifyManagerAccess } from '../utils';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        
        const access = await verifyStaffAccess(req, propertyId || '');
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();
        const { data: tables, error } = await supabase
            .from('rooms')
            .select('*, room_types!inner(name, category)')
            .eq('property_id', propertyId)
            .eq('room_types.category', 'table')
            .order('room_number');

        if (error) throw error;

        // Fetch active orders to determine table status dynamically
        // An "occupied" table has an ongoing or delivered order that isn't paid/cancelled
        const [{ data: foodOrders }, { data: barOrders }] = await Promise.all([
            supabase.from('orders')
                .select('table_number')
                .eq('property_id', propertyId)
                .not('status', 'in', '("cancelled", "pos_completed")')
                .neq('payment_status', 'paid'),
            supabase.from('bar_orders')
                .select('table_number')
                .eq('property_id', propertyId)
                .not('status', 'in', '("cancelled", "pos_completed")')
                .neq('payment_status', 'paid')
        ]);

        const occupiedTables = new Set([
            ...(foodOrders || []).map(o => String(o.table_number)),
            ...(barOrders || []).map(o => String(o.table_number))
        ]);

        const enrichedTables = tables.map(table => ({
            ...table,
            status: occupiedTables.has(String(table.room_number)) ? 'occupied' : 'available'
        }));

        return NextResponse.json(enrichedTables);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { propertyId, room_number, room_type_id, status, notes, qr_url } = body;

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        if (!room_number || !room_type_id) {
            return NextResponse.json({ error: 'Room number and type are required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data: table, error } = await supabase
            .from('rooms')
            .insert({
                property_id: propertyId,
                room_number,
                room_type_id,
                status: status || 'available',
                notes,
                qr_url
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(table);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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

        let finalRoomNumber = room_number;
        if (!finalRoomNumber && qr_url) {
             try {
                 const urlObj = new URL(qr_url);
                 finalRoomNumber = urlObj.searchParams.get('table') || urlObj.searchParams.get('room');
             } catch (e) {
                 // ignore
             }
        }

        if ((!finalRoomNumber && !qr_url) || !room_type_id) {
            return NextResponse.json({ error: 'Either Room number or QR URL is required, along with type' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        
        // Check if table already exists to avoid duplicate constraint error
        let existingTable = null;
        if (finalRoomNumber) {
            const { data } = await supabase
                .from('rooms')
                .select('id')
                .eq('property_id', propertyId)
                .eq('room_number', finalRoomNumber)
                .single();
            existingTable = data;
        }

        let data, error;

        if (existingTable) {
             // Update existing table instead of failing
             const result = await supabase
                .from('rooms')
                .update({
                    room_type_id,
                    status: status || 'available',
                    notes,
                    qr_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingTable.id)
                .select()
                .single();
             data = result.data;
             error = result.error;
        } else {
            // Insert new table
            const result = await supabase
                .from('rooms')
                .insert({
                    property_id: propertyId,
                    room_number: finalRoomNumber || null,
                    room_type_id,
                    status: status || 'available',
                    notes,
                    qr_url
                })
                .select()
                .single();
            data = result.data;
            error = result.error;
        }

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

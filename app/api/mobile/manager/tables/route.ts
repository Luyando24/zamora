import { NextRequest, NextResponse } from 'next/server';
import { verifyManagerAccess } from '../utils';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        
        const access = await verifyManagerAccess(req, propertyId || '');
        if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

        const supabase = getSupabaseAdmin();
        const { data: tables, error } = await supabase
            .from('rooms')
            .select('*, room_types(name)')
            .eq('property_id', propertyId)
            .order('room_number');

        if (error) throw error;

        return NextResponse.json(tables);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { propertyId, room_number, room_type_id, status, notes } = body;

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

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
                status: status || 'clean',
                notes
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(table);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

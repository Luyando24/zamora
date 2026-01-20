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
        const { data: types, error } = await supabase
            .from('room_types')
            .select('*')
            .eq('property_id', propertyId)
            .order('name');

        if (error) throw error;

        return NextResponse.json(types);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

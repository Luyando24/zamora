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
        const { data: types, error } = await supabase
            .from('room_types')
            .select('*')
            .eq('property_id', propertyId)
            .eq('category', 'table')
            .order('name');

        if (error) throw error;

        return NextResponse.json(types);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { propertyId, name, description, capacity, base_price, image_url } = body;

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data: type, error } = await supabase
            .from('room_types')
            .insert({
                property_id: propertyId,
                name,
                description,
                capacity: capacity || 4,
                base_price: base_price || 0,
                image_url,
                category: 'table'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(type);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyManagerAccess } from '../utils';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        
        const access = await verifyManagerAccess(req, propertyId || '');
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();
        const { data: methods, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('property_id', propertyId)
            .order('name');

        if (error) throw error;

        return NextResponse.json(methods);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { propertyId, name } = body;

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data: method, error } = await supabase
            .from('payment_methods')
            .insert({
                property_id: propertyId,
                name,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(method);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

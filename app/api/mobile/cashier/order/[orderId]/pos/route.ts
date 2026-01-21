import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

async function validateUser(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);

    if (error || !user) return null;
    return user;
}

export async function POST(
    req: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const user = await validateUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId } = params;
        const body = await req.json();
        const { type } = body;

        if (!type || (type !== 'food' && type !== 'bar')) {
            return NextResponse.json({ error: 'Valid type (food/bar) is required' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();

        // Check role
        const { data: profile } = await admin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['cashier', 'admin', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const table = type === 'food' ? 'orders' : 'bar_orders';

        const { error: updateError } = await admin
            .from(table)
            .update({ status: 'pos_completed' })
            .eq('id', orderId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: 'Order marked as pos_completed' });

    } catch (error: any) {
        console.error('POS Registration Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

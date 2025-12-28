import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { notifyAdmin } from '@/lib/sms';

export const dynamic = 'force-dynamic';

// Helper to validate auth
async function validateUser(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;
    
    const token = authHeader.replace('Bearer ', '');
    // Using admin client to verify allows checking any valid token without RLS constraints on the user table itself
    // though getUser() just validates the JWT signature and expiration.
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
    
    if (error || !user) return null;
    return user;
}

export async function PATCH(
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
        const { status, type } = body;

        if (!status || !type) {
            return NextResponse.json({ error: 'Status and type are required' }, { status: 400 });
        }

        if (type !== 'food' && type !== 'bar') {
            return NextResponse.json({ error: 'Invalid type (food/bar)' }, { status: 400 });
        }

        const table = type === 'food' ? 'orders' : 'bar_orders';
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Update the order
        const { data: order, error: updateError } = await supabaseAdmin
            .from(table)
            .update({ status })
            .eq('id', orderId)
            .select() // Select to get the updated record (and verify it existed)
            .single();

        if (updateError) {
            console.error('Update Error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 2. Send SMS Notification (if phone exists)
        if (order.guest_phone) {
            const statusMessages: Record<string, string> = {
                preparing: type === 'food' 
                    ? `Your order is being prepared! 👨‍🍳` 
                    : `Your drink is being prepared! 🍹`,
                ready: type === 'food'
                    ? `Your order is ready! 🎉`
                    : `Your drink is ready! 🥂`,
                delivered: type === 'food'
                    ? `Your order has been delivered. Enjoy! 🍽️`
                    : `Your drink has been delivered. Cheers! 🍻`,
                cancelled: `Your order has been cancelled. Please contact staff.`
            };

            const msg = statusMessages[status];
            if (msg) {
                // Fire and forget SMS to avoid blocking response
                notifyAdmin(`Zamora: ${msg}`, order.guest_phone)
                    .catch(err => console.error('Failed to send SMS:', err));
            }
        }

        return NextResponse.json({ success: true, order });

    } catch (error: any) {
        console.error('Update Order Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const user = await validateUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId } = params;
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        if (!type || (type !== 'food' && type !== 'bar')) {
            return NextResponse.json({ error: 'Valid type (food/bar) is required' }, { status: 400 });
        }

        const table = type === 'food' ? 'orders' : 'bar_orders';
        const supabaseAdmin = getSupabaseAdmin();

        const { error } = await supabaseAdmin
            .from(table)
            .delete()
            .eq('id', orderId);

        if (error) {
            console.error('Delete Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete Order Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

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
        const { status, type = 'food' } = body;

        const allowedStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
        if (!status || !allowedStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();

        // Check role
        const { data: profile } = await admin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['chef', 'admin', 'manager', 'waiter'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const table = type === 'bar' ? 'bar_orders' : 'orders';

        const { error: updateError } = await admin
            .from(table)
            .update({ status })
            .eq('id', orderId);

        if (updateError) throw updateError;

        // Update Table Status to 'occupied' when any active status is set
        const activeStatuses = ['pending', 'preparing', 'ready', 'delivered'];
        if (activeStatuses.includes(status)) {
            const { data: order } = await admin
                .from(table)
                .select('table_number, property_id')
                .eq('id', orderId)
                .single();

            if (order && order.table_number) {
                await admin
                    .from('rooms')
                    .update({ status: 'occupied' })
                    .eq('property_id', order.property_id)
                    .eq('room_number', order.table_number);
            }
        } else if (status === 'cancelled') {
            // Check if there are other active orders for this table before marking as available
            const { data: order } = await admin
                .from(table)
                .select('table_number, property_id')
                .eq('id', orderId)
                .single();
            
            if (order && order.table_number) {
                const [{ count: foodCount }, { count: barCount }] = await Promise.all([
                    admin.from('orders')
                        .select('id', { count: 'exact', head: true })
                        .eq('property_id', order.property_id)
                        .eq('table_number', order.table_number)
                        .neq('id', orderId)
                        .not('status', 'in', '("cancelled", "pos_completed")')
                        .neq('payment_status', 'paid'),
                    admin.from('bar_orders')
                        .select('id', { count: 'exact', head: true })
                        .eq('property_id', order.property_id)
                        .eq('table_number', order.table_number)
                        .neq('id', orderId)
                        .not('status', 'in', '("cancelled", "pos_completed")')
                        .neq('payment_status', 'paid')
                ]);

                if ((foodCount || 0) === 0 && (barCount || 0) === 0) {
                    await admin
                        .from('rooms')
                        .update({ status: 'available' })
                        .eq('property_id', order.property_id)
                        .eq('room_number', order.table_number);
                }
            }
        }

        // Optional: Trigger SMS notification (similar to web)
        // We'll skip for now to keep the API fast, as the web dashboard handles it on status change.
        // But if the mobile app is the only thing changing it, we might need it.
        // Actually, it's better to stay consistent.

        return NextResponse.json({ success: true, message: `Order status updated to ${status}` });

    } catch (error: any) {
        console.error('Chef Status Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { notifyAdmin } from '@/lib/sms';

export const dynamic = 'force-dynamic';

// Helper to validate auth
async function validateUser(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
        console.log('[API] validateUser: Missing Authorization header');
        return null;
    }
    
    const token = authHeader.replace('Bearer ', '').trim();
    // Using admin client to verify allows checking any valid token without RLS constraints on the user table itself
    // though getUser() just validates the JWT signature and expiration.
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
    
    if (error) {
        console.error('[API] validateUser: getUser error:', error.message);
        return null;
    }
    if (!user) {
        console.error('[API] validateUser: No user returned');
        return null;
    }
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
        const { status, type, waiter_name, formData } = body;

        // Type is always required to know which table to query
        if (!type || (type !== 'food' && type !== 'bar')) {
            return NextResponse.json({ error: 'Valid type (food/bar) is required' }, { status: 400 });
        }

        // Must provide at least one field to update
        if (!status && !waiter_name) {
             return NextResponse.json({ error: 'Status or waiter_name is required' }, { status: 400 });
        }

        const table = type === 'food' ? 'orders' : 'bar_orders';
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Prepare updates
        const updates: any = {};
        if (status) updates.status = status;
        if (waiter_name) updates.waiter_name = waiter_name;
        
        // Handle formData update if provided (shallow merge or replace?)
        // Ideally we fetch first, but for now let's assume if provided we might want to update it.
        // But simply replacing it might lose other data.
        // Let's rely on waiter_name column primarily. 
        // If formData is sent, we can try to update it if we are careful.
        // For assignOrder, it sends formData: { waiterName: ... }.
        // We should probably merge it.
        
        // 1.1 Fetch current order to check/merge data
        const { data: currentOrder } = await supabaseAdmin
            .from(table)
            .select('waiter_name, property_id, formData')
            .eq('id', orderId)
            .single();

        if (currentOrder) {
             // If we are updating waiter_name explicitly (Assign Order)
             if (waiter_name) {
                 updates.waiter_name = waiter_name;
                 
                 // Merge formData
                 const currentFormData = currentOrder.formData || {};
                 updates.formData = {
                     ...currentFormData,
                     waiterName: waiter_name, // Sync with column
                     notes: currentFormData.notes || `(Waiter: ${waiter_name})` // Legacy support
                 };
             }

             // Auto-claim logic (only if NOT explicitly assigning to someone else)
             // i.e. if we are just setting status='delivered' and no waiter_name provided
             if (status === 'delivered' && !waiter_name) {
                 // Fetch user profile
                 const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', user.id)
                    .single();
    
                 if (profile) {
                      const currentWaiterName = currentOrder.waiter_name;
                      const newWaiterName = `${profile.first_name} ${profile.last_name}`.trim();
    
                      // Claim if unassigned
                      const isUnassigned = !currentWaiterName || 
                                           currentWaiterName === 'Unassigned' || 
                                           currentWaiterName === 'n/a' ||
                                           currentWaiterName.toLowerCase().includes('table') ||
                                           currentWaiterName.toLowerCase().includes('walk-in');
    
                      if (isUnassigned) {
                          updates.waiter_name = newWaiterName;
                          // Update formData as well
                          const currentFormData = currentOrder.formData || {};
                          updates.formData = {
                               ...currentFormData,
                               waiterName: newWaiterName
                          };
                      }
                 }
             }
        }

        // 2. Update the order
        const { data: order, error: updateError } = await supabaseAdmin
            .from(table)
            .update(updates)
            .eq('id', orderId)
            .select() 
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

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { notifyAdmin } from '@/lib/sms';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { barCart, formData, propertyId } = body;

    if (!barCart || barCart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Use Admin Client to bypass RLS
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Calculate Totals
    const barTotal = barCart.reduce((sum: number, i: any) => sum + (i.price || i.base_price) * i.quantity, 0);
    const barServiceCharge = barTotal * 0.10;
    const barGrandTotal = barTotal + barServiceCharge;
    const barOrderId = crypto.randomUUID();

    // 2. Insert Bar Order
    const { error: orderError } = await supabaseAdmin
      .from('bar_orders')
      .insert({
        id: barOrderId,
        property_id: propertyId,
        status: 'pending',
        total_amount: barGrandTotal,
        payment_method: formData.paymentMethod,
        guest_name: formData.name,
        guest_phone: formData.phone,
        guest_room_number: formData.roomNumber,
        notes: formData.notes,
      });

    if (orderError) {
      console.error('Error inserting bar order:', orderError);
      return NextResponse.json({ error: 'Failed to create order: ' + orderError.message }, { status: 500 });
    }

    // 3. Prepare Bar Order Items
    const orderItems = barCart.map((item: any) => ({
      order_id: barOrderId,
      bar_menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price || item.base_price,
      total_price: (item.price || item.base_price) * item.quantity,
      notes: item.selectedOptions?.join(', '),
      // Snapshot fields
      item_name: item.name,
      item_description: item.description,
      item_ingredients: item.ingredients,
      item_image_url: item.image_url,
      weight: item.weight,
      options: item.selectedOptions ? JSON.stringify(item.selectedOptions) : JSON.stringify([])
    }));

    // 4. Insert Bar Order Items
    const { error: itemsError } = await supabaseAdmin
      .from('bar_order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error inserting bar order items:', itemsError);
      // Note: In a real scenario, we might want to delete the order if items fail, or use a transaction if possible.
      return NextResponse.json({ error: 'Failed to create order items: ' + itemsError.message }, { status: 500 });
    }

    // 5. Send SMS Notification
    try {
      const { data: property } = await supabaseAdmin
        .from('properties')
        .select('admin_notification_phone')
        .eq('id', propertyId)
        .single();

      const message = `New Bar Order #${barOrderId.slice(0, 8)} from Room ${formData.roomNumber || 'N/A'}. Total: ${barGrandTotal}`;
      await notifyAdmin(message, property?.admin_notification_phone);
    } catch (smsError) {
      console.error('Failed to send SMS notification:', smsError);
    }

    return NextResponse.json({ 
      success: true, 
      orderId: barOrderId 
    });

  } catch (error: any) {
    console.error('Error processing bar order:', error);
    return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}

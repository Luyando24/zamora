import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { notifyAdmin } from '@/lib/sms';
import { sendPushNotificationToProperty } from '@/lib/push-notifications';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle wrapped 'order' payload structure
    const payload = body.order ? body.order : body;
    const { foodCart, barCart, formData: rawFormData, propertyId } = payload;
    
    // Ensure formData is at least an empty object to prevent crashes
    // Also try to parse if it's a string (common in multipart/form-data conversions or weird clients)
    let formData = rawFormData;
    if (typeof formData === 'string') {
        try {
            formData = JSON.parse(formData);
        } catch (e) {
            console.error('Failed to parse formData string:', e);
            formData = {};
        }
    }
    formData = formData || {};

    // Extract fields with multiple possible keys
    const tableNumber = formData.tableNumber || formData.table_number || formData.table || formData.tableNo;
    const roomNumber = formData.roomNumber || formData.room_number || formData.room;
    let waiterName = formData.waiterName || formData.waiter_name || formData.waiter;

    // Fallback: Try to get waiter from Auth Token if not in payload
    if (!waiterName) {
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            // Use admin client to verify token and get user
            const { data: { user } } = await getSupabaseAdmin().auth.getUser(token);
            
            if (user) {
                const { data: profile } = await getSupabaseAdmin()
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', user.id)
                    .single();
                    
                if (profile) {
                    waiterName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                }
            }
        }
    }

    // Append waiter name to notes if present (avoid duplicates)
    let finalNotes = formData.notes || '';
    if (waiterName) {
      const waiterString = `(Waiter: ${waiterName})`;
      // Check if the note already contains this waiter string to prevent duplication
      if (!finalNotes.includes(waiterString)) {
        finalNotes = finalNotes ? `${finalNotes}\n${waiterString}` : waiterString;
      }
    }

    console.log('Mobile Order Received Body:', JSON.stringify(body, null, 2));
    console.log('Parsed Payload:', JSON.stringify({ 
        hasFood: foodCart?.length, 
        hasBar: barCart?.length, 
        propertyId, 
        formData 
    }, null, 2));

    if ((!foodCart || foodCart.length === 0) && (!barCart || barCart.length === 0)) {
      console.error('Mobile Order Error: Cart is empty. Received keys:', Object.keys(body));
      return NextResponse.json({ 
        error: 'Cart is empty',
        details: 'Request must contain foodCart or barCart arrays with items.',
        receivedPayload: {
          keys: Object.keys(body),
          innerKeys: body.order ? Object.keys(body.order) : undefined,
          hasFoodCart: !!foodCart,
          foodCartLength: foodCart?.length,
          hasBarCart: !!barCart,
          barCartLength: barCart?.length
        }
      }, { status: 400 });
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Use Admin Client to bypass RLS and ensure reliability
    const supabaseAdmin = getSupabaseAdmin();

    // Determine location string
    const locationString = tableNumber 
        ? `Table ${tableNumber}` 
        : (roomNumber || 'Walk-in / Unknown');

    const newOrderIds: string[] = [];
    const errors: string[] = [];

    // --- 1. Process Food Order ---
    if (foodCart && foodCart.length > 0) {
      try {
        const foodTotal = foodCart.reduce((sum: number, i: any) => sum + (i.price || i.base_price) * i.quantity, 0);
        const foodServiceCharge = foodTotal * 0.10;
        const foodGrandTotal = foodTotal + foodServiceCharge;
        const foodOrderId = crypto.randomUUID();

        // Helper to get item name safely
        const getItemName = (i: any) => i.name || i.item_name || i.title || i.menuItem?.name || 'Unknown Item';

        // Insert Order
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .insert({
            id: foodOrderId,
            property_id: propertyId,
            status: 'pending',
            total_amount: foodGrandTotal,
            payment_method: formData.paymentMethod,
            guest_name: formData.name,
            guest_phone: formData.phone,
            guest_room_number: locationString,
            table_number: tableNumber ? String(tableNumber) : null, // NEW: Dedicated column
            waiter_name: waiterName || null, // NEW: Dedicated column
            notes: finalNotes,
            // Snapshot fields
            item_name: foodCart.map((i: any) => `${i.quantity}x ${getItemName(i)}`).join(', '),
            item_description: foodCart.map((i: any) => i.description).filter(Boolean).join('; '),
            item_ingredients: foodCart.map((i: any) => i.ingredients).filter(Boolean).join('; '),
            item_image_url: foodCart[0]?.image_url,
            weight: foodCart.map((i: any) => i.weight).filter(Boolean).join(', '),
            category: foodCart[0]?.category,
            options: JSON.stringify(foodCart.flatMap((i: any) => i.selectedOptions || [])),
            extras: JSON.stringify([])
          });

        if (orderError) throw orderError;

        // Insert Items
        const orderItems = foodCart.map((item: any) => ({
          order_id: foodOrderId,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price || item.base_price,
          total_price: (item.price || item.base_price) * item.quantity,
          notes: item.selectedOptions?.join(', '),
          // Snapshot fields
          item_name: getItemName(item),
          item_description: item.description,
          item_ingredients: item.ingredients,
          item_image_url: item.image_url,
          weight: item.weight,
          category: item.category,
          options: item.selectedOptions ? JSON.stringify(item.selectedOptions) : JSON.stringify([])
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        newOrderIds.push(foodOrderId);

        // Notifications
        const message = `New Food Order #${foodOrderId.slice(0, 8)} from ${locationString || 'N/A'}. Total: K${foodGrandTotal}`;
        
        // SMS (Fire and forget)
        notifyAdmin(message, undefined).catch(e => console.error('SMS Error:', e));

        // Push
        sendPushNotificationToProperty(
            propertyId,
            'New Food Order 🍔',
            message,
            `/dashboard/orders?propertyId=${propertyId}`
        ).catch(e => console.error('Push Error:', e));

      } catch (err: any) {
        console.error('Food Order Failed:', err);
        errors.push(`Food Order Failed: ${err.message}`);
      }
    }

    // --- 2. Process Bar Order ---
    if (barCart && barCart.length > 0) {
      try {
        const barTotal = barCart.reduce((sum: number, i: any) => sum + (i.price || i.base_price) * i.quantity, 0);
        const barServiceCharge = barTotal * 0.10;
        const barGrandTotal = barTotal + barServiceCharge;
        const barOrderId = crypto.randomUUID();

        // Helper to get item name safely
        const getItemName = (i: any) => i.name || i.item_name || i.title || i.menuItem?.name || 'Unknown Item';

        // Insert Order
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
            guest_room_number: locationString,
            table_number: tableNumber ? String(tableNumber) : null, // NEW: Dedicated column
            waiter_name: waiterName || null, // NEW: Dedicated column
            notes: finalNotes,
          });

        if (orderError) throw orderError;

        // Insert Items
        const orderItems = barCart.map((item: any) => ({
          order_id: barOrderId,
          bar_menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price || item.base_price,
          total_price: (item.price || item.base_price) * item.quantity,
          notes: item.selectedOptions?.join(', '),
          // Snapshot fields
          item_name: getItemName(item),
          item_description: item.description,
          item_ingredients: item.ingredients,
          item_image_url: item.image_url,
          weight: item.weight,
          options: item.selectedOptions ? JSON.stringify(item.selectedOptions) : JSON.stringify([])
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('bar_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        newOrderIds.push(barOrderId);

        // Notifications
        const { data: property } = await supabaseAdmin
            .from('properties')
            .select('admin_notification_phone')
            .eq('id', propertyId)
            .single();

        const message = `New Bar Order #${barOrderId.slice(0, 8)} from ${locationString || 'N/A'}. Total: K${barGrandTotal}`;
        
        notifyAdmin(message, property?.admin_notification_phone).catch(e => console.error('SMS Error:', e));

        sendPushNotificationToProperty(
            propertyId,
            'New Bar Order 🍸',
            message,
            `/dashboard/bar-orders?propertyId=${propertyId}`
        ).catch(e => console.error('Push Error:', e));

      } catch (err: any) {
        console.error('Bar Order Failed:', err);
        errors.push(`Bar Order Failed: ${err.message}`);
      }
    }

    if (newOrderIds.length === 0 && errors.length > 0) {
        return NextResponse.json({ error: 'All orders failed', details: errors }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        orderIds: newOrderIds,
        errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Mobile Order Error:', error);
    console.error('Stack Trace:', error.stack);
    return NextResponse.json({ 
        error: error.message || 'Internal Server Error',
        stack: error.stack, // Include stack for debugging
        details: 'Check server logs for full trace'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const waiterName = searchParams.get('waiterName');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const limit = 50;

    // Build query for Food Orders
    let foodQuery = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id, quantity, unit_price, total_price, item_name
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (waiterName) {
      foodQuery = foodQuery.or(`waiter_name.eq."${waiterName}",notes.ilike."%Waiter: ${waiterName}%"`);
    }

    // Build query for Bar Orders
    let barQuery = supabaseAdmin
      .from('bar_orders')
      .select(`
        *,
        bar_order_items (
          id, quantity, unit_price, total_price, item_name
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (waiterName) {
      barQuery = barQuery.or(`waiter_name.eq."${waiterName}",notes.ilike."%Waiter: ${waiterName}%"`);
    }

    // Execute in parallel
    const [foodRes, barRes] = await Promise.all([foodQuery, barQuery]);

    if (foodRes.error) throw foodRes.error;
    if (barRes.error) throw barRes.error;

    // Helper to get table number (prefer new column, fallback to parsing)
    const getTableNumber = (order: any) => {
      if (order.table_number) return order.table_number;
      
      const location = order.guest_room_number || '';
      if (location.toLowerCase().startsWith('table ')) {
        return location.substring(6).trim();
      }
      return location;
    };

    // Helper to get waiter name (prefer new column, fallback to parsing notes)
    const getWaiterName = (order: any) => {
      if (order.waiter_name) return order.waiter_name;
      
      const notes = order.notes || '';
      const match = notes.match(/\(Waiter: (.*?)\)/);
      return match ? match[1] : '';
    };

    // Combine and Sort
    const foodOrders = (foodRes.data || []).map((o: any) => ({ 
      ...o, 
      type: 'food',
      table_number: getTableNumber(o),
      waiter_name: getWaiterName(o)
    }));
    const barOrders = (barRes.data || []).map((o: any) => ({ 
      ...o, 
      type: 'bar',
      table_number: getTableNumber(o),
      waiter_name: getWaiterName(o)
    }));

    const allOrders = [...foodOrders, ...barOrders].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      orders: allOrders
    });

  } catch (error: any) {
    console.error('Get Orders Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}

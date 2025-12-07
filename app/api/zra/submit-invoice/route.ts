import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase Admin Client (to bypass RLS for system updates if needed, 
// but strictly we should use the user's session. 
// For API routes, we might use a service role key if it's a background process, 
// but here it's triggered by user. We should use the auth header.)

// For this boilerplate, I'll use the public client but in real prod we check auth.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Use Service Role for writing ZRA fields if they are protected

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { folioId } = await req.json();

    if (!folioId) {
      return NextResponse.json({ error: 'Folio ID is required' }, { status: 400 });
    }

    // 1. Fetch Folio and Items
    const { data: folio, error: folioError } = await supabase
      .from('folios')
      .select('*, folio_items(*)')
      .eq('id', folioId)
      .single();

    if (folioError || !folio) {
      return NextResponse.json({ error: 'Folio not found' }, { status: 404 });
    }

    if (folio.status === 'paid' && folio.zra_mark_id) {
       return NextResponse.json({ message: 'Folio already fiscalized', markId: folio.zra_mark_id });
    }

    // 2. Construct ZRA Payload (Mock)
    const zraPayload = {
      tpin: "1000000000", // Should come from Hotel config
      invoice_number: folio.id,
      total_tax_amount: 0, // Calculate based on items
      total_amount: folio.total_amount,
      items: folio.folio_items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        total: item.total_price,
        tax_code: item.tax_category
      }))
    };

    // 3. Simulate ZRA VSDC Call
    // In production: const response = await fetch('https://vsdc.zra.org.zm/api...', ...)
    const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    await mockDelay(1000); // Simulate network latency

    const mockZraResponse = {
      result_code: "00", // Success
      result_msg: "Success",
      vsdc_rcpt_no: `ZRA-${uuidv4().substring(0, 8).toUpperCase()}`,
      internal_data: "SignedData...",
      qr_code: `https://vsdc.zra.org.zm/verify?id=${uuidv4()}`
    };

    // 4. Update Folio with ZRA details
    const { error: updateError } = await supabase
      .from('folios')
      .update({
        status: 'paid', // Assuming this finalizes payment too
        zra_mark_id: mockZraResponse.vsdc_rcpt_no,
        zra_qr_code: mockZraResponse.qr_code,
        zra_invoice_number: mockZraResponse.vsdc_rcpt_no
      })
      .eq('id', folioId);

    if (updateError) {
      throw new Error('Failed to update folio with ZRA details');
    }

    // 5. Log Transaction
    await supabase.from('zra_transactions').insert({
      hotel_id: folio.hotel_id,
      folio_id: folioId,
      request_payload: zraPayload,
      response_payload: mockZraResponse,
      status: 'success',
      vsdc_approval_code: mockZraResponse.vsdc_rcpt_no
    });

    return NextResponse.json({
      success: true,
      markId: mockZraResponse.vsdc_rcpt_no,
      qrCode: mockZraResponse.qr_code
    });

  } catch (error: any) {
    console.error('ZRA Submission Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

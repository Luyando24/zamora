import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('Payment Webhook Received:', payload);

    // Verify signature (Crucial in production)
    // const signature = req.headers.get('x-signature');
    // if (!verifySignature(payload, signature)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

    // Handle MTN MoMo Callback Structure (Example)
    // { externalId: '...', status: 'SUCCESSFUL', ... }
    
    const { externalId, status } = payload; // externalId is our folioId or txRef

    if (status === 'SUCCESSFUL') {
      // Find folio by ID (assuming externalId matches folioId for simplicity, or look up via txRef)
      // Update folio status
       const { error } = await supabase
        .from('folios')
        .update({ status: 'paid', payment_method: 'momo' }) // You might want to keep it 'open' until ZRA? Or 'paid' triggering ZRA?
        .eq('id', externalId);
      
       if (error) console.error('Error updating folio:', error);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

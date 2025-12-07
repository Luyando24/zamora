import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'ZMW', phoneNumber, provider, folioId } = await req.json();

    if (!amount || !phoneNumber || !provider || !folioId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a unique transaction reference
    const txRef = `ZAMORA-${uuidv4()}`;

    // Simulate calling Mobile Money Provider API (e.g., MTN MoMo Open API)
    // const response = await fetch('https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay', {
    //   method: 'POST',
    //   headers: { ... },
    //   body: JSON.stringify({
    //     amount,
    //     currency,
    //     externalId: folioId,
    //     payer: { partyIdType: 'MSISDN', partyId: phoneNumber },
    //     payerMessage: 'Payment for Hotel Stay',
    //     payeeNote: 'Thank you'
    //   })
    // });

    // Mock Response
    console.log(`Initiating ${provider} payment of ${currency} ${amount} for ${phoneNumber} (Ref: ${txRef})`);
    
    // In a real scenario, the provider returns "Pending" status and we wait for Webhook.
    // For this boilerplate, we'll simulate a successful initiation.
    
    return NextResponse.json({
      status: 'pending',
      message: 'Payment initiated. Please check your phone to confirm.',
      transactionReference: txRef,
      provider_response: {
        status: 'ACCEPTED' // MTN MoMo status
      }
    });

  } catch (error: any) {
    console.error('MoMo Payment Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

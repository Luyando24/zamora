import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { validateRequest, momoWebhookSchema } from '@/lib/api/validators';
import {
  createErrorResponse,
  createSuccessResponse,
  AuthenticationError
} from '@/lib/api/errors';
import {
  verifyHMACSignature,
  verifyTimestamp,
  extractIPAddress,
  verifyIPWhitelist
} from '@/lib/api/webhook-verify';
import { rateLimitByIdentifier, getRateLimitHeaders, RATE_LIMITS } from '@/lib/api/rate-limit';
import { logger, generateRequestId } from '@/lib/monitoring/logger';

// Configure webhook settings
const WEBHOOK_SECRET = process.env.MOMO_WEBHOOK_SECRET || 'your-webhook-secret-change-in-production';
const WEBHOOK_IP_WHITELIST = process.env.MOMO_WEBHOOK_IP_WHITELIST?.split(',') || [];

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const ip = extractIPAddress(req.headers);

  try {
    logger.logRequest('POST', '/api/payments/webhook', { requestId, ip });

    // 1. Rate limiting for webhooks
    const rateLimitResult = await rateLimitByIdentifier(
      `webhook:${ip}`,
      RATE_LIMITS.WEBHOOK
    );

    if (!rateLimitResult.success) {
      logger.warn('Webhook rate limit exceeded', { requestId, ip });
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // 2. IP Whitelist verification (if configured)
    if (WEBHOOK_IP_WHITELIST.length > 0) {
      const ipCheck = verifyIPWhitelist(ip, WEBHOOK_IP_WHITELIST);
      if (!ipCheck.valid) {
        logger.warn('Webhook from unauthorized IP', { requestId, ip });
        throw new AuthenticationError('Unauthorized webhook source');
      }
    }

    // 3. Get raw body for signature verification
    const rawBody = await req.text();
    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      logger.error('Invalid webhook payload JSON', e as Error, { requestId });
      return createErrorResponse(new Error('Invalid JSON payload'));
    }

    // 4. Verify webhook signature
    const signature = req.headers.get('x-signature') || req.headers.get('signature') || '';
    const timestamp = req.headers.get('x-timestamp') || req.headers.get('timestamp') || '';

    if (!signature) {
      logger.warn('Webhook missing signature', { requestId, ip });
      throw new AuthenticationError('Missing webhook signature');
    }

    // Verify signature
    const signatureResult = verifyHMACSignature(rawBody, signature, WEBHOOK_SECRET);
    if (!signatureResult.valid) {
      logger.warn('Invalid webhook signature', { requestId, ip, error: signatureResult.error });
      throw new AuthenticationError('Invalid webhook signature');
    }

    // Verify timestamp (prevent replay attacks)
    if (timestamp) {
      const timestampResult = verifyTimestamp(timestamp, 300); // 5 minute window
      if (!timestampResult.valid) {
        logger.warn('Invalid webhook timestamp', { requestId, ip, timestamp, error: timestampResult.error });
        throw new AuthenticationError('Invalid or expired webhook timestamp');
      }
    }

    logger.info('Webhook signature verified', { requestId, ip });

    // 5. Validate webhook payload
    const validation = validateRequest(momoWebhookSchema, payload);
    if (!validation.success) {
      return createErrorResponse(validation.errors);
    }

    const { externalId, status, amount, currency, financialTransactionId, reason } = validation.data;

    // 6. Process webhook asynchronously (return 200 immediately to acknowledge receipt)
    // In production, use a job queue (e.g., Vercel Background Functions, Bull, etc.)
    processWebhookAsync(requestId, validation.data).catch((error) => {
      logger.error('Async webhook processing failed', error, { requestId, externalId });
    });

    const duration = Date.now() - startTime;
    logger.logResponse('POST', '/api/payments/webhook', 200, duration, {
      requestId,
      externalId,
      status
    });

    // Return success immediately
    return createSuccessResponse(
      { received: true, requestId },
      200,
      {
        ...getRateLimitHeaders(rateLimitResult),
        'X-Request-ID': requestId,
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Webhook processing failed', error, { requestId, ip });
    logger.logResponse('POST', '/api/payments/webhook', error.statusCode || 500, duration, { requestId });

    return createErrorResponse(error);
  }
}

/**
 * Process webhook asynchronously
 * In production, this should be moved to a background job queue
 */
async function processWebhookAsync(requestId: string, data: any): Promise<void> {
  const { externalId, status, amount, currency, financialTransactionId, reason } = data;

  try {
    logger.info('Processing webhook payload', { requestId, externalId, status });

    const supabase = getSupabaseAdmin();

    if (status === 'SUCCESSFUL') {
      // Update folio status
      const { error: updateError, data: updatedFolio } = await supabase
        .from('folios')
        .update({
          status: 'paid',
          payment_method: 'momo',
          payment_reference: financialTransactionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', externalId)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to update folio after successful payment', updateError, {
          requestId,
          externalId
        });
        throw updateError;
      }

      logger.info('Folio marked as paid', { requestId, folioId: externalId });

      // TODO: Trigger ZRA invoice generation
      // TODO: Send payment confirmation email/SMS

    } else if (status === 'FAILED') {
      logger.warn('Payment failed', { requestId, externalId, reason });

      // Log failed payment attempt
      await supabase
        .from('payment_attempts')
        .insert({
          folio_id: externalId,
          status: 'failed',
          provider: 'momo',
          amount,
          currency,
          reason,
          created_at: new Date().toISOString(),
        });
    }

  } catch (error) {
    logger.error('Webhook async processing error', error as Error, { requestId, externalId });
    throw error;
  }
}

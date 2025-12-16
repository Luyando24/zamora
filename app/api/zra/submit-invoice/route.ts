import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { nanoid } from 'nanoid';
import { authenticateAndAuthorize, authorizeFolioAccess } from '@/lib/api/auth';
import { validateRequest, zraInvoiceSchema } from '@/lib/api/validators';
import {
  createErrorResponse,
  createSuccessResponse,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  ValidationError
} from '@/lib/api/errors';
import { rateLimitCombined, getRateLimitHeaders, RATE_LIMITS } from '@/lib/api/rate-limit';
import { logger, generateRequestId } from '@/lib/monitoring/logger';
import { extractIPAddress } from '@/lib/api/webhook-verify';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const ip = extractIPAddress(req.headers);

  try {
    logger.logRequest('POST', '/api/zra/submit-invoice', { requestId, ip });

    // 1. Authentication
    const authResult = await authenticateAndAuthorize(req);
    if (!authResult.success || !authResult.user) {
      throw new AuthenticationError(authResult.error);
    }

    const user = authResult.user;

    // 2. Rate limiting
    const rateLimitResult = await rateLimitCombined(ip, user.id, {
      ipConfig: RATE_LIMITS.STANDARD,
      userConfig: RATE_LIMITS.STANDARD,
    });

    if (!rateLimitResult.success) {
      logger.warn('ZRA rate limit exceeded', { requestId, ip, userId: user.id });
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // 3. Parse and validate request
    const body = await req.json();
    const validation = validateRequest(zraInvoiceSchema, body);

    if (!validation.success) {
      return createErrorResponse(validation.errors);
    }

    const { folioId } = validation.data;

    // 4. Verify user has access to this folio
    const folioAccess = await authorizeFolioAccess(user.id, folioId);
    if (!folioAccess.authorized) {
      throw new AuthorizationError(folioAccess.error || 'Access denied to this folio');
    }

    const supabase = getSupabaseAdmin();

    // 5. Fetch folio with items
    const { data: folio, error: folioError } = await supabase
      .from('folios')
      .select('*, folio_items(*)')
      .eq('id', folioId)
      .single();

    if (folioError || !folio) {
      if (folioError) {
        logger.error('Folio not found', folioError as Error, { requestId, folioId });
      }
      throw new NotFoundError('Folio not found');
    }

    // 6. Check if already fiscalized
    if (folio.status === 'paid' && folio.zra_mark_id) {
      logger.info('Folio already fiscalized', { requestId, folioId, markId: folio.zra_mark_id });
      return createSuccessResponse({
        success: true,
        message: 'Folio already fiscalized',
        markId: folio.zra_mark_id,
        qrCode: folio.zra_qr_code,
      });
    }

    // 7. Validate folio is ready for fiscalization
    if (folio.status !== 'paid') {
      throw new ConflictError('Folio must be paid before fiscalization');
    }

    if (!folio.folio_items || folio.folio_items.length === 0) {
      throw new ValidationError('Folio must have items before fiscalization');
    }

    logger.info('Initiating ZRA submission', {
      requestId,
      folioId,
      totalAmount: folio.total_amount,
      itemCount: folio.folio_items.length,
    });

    // 8. Construct ZRA payload
    // TODO: Fetch hotel TPIN from configuration
    const zraPayload = {
      tpin: process.env.ZRA_HOTEL_TPIN || '1000000000',
      invoice_number: folio.id,
      total_tax_amount: calculateTotalTax(folio.folio_items),
      total_amount: folio.total_amount,
      items: folio.folio_items.map((item: any) => ({
        description: item.description || 'Service',
        quantity: item.quantity || 1,
        total: item.total_price,
        tax_code: item.tax_category || 'A', // Default to standard VAT
      })),
    };

    // 9. Submit to ZRA VSDC
    // TODO: Implement actual ZRA API integration
    // const zraResponse = await submitToZRAVSDC(zraPayload);

    // Mock implementation for development
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network latency

    const mockZraResponse = {
      result_code: '00', // Success
      result_msg: 'Success',
      vsdc_rcpt_no: `ZRA-${nanoid(8).toUpperCase()}`,
      internal_data: 'SignedData...',
      qr_code: `https://vsdc.zra.org.zm/verify?id=${nanoid(16)}`,
      timestamp: new Date().toISOString(),
    };

    logger.info('ZRA submission successful', {
      requestId,
      folioId,
      markId: mockZraResponse.vsdc_rcpt_no,
    });

    // 10. Update folio with ZRA details
    const { error: updateError } = await supabase
      .from('folios')
      .update({
        zra_mark_id: mockZraResponse.vsdc_rcpt_no,
        zra_qr_code: mockZraResponse.qr_code,
        zra_invoice_number: mockZraResponse.vsdc_rcpt_no,
        zra_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', folioId);

    if (updateError) {
      logger.error('Failed to update folio with ZRA details', updateError, { requestId, folioId });
      throw new Error('Failed to update folio with ZRA details');
    }

    // 11. Log ZRA transaction
    await supabase.from('zra_transactions').insert({
      property_id: folio.property_id,
      folio_id: folioId,
      request_payload: zraPayload,
      response_payload: mockZraResponse,
      status: 'success',
      vsdc_approval_code: mockZraResponse.vsdc_rcpt_no,
      created_at: new Date().toISOString(),
      created_by: user.id,
    });

    const duration = Date.now() - startTime;
    logger.logResponse('POST', '/api/zra/submit-invoice', 200, duration, {
      requestId,
      folioId,
      markId: mockZraResponse.vsdc_rcpt_no,
    });

    return createSuccessResponse(
      {
        success: true,
        markId: mockZraResponse.vsdc_rcpt_no,
        qrCode: mockZraResponse.qr_code,
        timestamp: mockZraResponse.timestamp,
      },
      200,
      {
        ...getRateLimitHeaders(rateLimitResult),
        'X-Request-ID': requestId,
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('ZRA submission failed', error, { requestId, ip });
    logger.logResponse('POST', '/api/zra/submit-invoice', error.statusCode || 500, duration, { requestId });

    return createErrorResponse(error);
  }
}

/**
 * Calculate total tax from folio items
 */
function calculateTotalTax(items: any[]): number {
  // TODO: Implement proper tax calculation based on tax categories
  // For now, return 0 or implement a simple calculation
  return items.reduce((total, item) => {
    const taxRate = getTaxRate(item.tax_category);
    return total + (item.total_price * taxRate);
  }, 0);
}

/**
 * Get tax rate by category
 */
function getTaxRate(category: string): number {
  const rates: Record<string, number> = {
    'A': 0.16, // Standard VAT 16%
    'B': 0.0,  // Zero-rated
    'C': 0.0,  // Exempt
  };
  return rates[category] || 0.16;
}

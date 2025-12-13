import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { authenticateAndAuthorize } from '@/lib/api/auth';
import { validateRequest, paymentSchema } from '@/lib/api/validators';
import {
  createErrorResponse,
  createSuccessResponse,
  AuthenticationError,
  AuthorizationError
} from '@/lib/api/errors';
import { rateLimitCombined, getRateLimitHeaders, RATE_LIMITS } from '@/lib/api/rate-limit';
import { logger, generateRequestId } from '@/lib/monitoring/logger';
import { extractIPAddress } from '@/lib/api/webhook-verify';
import { authorizeFolioAccess } from '@/lib/api/auth';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const ip = extractIPAddress(req.headers);

  try {
    logger.logRequest('POST', '/api/payments/momo', { requestId, ip });

    // 1. Authentication
    const authResult = await authenticateAndAuthorize(req);
    if (!authResult.success || !authResult.user) {
      throw new AuthenticationError(authResult.error);
    }

    const user = authResult.user;

    // 2. Rate limiting (strict for payment endpoints)
    const rateLimitResult = await rateLimitCombined(ip, user.id, {
      ipConfig: RATE_LIMITS.PAYMENT,
      userConfig: RATE_LIMITS.PAYMENT,
    });

    if (!rateLimitResult.success) {
      logger.warn('Payment rate limit exceeded', { requestId, ip, userId: user.id });
      return NextResponse.json(
        { error: 'Too many payment requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const validation = validateRequest(paymentSchema, body);

    if (!validation.success) {
      return createErrorResponse(validation.errors);
    }

    const { amount, currency, phoneNumber, provider, folioId } = validation.data;

    // 4. Verify user has access to this folio
    const folioAccess = await authorizeFolioAccess(user.id, folioId);
    if (!folioAccess.authorized) {
      throw new AuthorizationError(folioAccess.error || 'Access denied to this folio');
    }

    // 5. Validate amount range
    if (amount < 1) {
      return createErrorResponse(new Error('Payment amount must be at least 1 ZMW'));
    }

    if (amount > 50000) {
      logger.warn('Large payment amount requested', { requestId, amount, userId: user.id });
    }

    // 6. Generate unique transaction reference with idempotency
    const txRef = `ZAMORA-${nanoid(12)}`;

    // TODO: In production, implement actual Mobile Money API integration
    // Example for MTN MoMo:
    // const momoResponse = await fetch('https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'X-Reference-Id': txRef,
    //     'X-Target-Environment': 'sandbox',
    //     'Content-Type': 'application/json',
    //     'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY,
    //   },
    //   body: JSON.stringify({
    //     amount: amount.toString(),
    //     currency,
    //     externalId: folioId,
    //     payer: {
    //       partyIdType: 'MSISDN',
    //       partyId: phoneNumber.replace('+', '')
    //     },
    //     payerMessage: 'Payment for Hotel Stay',
    //     payeeNote: `Folio: ${folioId}`
    //   })
    // });

    // Mock implementation for development
    logger.info('Mobile Money payment initiated', {
      requestId,
      provider,
      amount,
      currency,
      txRef,
      folioId,
    });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockResponse = {
      status: 'pending',
      message: 'Payment initiated. Please check your phone to confirm.',
      transactionReference: txRef,
      amount,
      currency,
      provider,
      externalId: folioId,
      providerResponse: {
        status: 'ACCEPTED',
        referenceId: txRef,
      },
    };

    const duration = Date.now() - startTime;
    logger.logResponse('POST', '/api/payments/momo', 200, duration, {
      requestId,
      txRef,
      provider
    });

    return createSuccessResponse(
      mockResponse,
      200,
      {
        ...getRateLimitHeaders(rateLimitResult),
        'X-Request-ID': requestId,
        'X-Transaction-Reference': txRef,
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Mobile Money payment initiation failed', error, { requestId, ip });
    logger.logResponse('POST', '/api/payments/momo', error.statusCode || 500, duration, { requestId });

    return createErrorResponse(error);
  }
}

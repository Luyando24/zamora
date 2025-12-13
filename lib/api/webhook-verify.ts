import crypto from 'crypto';

/**
 * Webhook signature verification utilities
 */

export interface WebhookVerificationResult {
    valid: boolean;
    error?: string;
}

/**
 * Verify HMAC signature for webhook payloads
 */
export function verifyHMACSignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
    algorithm: string = 'sha256'
): WebhookVerificationResult {
    try {
        const expectedSignature = crypto
            .createHmac(algorithm, secret)
            .update(payload)
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

        if (!isValid) {
            return { valid: false, error: 'Invalid signature' };
        }

        return { valid: true };
    } catch (error) {
        return { valid: false, error: 'Signature verification failed' };
    }
}

/**
 * Verify webhook timestamp to prevent replay attacks
 */
export function verifyTimestamp(
    timestamp: number | string,
    maxAgeSeconds: number = 300 // 5 minutes default
): WebhookVerificationResult {
    try {
        const webhookTime = typeof timestamp === 'string'
            ? parseInt(timestamp, 10)
            : timestamp;

        if (isNaN(webhookTime)) {
            return { valid: false, error: 'Invalid timestamp format' };
        }

        const currentTime = Math.floor(Date.now() / 1000);
        const age = currentTime - webhookTime;

        if (age > maxAgeSeconds) {
            return { valid: false, error: 'Webhook timestamp too old (possible replay attack)' };
        }

        if (age < -60) {
            return { valid: false, error: 'Webhook timestamp is in the future' };
        }

        return { valid: true };
    } catch (error) {
        return { valid: false, error: 'Timestamp verification failed' };
    }
}

/**
 * MTN MoMo specific signature verification
 * Reference: https://momodeveloper.mtn.com/api-documentation/api-description/
 */
export function verifyMTNMoMoSignature(
    payload: string,
    signature: string,
    apiKey: string
): WebhookVerificationResult {
    // MTN MoMo uses HMAC-SHA256
    return verifyHMACSignature(payload, signature, apiKey, 'sha256');
}

/**
 * Airtel Money signature verification
 */
export function verifyAirtelSignature(
    payload: string,
    signature: string,
    secret: string
): WebhookVerificationResult {
    return verifyHMACSignature(payload, signature, secret, 'sha256');
}

/**
 * Generic webhook verification with signature and timestamp
 */
export function verifyWebhook(
    payload: string,
    signature: string,
    timestamp: string | number,
    secret: string,
    options?: {
        maxAgeSeconds?: number;
        algorithm?: string;
    }
): WebhookVerificationResult {
    // First verify timestamp
    const timestampResult = verifyTimestamp(
        timestamp,
        options?.maxAgeSeconds
    );

    if (!timestampResult.valid) {
        return timestampResult;
    }

    // Then verify signature
    return verifyHMACSignature(
        payload,
        signature,
        secret,
        options?.algorithm || 'sha256'
    );
}

/**
 * Parse signature header (handles different formats)
 * Example formats:
 * - "sha256=abc123def456"
 * - "v1=abc123def456,t=1234567890"
 */
export function parseSignatureHeader(
    headerValue: string
): { signature: string; timestamp?: string; version?: string } | null {
    try {
        // Format: v1=signature,t=timestamp (Stripe-style)
        if (headerValue.includes(',')) {
            const parts = headerValue.split(',').reduce((acc, part) => {
                const [key, value] = part.trim().split('=');
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);

            return {
                signature: parts.v1 || parts.signature,
                timestamp: parts.t,
                version: parts.v1 ? 'v1' : undefined,
            };
        }

        // Format: sha256=signature
        if (headerValue.includes('=')) {
            const [algorithm, signature] = headerValue.split('=');
            return { signature, version: algorithm };
        }

        // Just the signature
        return { signature: headerValue };
    } catch (error) {
        return null;
    }
}

/**
 * Verify IP address is from allowed sources
 */
export function verifyIPWhitelist(
    ip: string,
    whitelist: string[]
): WebhookVerificationResult {
    if (!whitelist || whitelist.length === 0) {
        return { valid: true }; // No whitelist = allow all
    }

    if (whitelist.includes(ip)) {
        return { valid: true };
    }

    return {
        valid: false,
        error: `IP address ${ip} not in whitelist`
    };
}

/**
 * Extract IP from request headers (handles proxies)
 */
export function extractIPAddress(headers: Headers): string {
    // Check common proxy headers
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIP = headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Vercel-specific
    const vercelIP = headers.get('x-vercel-forwarded-for');
    if (vercelIP) {
        return vercelIP;
    }

    return 'unknown';
}

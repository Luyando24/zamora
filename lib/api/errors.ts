import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard error handling utilities for API routes
 */

export class APIError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string,
        public details?: Record<string, any>
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export class ValidationError extends APIError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, 400, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends APIError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends APIError {
    constructor(message: string = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

export class NotFoundError extends APIError {
    constructor(message: string = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends APIError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT');
        this.name = 'ConflictError';
    }
}

export class RateLimitError extends APIError {
    constructor(message: string = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
    }
}

/**
 * Format Zod validation errors
 */
function formatZodError(error: ZodError): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    error.issues.forEach((err) => {
        const path = err.path.join('.');
        if (!formatted[path]) {
            formatted[path] = [];
        }
        formatted[path].push(err.message);
    });

    return formatted;
}

/**
 * Sanitize error for client response (prevent information leakage)
 */
function sanitizeError(error: Error, isDevelopment: boolean = false): {
    message: string;
    code?: string;
    details?: any;
    stack?: string;
} {
    // In development, show more details
    if (isDevelopment) {
        return {
            message: error.message,
            code: (error as APIError).code,
            details: (error as APIError).details,
            stack: error.stack,
        };
    }

    // In production, only show safe error info
    if (error instanceof APIError) {
        return {
            message: error.message,
            code: error.code,
            details: error.details,
        };
    }

    // For unknown errors, return generic message
    return {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
    };
}

/**
 * Create error response
 */
export function createErrorResponse(
    error: Error | ZodError,
    isDevelopment: boolean = process.env.NODE_ENV === 'development'
): NextResponse {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: formatZodError(error),
            },
            { status: 400 }
        );
    }

    // Handle custom API errors
    if (error instanceof APIError) {
        const sanitized = sanitizeError(error, isDevelopment);
        return NextResponse.json(
            { error: sanitized.message, ...sanitized },
            { status: error.statusCode }
        );
    }

    // Handle unknown errors
    console.error('Unexpected API error:', error);

    const sanitized = sanitizeError(error, isDevelopment);
    return NextResponse.json(
        { error: sanitized.message, ...sanitized },
        { status: 500 }
    );
}

/**
 * Success response helper
 */
export function createSuccessResponse(
    data: any,
    status: number = 200,
    headers?: Record<string, string>
): NextResponse {
    return NextResponse.json(data, {
        status,
        headers: headers ? new Headers(headers) : undefined
    });
}

/**
 * Log error for monitoring (extend this to integrate with monitoring service)
 */
export function logError(error: Error, context?: Record<string, any>): void {
    const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        context,
    };

    // In production, send to monitoring service (e.g., Sentry, Datadog)
    console.error('API Error:', JSON.stringify(errorLog, null, 2));
}

/**
 * Async error handler wrapper
 */
export function withErrorHandler(
    handler: (req: Request, context?: any) => Promise<NextResponse>
) {
    return async (req: Request, context?: any): Promise<NextResponse> => {
        try {
            return await handler(req, context);
        } catch (error) {
            logError(error as Error, {
                method: req.method,
                url: req.url,
                context,
            });
            return createErrorResponse(error as Error);
        }
    };
}

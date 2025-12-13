import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { createClient } from '@/utils/supabase/server';
import { authenticateRequest } from '@/lib/api/auth';
import { validateRequest, uploadSchema } from '@/lib/api/validators';
import {
  createErrorResponse,
  createSuccessResponse,
  AuthenticationError,
  ValidationError
} from '@/lib/api/errors';
import { rateLimitCombined, getRateLimitHeaders, RATE_LIMITS } from '@/lib/api/rate-limit';
import { logger, generateRequestId } from '@/lib/monitoring/logger';
import { extractIPAddress } from '@/lib/api/webhook-verify';

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const ip = extractIPAddress(req.headers);

  try {
    logger.logRequest('POST', '/api/upload', { requestId, ip });

    // 1. Authentication
    const authResult = await authenticateRequest(req);
    if (!authResult.success || !authResult.user) {
      throw new AuthenticationError(authResult.error);
    }

    const user = authResult.user;

    // 2. Rate limiting
    const rateLimitResult = await rateLimitCombined(ip, user.id, {
      ipConfig: RATE_LIMITS.UPLOAD,
      userConfig: RATE_LIMITS.UPLOAD,
    });

    if (!rateLimitResult.success) {
      logger.warn('Upload rate limit exceeded', { requestId, ip, userId: user.id });
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // 3. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string;

    if (!file || !bucket || !path) {
      throw new ValidationError('Missing required fields: file, bucket, or path');
    }

    // 4. Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      logger.warn('Invalid file type upload attempt', {
        requestId,
        userId: user.id,
        fileType: file.type
      });
      throw new ValidationError(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    // 5. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('File size exceeds limit', {
        requestId,
        userId: user.id,
        fileSize: file.size
      });
      throw new ValidationError(
        `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
      );
    }

    // 6. Validate upload parameters
    const validation = validateRequest(uploadSchema, {
      bucket,
      path,
      fileSize: file.size,
      fileType: file.type,
    });

    if (!validation.success) {
      return createErrorResponse(validation.errors);
    }

    // 7. Sanitize file path (prevent directory traversal)
    const sanitizedPath = path.replace(/\.\./g, '').replace(/^\/+/, '');
    if (!sanitizedPath) {
      throw new ValidationError('Invalid file path');
    }

    // 8. Add user ID to path for isolation
    const userPath = `${user.id}/${sanitizedPath}`;

    logger.info('File upload validated', {
      requestId,
      userId: user.id,
      bucket,
      path: userPath,
      fileSize: file.size,
      fileType: file.type,
    });

    // 9. Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 10. Upload using admin client
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(userPath, fileBuffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      logger.error('File upload failed', uploadError, {
        requestId,
        userId: user.id,
        bucket,
        path: userPath
      });
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 11. Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(userPath);

    logger.info('File uploaded successfully', {
      requestId,
      userId: user.id,
      bucket,
      path: userPath,
      publicUrl,
    });

    const duration = Date.now() - startTime;
    logger.logResponse('POST', '/api/upload', 200, duration, {
      requestId,
      fileSize: file.size,
    });

    return createSuccessResponse(
      {
        success: true,
        publicUrl,
        path: userPath,
        bucket,
        size: file.size,
        type: file.type,
      },
      200,
      {
        ...getRateLimitHeaders(rateLimitResult),
        'X-Request-ID': requestId,
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('File upload failed', error, { requestId, ip });
    logger.logResponse('POST', '/api/upload', error.statusCode || 500, duration, { requestId });

    return createErrorResponse(error);
  }
}

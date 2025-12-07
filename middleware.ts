import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match a dummy route to ensure valid config but zero execution impact
    '/api/non-existent-placeholder-route',
  ],
};

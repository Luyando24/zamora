import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  // Define domains
  // Treat localhost:3000 as zamoraapp.com logic for testing if needed, 
  // but strictly, localhost usually doesn't have subdomains unless configured.
  const isDev = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const rootDomain = isDev ? 'localhost:3000' : 'zamoraapp.com'
  
  // Extract subdomain
  // zamoraapp.com -> parts length 2 -> null
  // app.zamoraapp.com -> parts length 3 -> app
  // localhost:3000 -> parts length 1 -> null
  // app.localhost:3000 -> parts length 2 -> app
  
  const parts = hostname.split('.')
  let subdomain = null
  
  if (isDev) {
      // Remove port for split logic if simple localhost
      const hostNoPort = hostname.split(':')[0]
      const partsNoPort = hostNoPort.split('.')
      if (partsNoPort.length > 1 && hostNoPort !== 'localhost') {
          subdomain = partsNoPort[0]
      }
  } else {
      // Production: something.zamoraapp.com
      if (parts.length > 2) {
          subdomain = parts.slice(0, -2).join('.')
      }
  }
  
  if (subdomain === 'www') subdomain = null

  // Determine Rewrite Target
  let rewrittenUrl = url.clone()
  
  // 1. Landing Page (get.zamoraapp.com)
  if (subdomain === 'get') {
      // Rewrite /signup to /business-signup for property owners
      if (url.pathname === '/signup') {
          rewrittenUrl.pathname = '/business-signup';
      }
      // No rewrite needed for other paths if mapping to root
  } 
  
  // 2. Partner Dashboard (app.zamoraapp.com)
  else if (subdomain === 'app') {
      // Rewrite to /dashboard
      // Allow auth pages to pass through without /dashboard prefix
      if (!url.pathname.startsWith('/dashboard') && 
          !url.pathname.startsWith('/login') && 
          !url.pathname.startsWith('/signup') && 
          !url.pathname.startsWith('/auth') &&
          !url.pathname.startsWith('/verify-email') &&
          !url.pathname.startsWith('/api')) { // Allow API calls
          
          rewrittenUrl.pathname = `/dashboard${url.pathname === '/' ? '' : url.pathname}`
      }
  } 
  
  // 3. Public Listing (zamoraapp.com)
  else if (!subdomain) {
      // Rewrite to /explore
      // Only rewrite root? "currently set to /explore"
      if (url.pathname === '/') {
          rewrittenUrl.pathname = '/explore'
      }
  } 
  
  // 4. Property Pages (*.zamoraapp.com)
  else {
      // Rewrite to /book/[subdomain]
      // Exclude API, _next, etc. (Already excluded by matcher, but good to be safe for API)
      if (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/_next')) {
           // Handle dedicated menu path: subdomain.zamoraapp.com/menu -> /menu/[subdomain]
           if (url.pathname === '/menu' || url.pathname.startsWith('/menu/')) {
                // If the path is just /menu, rewrite to /menu/[subdomain]
                // If it's /menu/something (not expected currently), we might want to handle it too.
                // But /menu/[propertyId] expects the ID/slug in the path.
                // Here we inject the subdomain as the ID.
                
                // If url is /menu, we map to /menu/subdomain
                if (url.pathname === '/menu') {
                    rewrittenUrl.pathname = `/menu/${subdomain}`;
                } else {
                    // if it is /menu/extra, we map to /menu/subdomain/extra?
                    // Currently app/menu/[propertyId] is the page.
                    // app/menu/[propertyId]/page.tsx
                    // So /menu/slug serves the page.
                    // If url is /menu/something, it might be 404 unless we have sub-routes.
                    // Let's stick to strict /menu mapping for now.
                    rewrittenUrl.pathname = `/menu/${subdomain}${url.pathname.replace('/menu', '')}`;
                }
           } else {
               rewrittenUrl.pathname = `/book/${subdomain}${url.pathname === '/' ? '' : url.pathname}`
           }
      }
  }

  // Create the initial response with the rewrite
  const response = NextResponse.rewrite(rewrittenUrl, {
      request: {
          headers: request.headers
      }
  })

  // Run Auth/Session Logic
  // We pass our rewrite response so cookies are set on it.
  const finalResponse = await updateSession(request, response)

  // Add CORS headers for Mobile API
  if (url.pathname.startsWith('/api/mobile')) {
    finalResponse.headers.set('Access-Control-Allow-Origin', '*');
    finalResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    finalResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info');
    // Ensure credentials are NOT set when Origin is *
    finalResponse.headers.delete('Access-Control-Allow-Credentials');

    // Handle OPTIONS requests immediately
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: finalResponse.headers
      });
    }
  }

  return finalResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

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
      // No rewrite needed if mapping to root, but we ensure we serve the landing page.
      // If the user visits /dashboard on get.zamoraapp.com, they get the dashboard?
      // "get.zamoraapp.com for the landing page" implies it should acts as the marketing site.
      // We assume the root app/page.tsx and associated marketing routes are accessible.
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
           rewrittenUrl.pathname = `/book/${subdomain}${url.pathname === '/' ? '' : url.pathname}`
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
  return await updateSession(request, response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

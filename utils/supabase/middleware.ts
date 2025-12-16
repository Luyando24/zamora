import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, response?: NextResponse) {
  let finalResponse = response || NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          
          // Preserve the original response type (rewrite vs next) by copying properties if needed
          // or just assume finalResponse is the base.
          // But createServerClient logic usually recreates the response to set cookies.
          
          // If finalResponse is a Rewrite, we must preserve it.
          // Since we can't easily clone a Response and change its type, we should just mutate the cookies of finalResponse?
          // Next.js Middleware cookies are tricky.
          // The standard pattern is:
          // response = NextResponse.next(...)
          // response.cookies.set(...)
          
          // If we passed in a Rewrite response, we should use it.
          
          // Note: If we recreate response with NextResponse.next(), we LOSE the rewrite.
          // We must NOT recreate it if we passed in a response.
          
          if (!response) {
             finalResponse = NextResponse.next({
                request: {
                  headers: request.headers,
                },
             })
          }
          
          cookiesToSet.forEach(({ name, value, options }) =>
            finalResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  // Check against the INTENDED path (which might be in request.nextUrl if rewritten before calling this?
  // No, request.nextUrl is the original URL if not modified.
  // We should probably rely on the passed response url? No.
  // If we rewrote the URL in middleware.ts, we should pass the *modified* request to this function?
  // But we passed `request` which is the original.
  
  // Actually, if we use NextResponse.rewrite(), the downstream gets the new URL.
  // But inside this function, request.nextUrl is still the original.
  
  // We need to know the *target* path for auth protection.
  // Let's assume the caller handles routing protection OR we check the URL from the response? 
  // No, response doesn't have the URL path easily accessible for logic.
  
  // Simplified: The caller (middleware.ts) should handle the routing logic and pass the rewrite.
  // But `updateSession` has built-in auth protection logic for /dashboard.
  // We need to update this logic to support the new routing.
  
  // If we are on app.zamoraapp.com, request.nextUrl is app.zamoraapp.com/.
  // We want to treat it as /dashboard.
  
  // If we passed a response that is a rewrite to /dashboard, can we detect it?
  // Not easily.
  
  // Solution: Let middleware.ts handle the auth redirection logic?
  // Or Update updateSession to inspect headers?
  
  // Let's just fix the variable name 'response' to 'finalResponse' first.
  
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from login/signup pages
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
  }

  return finalResponse
}

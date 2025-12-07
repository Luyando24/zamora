import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes logic
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based access control
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'staff'; // Default to staff if not found

    // Admin routes are for super_admin only
    if (request.nextUrl.pathname.startsWith('/admin') && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Dashboard routes are generally for hotel staff/managers/admins
    // (Assuming super_admin can also view dashboard or has their own flow)
    // For now, strict separation:
    if (request.nextUrl.pathname.startsWith('/dashboard') && role === 'super_admin') {
       return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Redirect logged-in users away from login page
  if (request.nextUrl.pathname.startsWith('/login') && user) {
    // Fetch role to decide where to send them
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    const role = profile?.role || 'staff';
    
    if (role === 'super_admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};

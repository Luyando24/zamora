import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = {
        get(name: string) {
          return request.headers.get('cookie')?.split('; ').find(row => row.startsWith(`${name}=`))?.split('=')[1];
        },
        set(name: string, value: string, options: CookieOptions) {
          // This is a route handler, so we can't set cookies directly on the request object like middleware
          // But createServerClient needs these methods defined.
          // We'll handle setting cookies on the response below.
        },
        remove(name: string, options: CookieOptions) {
          // Same here
        },
      };

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
            get(name: string) {
                // In a route handler, we parse cookies from the request headers
                const cookieHeader = request.headers.get('cookie') || '';
                const cookies = Object.fromEntries(
                    cookieHeader.split('; ').map(c => {
                        const [key, ...v] = c.split('=');
                        return [key, v.join('=')];
                    })
                );
                return cookies[name];
            },
            set(name: string, value: string, options: CookieOptions) {
                // We'll collect these and set them on the response
            },
            remove(name: string, options: CookieOptions) {
                 // We'll collect these and set them on the response
            },
        },
      }
    );
    
    // We need to capture the cookies set by exchangeCodeForSession
    // Since createServerClient in route handlers is a bit tricky with cookie setting on the response,
    // let's use the standard approach for Next.js App Router Route Handlers
    
    // Actually, let's redefine supabase client creation to allow capturing response cookies properly
    // The standard pattern involves creating a response object first if we want to modify it, 
    // but exchangeCodeForSession is async.
    
    // Cleaner implementation for Route Handler:
    const response = NextResponse.redirect(`${origin}${next}`);
    
    const supabaseWithResponse = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
                const cookieHeader = request.headers.get('cookie') || '';
                const cookies = Object.fromEntries(
                    cookieHeader.split('; ').map(c => {
                        const [key, ...v] = c.split('=');
                        return [key, v.join('=')];
                    })
                );
                return cookies[name];
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

    const { error } = await supabaseWithResponse.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return response;
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?message=Could not verify email`);
}

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseAuthConfigured,
} from '@/lib/supabase/config';

const isAuthDisabled = process.env.DISABLE_AUTH === 'true';

export async function middleware(request: NextRequest) {
  if (isAuthDisabled) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  if (!isSupabaseAuthConfigured()) {
    return response;
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith('/admin') && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    (pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/signup' ||
      pathname === '/sign-in' ||
      pathname === '/sign-up')
  ) {
    const returnTo = request.nextUrl.searchParams.get('returnTo') ?? '/';
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

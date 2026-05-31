import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

import { getClerkMiddlewareOptions } from '@/lib/clerk-config';

const isAuthDisabled = process.env.DISABLE_AUTH === 'true';

function isValidClerkPublishableKey(key: string | undefined): boolean {
  return Boolean(key?.trim().startsWith('pk_'));
}

function isValidClerkSecretKey(key: string | undefined): boolean {
  return Boolean(key?.trim().startsWith('sk_'));
}

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/register(.*)',
  '/healthcheck',
  '/api/auth(.*)',
  '/opengraph-image(.*)',
  '/twitter-image(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

const isProtectedApiRoute = createRouteMatcher(['/api/chat(.*)']);

const clerkHandler = clerkMiddleware(
  async (auth, request) => {
    if (isPublicRoute(request)) {
      return;
    }

    if (isProtectedApiRoute(request) || isAdminRoute(request)) {
      await auth.protect();
    }
  },
  getClerkMiddlewareOptions(),
);

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (isAuthDisabled) {
    return NextResponse.next();
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!isValidClerkPublishableKey(publishableKey) || !isValidClerkSecretKey(secretKey)) {
    console.warn(
      'Clerk keys missing or invalid (expected pk_* and sk_*); bypassing middleware. Fix Vercel env or set DISABLE_AUTH=true',
    );
    return NextResponse.next();
  }

  try {
    return clerkHandler(request, event);
  } catch (error) {
    console.error('Clerk middleware failed', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};

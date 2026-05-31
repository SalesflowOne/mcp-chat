import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isAuthDisabled = process.env.DISABLE_AUTH === 'true';

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

const isProtectedApiRoute = createRouteMatcher(['/api/chat(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (isAuthDisabled) {
    return;
  }

  if (isPublicRoute(request)) {
    return;
  }

  if (isProtectedApiRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

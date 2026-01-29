import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stackServerApp } from './stack/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes - they handle their own authentication
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Public routes - Stack Auth routes and public pages
  // Include all Stack Auth related paths including email verification
  const publicRoutes = [
    '/handler',
    '/',
    '/login',
    '/test-auth',
  ];
  
  // Also allow any Stack Auth callback/verification routes
  if (pathname.includes('/verify') || pathname.includes('/auth/') || pathname.includes('/callback')) {
    return NextResponse.next();
  }
  
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication for protected page routes only
  // Use a lightweight check - just verify user exists, don't fetch full profile
  try {
    const user = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!user) {
      console.log(`[Middleware] No user found for ${pathname}, redirecting to sign-in`);
      // Redirect to sign-in if not authenticated
      return NextResponse.redirect(new URL('/handler/sign-in', request.url));
    }
    
    console.log(`[Middleware] User authenticated for ${pathname}`);
  } catch (error: any) {
    // Log error for debugging
    console.error('[Middleware] Auth error:', error?.message || 'Unknown error', 'for path:', pathname);
    // If there's an error getting user, redirect to sign-in
    return NextResponse.redirect(new URL('/handler/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match page routes only, excluding:
     * - API routes (handled separately)
     * - Static files (_next/static, _next/image, favicon.ico)
     * - Auth handler routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico|handler).*)',
  ],
};


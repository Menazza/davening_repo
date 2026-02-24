import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session_user_id';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip middleware for API routes - they handle their own authentication
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Public routes - login and public pages
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/test-auth',
  ];
  
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Allow first redirect after sign-in to bypass auth check entirely
  // This gives time for cookies to propagate on mobile devices
  // The client component will handle auth verification
  if (searchParams.get('_stack_redirect') === '1') {
    // Continue without auth check - the page will verify auth client-side
    return NextResponse.next();
  }

  // Check authentication for protected page routes only via session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match page routes only, excluding:
    // - API routes (handled separately)
    // - Static files (_next/static, _next/image, favicon.ico)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};


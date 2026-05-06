import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from './middleware/security';
import { SESSION_COOKIE_NAME } from '@/lib/auth-constants';

// Define protected routes that require authentication
const protectedRoutes = [
  '/admin/dashboard',
  '/admin/dashboard/tracking',
  '/admin/dashboard/projects',
  '/admin/dashboard/users',
  '/admin/dashboard/audit',
  '/admin/messages'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply security middleware to all requests
  const securityResponse = await securityMiddleware.handle(request);
  if (securityResponse.status !== 200) {
    return securityResponse;
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // We intentionally do not treat the presence of a client cookie as proof of
  // authentication. Real authorization is enforced by Firebase Auth + Firestore.
  if (isProtectedRoute) {
    const authToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    
    if (!authToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle root admin redirect
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// Cleanup function to be called periodically (you might want to set up a cron job)
export function cleanupMiddleware() {
  securityMiddleware.cleanupRateLimit();
}

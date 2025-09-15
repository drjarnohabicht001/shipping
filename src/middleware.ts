import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from './middleware/security';

// Define protected routes that require authentication
const protectedRoutes = [
  '/admin/dashboard',
  '/admin/dashboard/tracking',
  '/admin/dashboard/projects',
  '/admin/dashboard/users',
  '/admin/dashboard/audit'
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/services',
  '/contact',
  '/admin/login'
];

// API routes that need special handling
const apiRoutes = [
  '/api/auth',
  '/api/tracking',
  '/api/projects',
  '/api/users',
  '/api/audit'
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
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  const isApiRoute = apiRoutes.some(route => pathname.startsWith(route));

  // Handle authentication for protected routes
  if (isProtectedRoute) {
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      // Redirect to login if no auth token
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // In a real application, you would validate the token here
    // For now, we'll assume any token is valid
    try {
      // You could decode and validate JWT token here
      // const payload = jwt.verify(authToken, process.env.JWT_SECRET);
      
      // Add user info to headers for the request
      const response = NextResponse.next();
      response.headers.set('x-user-authenticated', 'true');
      return response;
    } catch (error) {
      // Invalid token, redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle API routes
  if (isApiRoute) {
    // Add CORS headers for API routes
    const response = NextResponse.next();
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
    
    return response;
  }

  // Handle admin login redirect
  if (pathname === '/admin/login') {
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (authToken) {
      // User is already logged in, redirect to dashboard
      const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/admin/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Handle root admin redirect
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Continue with the request for public routes
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
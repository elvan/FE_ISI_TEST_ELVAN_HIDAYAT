import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || path === '/login' || path === '/register' || path === '/api/auth';
  const isApiPath = path.startsWith('/api/') && !path.startsWith('/api/tasks') && !path.startsWith('/api/activity');

  // Check if the user is authenticated
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect logic based on authentication status and path
  if (!isPublicPath && !isApiPath && !token) {
    // If trying to access a protected route without being authenticated
    const url = new URL('/login', request.url);
    // Add the original URL as a redirect parameter
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  if (path === '/login' && token) {
    // If already logged in and trying to access login page
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Continue with the request if authentication checks pass
  return NextResponse.next();
}

// Configure which paths should be checked by this middleware
export const config = {
  matcher: [
    // Match all paths except for:
    // - Static files (assets, images, etc.)
    // - API routes that don't require authentication
    // - Login page
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

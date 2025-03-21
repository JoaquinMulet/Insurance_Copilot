// middleware.js
import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicPaths = [
  '/',                // Home page (with limited functionality)
  '/signin',          // Sign-in route
  '/signup',          // Sign-up route
  '/api/webhook/clerk', // Clerk webhooks
];

export default clerkMiddleware((req) => {
  const { pathname } = req.nextUrl;
  
  // Allow public routes
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }
  
  // Check if user is authenticated for protected routes
  const { userId } = getAuth(req);
  
  // If not authenticated and trying to access a protected route, redirect to signin
  if (!userId) {
    const signInUrl = new URL('/signin', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // User is authenticated, proceed
  return NextResponse.next();
});

// Configure matcher for all routes, especially API routes
export const config = {
  matcher: [
    // Include all routes except static files, images, and favicon
    "/((?!_next/static|_next/image|favicon.ico).*)",
    // Explicitly include all API routes
    "/api/(.*)"
  ],
};
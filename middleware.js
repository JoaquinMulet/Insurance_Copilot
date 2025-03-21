// middleware.js
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',                // Home page (with limited functionality)
  '/signin(.*)',      // Sign-in routes
  '/signup(.*)',      // Sign-up routes
  '/api/webhook/clerk' // Clerk webhooks
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is not public, protect it
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  
  return NextResponse.next();
}, { debug: process.env.NODE_ENV === 'development' });

// Configure matcher for all routes, especially API routes
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Explicitly include all API routes
    '/api/(.*)'
  ],
};
// middleware.js
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicPaths = [
  '/',                // Home page (with limited functionality)
  '/signin',          // Sign-in route
  '/signup',          // Sign-up route
  '/api/webhook/clerk' // Clerk webhooks
];

export default clerkMiddleware((auth, req) => {
  // Clerk maneja automáticamente la autenticación
  // Solo necesitamos identificar las rutas públicas
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
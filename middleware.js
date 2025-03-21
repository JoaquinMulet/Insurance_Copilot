// middleware.js
import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicPaths = [
  '/',                // Home page (with limited functionality)
  '/signin',          // Sign-in route
  '/signup',          // Sign-up route
  '/api/webhook/clerk' // Clerk webhooks
];

export default authMiddleware({
  // Return true if the path should be accessible without authentication
  publicRoutes: (req) => {
    const path = req.nextUrl.pathname;
    return publicPaths.includes(path);
  },
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
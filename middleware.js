// middleware.js
import { clerkMiddleware } from '@clerk/nextjs/server';

// Usar clerkMiddleware en su forma más simple
export default clerkMiddleware();

// Limitar el scope del middleware para reducir potenciales errores
export const config = {
  matcher: [
    // Solo rutas de API
    '/api/(.*)',
    // Rutas de autenticación
    '/signin(.*)',
    '/signup(.*)'
  ],
};
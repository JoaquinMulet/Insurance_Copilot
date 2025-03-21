// middleware.js
import { NextResponse } from 'next/server';

// Lista de rutas públicas
const publicRoutes = ['/', '/signin', '/signup', '/api/webhook/clerk'];

export default function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Permitir acceso a rutas públicas y recursos estáticos
  if (
    publicRoutes.some(route => pathname.startsWith(route)) ||
    pathname.includes('/_next/') ||
    pathname.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }
  
  // Verificar autenticación usando cookies
  // En lugar de usar funciones de Clerk, verificamos si existe una cookie de sesión
  const hasClerkSession = request.cookies.get('__clerk_session') !== undefined;
  
  if (!hasClerkSession) {
    // Redirigir a página de login
    const redirectUrl = new URL('/signin', request.url);
    redirectUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|fonts|images|[\\w-]+\\.\\w+).*)',
  ],
};
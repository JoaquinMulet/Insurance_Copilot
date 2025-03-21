// lib/withAuth.js
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * HOC (Higher Order Component) para proteger rutas API con autenticación
 * @param {Function} handler - El manejador de la ruta API original
 * @returns {Function} Un nuevo manejador que verifica la autenticación antes de ejecutar el manejador original
 */
export function withAuth(handler) {
  return async (req, res) => {
    // Verificar autenticación usando Clerk
    const { userId } = getAuth(req);
    
    // Si no hay usuario autenticado, devolver 401 Unauthorized
    if (!userId) {
      return res.status(401).json({
        error: "No autorizado",
        message: "Debe iniciar sesión para acceder a esta funcionalidad",
      });
    }
    
    // Si el usuario está autenticado, continuar con el manejador original
    return handler(req, res);
  };
}

/**
 * Versión especializada para manejadores que usan formData (como upload.js)
 * No bloquea completamente la solicitud ya que bodyParser está desactivado
 * @param {Function} handler - El manejador de la ruta API original
 * @returns {Function} Un nuevo manejador que verifica la autenticación antes de ejecutar el manejador original
 */
export function withAuthFormData(handler) {
  return async (req, res) => {
    // Este es un middleware ligero que solo verifica la autenticación
    // Se ejecuta antes de analizar formData para evitar procesamiento innecesario
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({
        error: "No autorizado",
        message: "Debe iniciar sesión para acceder a esta funcionalidad",
      });
    }
    
    // Si el usuario está autenticado, continuar con el manejador original
    return handler(req, res);
  };
}

/**
 * HOC para proteger rutas API con autenticación Y autorización
 * @param {Function} handler - El manejador de la ruta API original
 * @returns {Function} Un nuevo manejador que verifica autenticación y autorización
 */
export function withAuthAndAuthorization(handler) {
  return async (req, res) => {
    try {
      // Verificar autenticación usando Clerk
      const auth = getAuth(req);
      const { userId } = auth;
      
      // Si no hay usuario autenticado, devolver 401 Unauthorized
      if (!userId) {
        return res.status(401).json({
          error: "No autorizado",
          message: "Debe iniciar sesión para acceder a esta funcionalidad",
        });
      }
      
      // Primero intentamos verificar si el usuario está autorizado usando los claims de la sesión
      // Esto es más eficiente que obtener el usuario completo
      const sessionClaims = auth.sessionClaims;
      
      // Si el metadata está en los claims, usamos eso
      if (sessionClaims && sessionClaims.metadata && sessionClaims.metadata.isAuthorized === true) {
        // Usuario autorizado, continuar con el manejador original
        return handler(req, res);
      }
      
      // Si no está en los claims, consultamos al usuario
      try {
        // Para Next.js necesitamos crear primero una instancia del cliente
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        
        // Verificar si el usuario tiene isAuthorized: true en sus metadatos públicos
        if (user.publicMetadata && user.publicMetadata.isAuthorized === true) {
          // Usuario autorizado, continuar con el manejador original
          return handler(req, res);
        }
        
        // Si llegamos aquí, el usuario no está autorizado
        return res.status(403).json({
          error: "Acceso denegado",
          message: "Su cuenta no está autorizada para usar este servicio. Por favor contacte al administrador.",
        });
      } catch (userError) {
        console.error("Error obteniendo información del usuario:", userError);
        
        // Error al verificar autorización, asumimos no autorizado por seguridad
        return res.status(403).json({
          error: "Error de verificación",
          message: "No se pudo verificar si su cuenta está autorizada. Por favor contacte al administrador.",
        });
      }
    } catch (error) {
      console.error("Error en middleware de autenticación y autorización:", error);
      return res.status(500).json({
        error: "Error de servidor",
        message: "Error verificando permisos de usuario",
      });
    }
  };
}


/**
 * Versión para FormData que combina autenticación y autorización
 * Verifica si el usuario autenticado tiene permiso para acceder a la ruta
 * si no tiene permiso, devuelve un 403 Forbidden
 * @param {Function} handler - El manejador de la ruta API original
 * @returns {Function} Un nuevo manejador que verifica autenticación y autorización
 */
export function withAuthAndAuthorizationFormData(handler) {
  return async (req, res) => {
    try {
      // Verificar autenticación usando Clerk
      const auth = getAuth(req);
      const { userId } = auth;
      
      // Si no hay usuario autenticado, devolver 401 Unauthorized
      if (!userId) {
        return res.status(401).json({
          error: "No autorizado",
          message: "Debe iniciar sesión para acceder a esta funcionalidad",
        });
      }
      
      // Primero intentamos verificar si el usuario está autorizado usando los claims de la sesión
      // Esto es más eficiente que obtener el usuario completo
      const sessionClaims = auth.sessionClaims;
      
      // Si el metadata está en los claims, usamos eso
      if (sessionClaims && sessionClaims.metadata && sessionClaims.metadata.isAuthorized === true) {
        // Usuario autorizado, continuar con el manejador original
        return handler(req, res);
      }
      
      // Si no está en los claims, consultamos al usuario
      try {
        // Para Next.js necesitamos crear primero una instancia del cliente
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        
        // Verificar si el usuario tiene isAuthorized: true en sus metadatos públicos
        if (user.publicMetadata && user.publicMetadata.isAuthorized === true) {
          // Usuario autorizado, continuar con el manejador original
          return handler(req, res);
        }
        
        // Si llegamos aquí, el usuario no está autorizado
        return res.status(403).json({
          error: "Acceso denegado, Contacte al Administrador",
          message: "Su cuenta no está autorizada para usar este servicio. Por favor contacte al administrador.",
        });
      } catch (userError) {
        console.error("Error obteniendo información del usuario:", userError);
        
        // Error al verificar autorización, asumimos no autorizado por seguridad
        return res.status(403).json({
          error: "Error de verificación",
          message: "No se pudo verificar si su cuenta está autorizada. Por favor contacte al administrador.",
        });
      }
    } catch (error) {
      console.error("Error en middleware de autenticación y autorización:", error);
      return res.status(500).json({
        error: "Error de servidor",
        message: "Error verificando permisos de usuario",
      });
    }
  };
}
import { createClient } from "@supabase/supabase-js";

// Variables de entorno de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno de Supabase. " +
      "Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY configuradas en tu archivo .env",
  );
}

/**
 * Cliente de Supabase configurado con PKCE flow para mayor seguridad.
 *
 * ⚠️ SEGURIDAD: Por qué usamos PKCE en lugar de implicit flow:
 *
 * 1. TOKENS EN URL (MALA PRÁCTICA):
 *    - Con implicit flow, el access_token aparece en la URL (#access_token=...)
 *    - Esto es inseguro porque:
 *      a) Queda en el historial del navegador
 *      b) Puede aparecer en capturas de pantalla
 *      c) Se filtra a analytics, logs de errores, y proxies
 *      d) Si llega como query param, puede filtrarse por header Referer a sitios externos
 *      e) Aumenta la superficie de ataque para robo de sesión
 *
 * 2. PKCE (Proof Key for Code Exchange):
 *    - Usa un código de autorización temporal en lugar del token directo
 *    - El código se intercambia por el token de forma segura en el backend
 *    - El token nunca aparece en la URL
 *    - Es el estándar recomendado por OAuth 2.1 y Supabase
 *
 * @see https://supabase.com/docs/guides/auth/sessions/pkce-flow
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce", // Usar PKCE flow en lugar de implicit
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Limpia tokens sensibles de la URL del navegador.
 * Debe llamarse después de procesar el callback de autenticación.
 *
 * @description Elimina:
 * - Hash fragments (#access_token, #refresh_token, etc.)
 * - Query params sensibles (code, access_token, refresh_token, etc.)
 */
export const cleanAuthTokensFromUrl = () => {
  const url = new URL(window.location.href);
  let shouldClean = false;

  // Lista de parámetros sensibles que deben eliminarse
  const sensitiveParams = [
    "access_token",
    "refresh_token",
    "token_type",
    "expires_in",
    "expires_at",
    "code",
    "error",
    "error_description",
    "error_code",
  ];

  // Limpiar hash fragment si contiene tokens
  if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    sensitiveParams.forEach((param) => {
      if (hashParams.has(param)) {
        shouldClean = true;
      }
    });
  }

  // Limpiar query params sensibles
  sensitiveParams.forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      shouldClean = true;
    }
  });

  // Si hay algo que limpiar, actualizar la URL sin recargar
  if (shouldClean) {
    const cleanUrl =
      url.pathname +
      (url.searchParams.toString() ? "?" + url.searchParams.toString() : "");
    window.history.replaceState({}, document.title, cleanUrl);
    console.log("[Auth] URL limpiada de tokens sensibles");
  }
};

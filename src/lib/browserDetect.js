/**
 * browserDetect.js
 * ───────────────────────────────────────────────────────────────
 * Utilidades para detectar navegadores embebidos (In-App Browsers)
 * de redes sociales. Estos navegadores rompen flujos OAuth porque:
 *
 *  1. Bloquean / restringen `window.open()` → los popups OAuth fallan.
 *  2. Aplican políticas COOP/COEP estrictas que rompen `postMessage`
 *     entre la ventana principal y el popup.
 *  3. Aíslan `localStorage` / `sessionStorage` del navegador del sistema,
 *     impidiendo persistir nonces u otros artefactos PKCE.
 *  4. Algunos proveedores (Google) bloquean explícitamente el sign-in
 *     desde IABs por seguridad (User Agent denegado).
 *
 * Detectamos analizando el `userAgent` con patrones conocidos.
 * No es 100% infalible (los UAs pueden cambiar), pero cubre los
 * casos reales que vemos en producción.
 *
 * Uso típico:
 *   import { isInAppBrowser } from "@/lib/browserDetect";
 *   if (isInAppBrowser()) { ... usar redirect en vez de popup ... }
 */

// SSR-safe: si no hay window, no estamos en un IAB.
const getUA = () => {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
};

/**
 * Patrones de detección por red social.
 * El orden importa para getInAppBrowserName (primer match gana).
 */
const IAB_PATTERNS = [
  // Instagram → "Instagram 250.0.0.x.xxx Android"
  { name: "instagram", regex: /Instagram/i },
  // Facebook → "FBAN/FBIOS" o "FBAV/" o "FB_IAB"
  { name: "facebook", regex: /FBAN|FBAV|FB_IAB|FBIOS/i },
  // Messenger
  { name: "messenger", regex: /Messenger|MessengerLite/i },
  // TikTok → "musical_ly" (legado) o "TikTok"
  { name: "tiktok", regex: /musical_ly|Bytedance|TikTok|ByteLocale/i },
  // WeChat
  { name: "wechat", regex: /MicroMessenger/i },
  // LinkedIn
  { name: "linkedin", regex: /LinkedInApp/i },
  // Twitter / X
  { name: "twitter", regex: /Twitter(Android|ForiPhone)/i },
  // Snapchat
  { name: "snapchat", regex: /Snapchat/i },
  // Pinterest
  { name: "pinterest", regex: /Pinterest/i },
  // Line
  { name: "line", regex: /\bLine\//i },
  // Genéricos: WebView Android / iOS sin Safari/Chrome (heurística más débil).
  // Lo dejamos al final y opcional: NO lo activamos por defecto porque genera
  // falsos positivos en algunos PWAs/embebidos legítimos.
];

/**
 * Detecta si la página se está renderizando dentro de un navegador
 * embebido (In-App Browser) de una red social conocida.
 *
 * @returns {boolean} true si es un IAB conocido.
 */
export function isInAppBrowser() {
  const ua = getUA();
  if (!ua) return false;
  return IAB_PATTERNS.some((p) => p.regex.test(ua));
}

/**
 * Detección específica de Instagram (caso más común en este proyecto).
 * @returns {boolean}
 */
export function isInstagramBrowser() {
  return /Instagram/i.test(getUA());
}

/**
 * Devuelve el nombre identificador de la red social cuyo IAB detectamos,
 * o null si no es un IAB conocido. Útil para personalizar mensajes
 * o tracking de analytics.
 *
 * @returns {"instagram"|"facebook"|"messenger"|"tiktok"|"wechat"|"linkedin"|"twitter"|"snapchat"|"pinterest"|"line"|null}
 */
export function getInAppBrowserName() {
  const ua = getUA();
  if (!ua) return null;
  for (const p of IAB_PATTERNS) {
    if (p.regex.test(ua)) return p.name;
  }
  return null;
}

/**
 * Heurística simple: ¿es un dispositivo móvil?
 * Útil para combinar con isInAppBrowser y priorizar el flujo móvil.
 * @returns {boolean}
 */
export function isMobileDevice() {
  const ua = getUA();
  if (!ua) return false;
  return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua);
}

/**
 * Indica si debemos evitar el uso de popups OAuth en este contexto.
 * Centralizado aquí para que cualquier nuevo proveedor (Apple, GitHub, etc.)
 * pueda preguntar `shouldAvoidOAuthPopup()` sin reimplementar la lógica.
 *
 * @returns {boolean}
 */
export function shouldAvoidOAuthPopup() {
  // Todos los IABs conocidos rompen popups OAuth → evitar.
  return isInAppBrowser();
}

// ────────────────────────────────────────────────────────────────
// Plataforma móvil específica (Android / iOS)
// Necesario para escoger el método correcto al abrir el navegador
// externo desde un In-App Browser.
// ────────────────────────────────────────────────────────────────
export function isAndroid() {
  return /Android/i.test(getUA());
}

export function isIOS() {
  const ua = getUA();
  // iPadOS 13+ se reporta como Mac → comprobar también el touch screen.
  return (
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) &&
      typeof navigator !== "undefined" &&
      navigator.maxTouchPoints > 1)
  );
}

/**
 * Intenta abrir una URL en el navegador externo del sistema operativo
 * (Chrome en Android, Safari en iOS), saliendo del navegador embebido
 * (Instagram, Facebook, TikTok…) en el que estemos actualmente.
 *
 * Estrategia por plataforma:
 *
 *  ─ Android: usa un Intent URI explícito hacia Chrome. Es la forma
 *    soportada oficialmente por Android para salir del WebView de
 *    una app y abrir un navegador real. Si Chrome no está instalado,
 *    la mayoría de IABs caen al navegador por defecto del sistema.
 *
 *  ─ iOS: no existe un mecanismo oficial. Se intenta el esquema no
 *    documentado `x-safari-https://...` que muchas versiones de
 *    Instagram/Facebook respetan. En paralelo se copia la URL al
 *    portapapeles para que, si el intento falla, el usuario pueda
 *    pegarla manualmente en Safari.
 *
 *  ─ Cualquier otro caso: abre una pestaña nueva con window.open.
 *
 * @param {string} url - URL absoluta a abrir (debe incluir https://).
 * @param {{ onClipboardCopy?: () => void }} [options]
 * @returns {Promise<{ method: "android-intent"|"ios-safari"|"window-open"|"none", clipboardCopied: boolean }>}
 */
export async function openInExternalBrowser(url, options = {}) {
  if (typeof window === "undefined") {
    return { method: "none", clipboardCopied: false };
  }

  // Helper: intenta copiar al portapapeles (no falla nunca hacia afuera).
  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        options.onClipboardCopy?.();
        return true;
      }
    } catch {
      /* ignorar: clipboard puede estar bloqueado en IAB */
    }
    return false;
  };

  // ── Android: Intent URI hacia Chrome ──
  if (isAndroid()) {
    const cleanUrl = url.replace(/^https?:\/\//i, "");
    const intentUrl =
      `intent://${cleanUrl}` +
      `#Intent;scheme=https;package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(url)};end`;
    window.location.href = intentUrl;
    return { method: "android-intent", clipboardCopied: false };
  }

  // ── iOS: intentar x-safari-https + copiar al portapapeles ──
  if (isIOS()) {
    // Copiar PRIMERO (mientras el gesto de usuario sigue activo),
    // luego intentar la apertura.
    const clipboardCopied = await copyToClipboard();
    try {
      window.location.href = `x-safari-${url}`;
    } catch {
      /* ignorar */
    }
    return { method: "ios-safari", clipboardCopied };
  }

  // ── Desktop / otros ──
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) {
    const clipboardCopied = await copyToClipboard();
    return { method: "none", clipboardCopied };
  }
  return { method: "window-open", clipboardCopied: false };
}

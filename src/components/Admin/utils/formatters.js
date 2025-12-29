/**
 * Utilidades de formateo para el panel de administración
 */

/**
 * Formatea una fecha a un string legible en español
 * @param {string|Date} dateString - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatDate(dateString) {
  if (!dateString) return "Fecha no disponible";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formatea una fecha con hora
 * @param {string|Date} dateString - Fecha a formatear
 * @returns {string} Fecha y hora formateadas
 */
export function formatDateTime(dateString) {
  if (!dateString) return "Fecha no disponible";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Trunca un texto a un número máximo de caracteres
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

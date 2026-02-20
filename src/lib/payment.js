/**
 * @fileoverview Servicio de pagos para Extrovertidos
 *
 * Maneja la comunicación con las Edge Functions de pago
 * y la redirección a Transbank Webpay Plus.
 *
 * SEGURIDAD:
 * - Nunca se manejan credenciales de Transbank aquí
 * - Los montos se validan en el servidor, no en el frontend
 * - El token de sesión se envía via Authorization header
 */

import { supabase } from "./supabase";

// ──────────────────────────────────────────────
// CONSTANTES
// ──────────────────────────────────────────────

/**
 * Mapeo de IDs de planes del frontend a plan_type del backend
 */
export const PLAN_MAP = {
  unica: "panorama_unica",
  pack4: "panorama_pack4",
  ilimitado: "panorama_ilimitado",
  superguia: "superguia",
};

/**
 * Estados posibles del resultado de pago
 */
export const PAYMENT_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
  ABORTED: "aborted",
  ERROR: "error",
};

// ──────────────────────────────────────────────
// FUNCIONES PRINCIPALES
// ──────────────────────────────────────────────

/**
 * Inicia el proceso de pago llamando a la Edge Function
 * y redirigiendo al usuario a Transbank.
 *
 * @param {Object} params - Parámetros del pago
 * @param {string|null} params.panoramaPlan - ID del plan de panorama ('unica', 'pack4', 'ilimitado') o null
 * @param {boolean} params.addSuperguia - Si incluye plan Superguía
 * @param {string|null} params.resourceId - UUID del negocio (requerido si addSuperguia=true)
 * @returns {Promise<void>} - Redirige al usuario a Transbank
 * @throws {PaymentError} - Si hay un error al iniciar el pago
 */
export async function initiatePayment({
  panoramaPlan,
  addSuperguia,
  resourceId,
}) {
  // Obtener sesión actual para el JWT
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new PaymentError(
      "Debes iniciar sesión para realizar un pago",
      "AUTH_REQUIRED",
    );
  }

  // Preparar el body para la Edge Function
  const requestBody = {
    panorama_plan: panoramaPlan || null,
    add_superguia: Boolean(addSuperguia),
    resource_id: resourceId || null,
  };

  // Llamar a la Edge Function create-payment
  const { data, error } = await supabase.functions.invoke("create-payment", {
    body: requestBody,
  });

  if (error) {
    console.error("[Payment] Error al crear pago:", error);
    throw new PaymentError(
      error.message || "Error al iniciar el pago",
      "CREATE_FAILED",
    );
  }

  if (!data || !data.token || !data.url) {
    throw new PaymentError(
      "Respuesta inválida del servidor de pago",
      "INVALID_RESPONSE",
    );
  }

  // Redirigir a Transbank mediante form POST
  redirectToTransbank(data.url, data.token);
}

/**
 * Consulta el estado de una transacción.
 *
 * @param {string} buyOrder - El buy_order de la transacción
 * @returns {Promise<Object>} - Estado de la transacción
 */
export async function getPaymentStatus(buyOrder) {
  const { data, error } = await supabase.functions.invoke("payment-status", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: null,
    // Supabase functions.invoke no soporta query params directamente,
    // así que los pasamos en la URL personalizada
  });

  // Fallback: usar fetch directo con query params
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new PaymentError("Sesión expirada", "AUTH_REQUIRED");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(
    `${supabaseUrl}/functions/v1/payment-status?buy_order=${encodeURIComponent(buyOrder)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new PaymentError(
      errorData.error || "Error al consultar el estado del pago",
      "STATUS_FAILED",
    );
  }

  return response.json();
}

/**
 * Obtiene el historial de transacciones del usuario actual.
 *
 * @returns {Promise<Array>} - Lista de transacciones
 */
export async function getPaymentHistory() {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, buy_order, amount, status, items, authorization_code, card_last_four, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Payment] Error al obtener historial:", error);
    throw new PaymentError(
      "Error al cargar el historial de pagos",
      "HISTORY_FAILED",
    );
  }

  return data || [];
}

// ──────────────────────────────────────────────
// UTILIDADES
// ──────────────────────────────────────────────

/**
 * Redirige al usuario a Transbank Webpay mediante un form POST oculto.
 * Transbank requiere que el token_ws se envíe como POST form data.
 *
 * @param {string} url - URL de Transbank para el pago
 * @param {string} token - Token de la transacción
 */
function redirectToTransbank(url, token) {
  // Crear formulario oculto
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.style.display = "none";

  // Agregar token como campo hidden
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "token_ws";
  input.value = token;

  form.appendChild(input);
  document.body.appendChild(form);

  // Enviar formulario (redirige al usuario a Transbank)
  form.submit();
}

/**
 * Parsea los query params de la URL de retorno de pago.
 *
 * @param {string} search - window.location.search
 * @returns {Object} - Parámetros parseados
 */
export function parsePaymentResult(search) {
  const params = new URLSearchParams(search);

  return {
    status: params.get("status") || "error",
    buyOrder: params.get("buy_order") || "",
    authorizationCode: params.get("authorization_code") || "",
    amount: params.get("amount") ? parseInt(params.get("amount"), 10) : null,
    message: params.get("message") || "",
  };
}

/**
 * Formatea un monto en CLP
 *
 * @param {number} amount - Monto en CLP
 * @returns {string} - Monto formateado (ej: "$39.990")
 */
export function formatCLP(amount) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ──────────────────────────────────────────────
// ERROR CLASS
// ──────────────────────────────────────────────

/**
 * Error personalizado para el flujo de pagos
 */
export class PaymentError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
  }
}

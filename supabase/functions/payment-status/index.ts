// ============================================
// EDGE FUNCTION: payment-status
// GET /functions/v1/payment-status?buy_order=XXX
//
// Consulta el estado de una transacción de pago.
// Útil para verificar el estado desde el frontend
// sin depender de los query params del redirect.
//
// Requiere: JWT de Supabase Auth (usuario autenticado)
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ──────────────────────────────────────────────
// CONFIGURACIÓN
// ──────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Transbank Webpay Plus REST API v1.2
const TRANSBANK_API = {
  integration: "https://webpay3gint.transbank.cl",
  production: "https://webpay3g.transbank.cl",
  transactionPath: "/rswebpaytransaction/api/webpay/v1.2/transactions",
};

/**
 * Respuesta JSON con CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Obtiene configuración de Transbank desde secrets
 */
function getTransbankConfig() {
  const commerceCode = Deno.env.get("TRANSBANK_COMMERCE_CODE");
  const apiKeySecret = Deno.env.get("TRANSBANK_SECRET");
  const environment = Deno.env.get("TRANSBANK_ENVIRONMENT") || "integration";

  const baseUrl =
    environment === "production"
      ? TRANSBANK_API.production
      : TRANSBANK_API.integration;

  return { commerceCode, apiKeySecret, baseUrl };
}

// ──────────────────────────────────────────────
// HANDLER PRINCIPAL
// ──────────────────────────────────────────────

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  try {
    // ── 1. Validar JWT del usuario ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Verificar identidad del usuario
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Token de sesión inválido" }, 401);
    }

    // ── 2. Obtener buy_order del query string ──
    const url = new URL(req.url);
    const buyOrder = url.searchParams.get("buy_order");

    if (!buyOrder) {
      return jsonResponse(
        { error: "Parámetro buy_order requerido" },
        400
      );
    }

    // ── 3. Buscar transacción en la DB ──
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: transaction, error: txError } = await supabaseAdmin
      .from("transactions")
      .select(
        `
        id,
        buy_order,
        amount,
        status,
        items,
        response_code,
        authorization_code,
        card_last_four,
        error_message,
        created_at,
        updated_at,
        user_id
      `
      )
      .eq("buy_order", buyOrder)
      .single();

    if (txError || !transaction) {
      return jsonResponse({ error: "Transacción no encontrada" }, 404);
    }

    // ── 4. Verificar que la transacción pertenece al usuario ──
    if (transaction.user_id !== user.id) {
      return jsonResponse({ error: "No autorizado" }, 403);
    }

    // ── 5. Si la transacción está en processing, verificar con Transbank ──
    if (transaction.status === "processing") {
      // Intentar consultar el estado en Transbank
      try {
        const tokenWsResult = await supabaseAdmin
          .from("transactions")
          .select("token_ws")
          .eq("buy_order", buyOrder)
          .single();

        if (tokenWsResult.data?.token_ws) {
          const tbkConfig = getTransbankConfig();
          const statusUrl = `${tbkConfig.baseUrl}${TRANSBANK_API.transactionPath}/${tokenWsResult.data.token_ws}`;

          const tbkResponse = await fetch(statusUrl, {
            method: "GET",
            headers: {
              "Tbk-Api-Key-Id": tbkConfig.commerceCode,
              "Tbk-Api-Key-Secret": tbkConfig.apiKeySecret,
              "Content-Type": "application/json",
            },
          });

          if (tbkResponse.ok) {
            const tbkStatus = await tbkResponse.json();
            // Actualizar con info de Transbank si disponible
            transaction.transbank_status = tbkStatus.status;
          }
        }
      } catch {
        // Si falla la consulta a Transbank, seguir con lo que tenemos en DB
        console.warn(
          "[payment-status] No se pudo consultar estado en Transbank"
        );
      }
    }

    // ── 6. Retornar estado (sin datos sensibles) ──
    // Eliminar user_id de la respuesta
    const { user_id: _uid, ...safeTransaction } = transaction;

    return jsonResponse({
      transaction: safeTransaction,
    });
  } catch (error) {
    console.error("[payment-status] Error:", error);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});

// ============================================
// EDGE FUNCTION: create-payment
// POST /functions/v1/create-payment
//
// Inicia una transacción de pago con Transbank Webpay Plus.
// Crea suscripciones en estado 'pendiente' y registra
// la transacción en la tabla de auditoría.
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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Transbank Webpay Plus REST API v1.2
const TRANSBANK_API = {
  integration: "https://webpay3gint.transbank.cl",
  production: "https://webpay3g.transbank.cl",
  // Endpoint para Webpay Plus (no confundir con OneClick que usa /api/oneclick/)
  transactionPath: "/rswebpaytransaction/api/webpay/v1.2/transactions",
};

// Precios validados server-side (NUNCA confiar en el frontend)
const PLAN_PRICES = {
  panorama_unica: 25000,
  panorama_pack4: 39990,
  panorama_ilimitado: 70000,
  superguia: 15000,
};

// Publicaciones incluidas por plan
const PLAN_PUBLICATIONS = {
  panorama_unica: 1,
  panorama_pack4: 4,
  panorama_ilimitado: 0, // 0 = ilimitado
  superguia: 0,
};

// Mapeo de IDs frontend → enum de base de datos
const PLAN_ID_MAP = {
  unica: "panorama_unica",
  pack4: "panorama_pack4",
  ilimitado: "panorama_ilimitado",
  superguia: "superguia",
};

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

/**
 * Genera un buy_order único para Transbank.
 * Formato: EXT-{userId6}-{timestamp36}-{random} (max 26 chars)
 */
function generateBuyOrder(userId) {
  const userPrefix = userId.replace(/-/g, "").substring(0, 6);
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `EXT${userPrefix}${timestamp}${random}`.substring(0, 26);
}

/**
 * Genera un session_id único (max 61 chars)
 */
function generateSessionId(userId) {
  return `s-${userId.substring(0, 8)}-${Date.now()}`.substring(0, 61);
}

/**
 * Obtiene la configuración de Transbank desde secrets
 */
function getTransbankConfig() {
  const commerceCode = Deno.env.get("TRANSBANK_COMMERCE_CODE");
  const apiKeySecret = Deno.env.get("TRANSBANK_SECRET");
  const environment = Deno.env.get("TRANSBANK_ENVIRONMENT") || "integration";

  if (!commerceCode || !apiKeySecret) {
    throw new Error("Credenciales de Transbank no configuradas");
  }

  const baseUrl =
    environment === "production"
      ? TRANSBANK_API.production
      : TRANSBANK_API.integration;

  return { commerceCode, apiKeySecret, baseUrl };
}

/**
 * Respuesta JSON con CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ──────────────────────────────────────────────
// HANDLER PRINCIPAL
// ──────────────────────────────────────────────

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
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

    // Cliente con JWT del usuario (para verificar identidad)
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

    // Cliente con service_role (para operaciones de DB sin RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // ── 2. Parsear y validar el body ──
    const body = await req.json();
    const { panorama_plan, add_superguia, resource_id } = body;

    // Al menos un plan debe estar seleccionado
    if (!panorama_plan && !add_superguia) {
      return jsonResponse(
        { error: "Debes seleccionar al menos un plan" },
        400
      );
    }

    // Validar plan de panorama (si existe)
    let panoramaPlanType = null;
    if (panorama_plan) {
      panoramaPlanType = PLAN_ID_MAP[panorama_plan] || panorama_plan;
      if (!PLAN_PRICES[panoramaPlanType]) {
        return jsonResponse({ error: "Plan de panorama inválido" }, 400);
      }
    }

    // Validar resource_id para superguia
    if (add_superguia && resource_id) {
      const { data: business, error: bizError } = await supabaseAdmin
        .from("businesses")
        .select("id, user_id")
        .eq("id", resource_id)
        .single();

      if (bizError || !business) {
        return jsonResponse({ error: "Negocio no encontrado" }, 404);
      }

      if (business.user_id !== user.id) {
        return jsonResponse(
          { error: "No puedes pagar por un negocio que no te pertenece" },
          403
        );
      }
    }

    // ── 3. Verificar que no exista suscripción activa duplicada ──
    if (panoramaPlanType) {
      const { data: existingSub } = await supabaseAdmin
        .rpc("check_active_subscription", {
          p_user_id: user.id,
          p_plan: panoramaPlanType,
        });

      if (existingSub && existingSub.length > 0) {
        return jsonResponse(
          {
            error: `Ya tienes un plan ${panorama_plan} activo. Espera a que expire antes de comprar otro.`,
          },
          409
        );
      }
    }

    if (add_superguia) {
      const { data: existingSuperguia } = await supabaseAdmin
        .rpc("check_active_subscription", {
          p_user_id: user.id,
          p_plan: "superguia",
        });

      if (existingSuperguia && existingSuperguia.length > 0) {
        return jsonResponse(
          {
            error:
              "Ya tienes un plan Superguía activo. Espera a que expire antes de comprar otro.",
          },
          409
        );
      }
    }

    // ── 4. Calcular monto total (server-side) ──
    let totalAmount = 0;
    const items = [];

    if (panoramaPlanType) {
      items.push({
        plan: panoramaPlanType,
        amount: PLAN_PRICES[panoramaPlanType],
      });
      totalAmount += PLAN_PRICES[panoramaPlanType];
    }

    if (add_superguia) {
      items.push({
        plan: "superguia",
        amount: PLAN_PRICES.superguia,
        ...(resource_id ? { resource_id } : {}),
      });
      totalAmount += PLAN_PRICES.superguia;
    }

    // ── 5. Crear suscripciones en estado 'pendiente' ──
    const subscriptionIds = [];

    for (const item of items) {
      const { data: sub, error: subError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan: item.plan,
          estado: "pendiente",
          monto: item.amount,
          publicaciones_total: PLAN_PUBLICATIONS[item.plan] ?? 0,
          publicaciones_usadas: 0,
        })
        .select("id")
        .single();

      if (subError) {
        console.error("Error creando suscripción:", subError);
        // Rollback: eliminar suscripciones ya creadas
        if (subscriptionIds.length > 0) {
          await supabaseAdmin
            .from("subscriptions")
            .delete()
            .in("id", subscriptionIds);
        }
        return jsonResponse(
          { error: "Error al crear la suscripción" },
          500
        );
      }

      item.subscription_id = sub.id;
      subscriptionIds.push(sub.id);
    }

    // ── 6. Crear registro de transacción ──
    const buyOrder = generateBuyOrder(user.id);
    const sessionId = generateSessionId(user.id);

    const { data: transaction, error: txError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        subscription_ids: subscriptionIds,
        buy_order: buyOrder,
        session_id: sessionId,
        amount: totalAmount,
        status: "pending",
        items,
      })
      .select("id")
      .single();

    if (txError) {
      console.error("Error creando transacción:", txError);
      // Rollback: eliminar suscripciones
      await supabaseAdmin
        .from("subscriptions")
        .delete()
        .in("id", subscriptionIds);
      return jsonResponse(
        { error: "Error al registrar la transacción" },
        500
      );
    }

    // ── 7. Llamar a Transbank para crear la transacción ──
    const tbkConfig = getTransbankConfig();
    const returnUrl = `${supabaseUrl}/functions/v1/confirm-payment`;

    const tbkCreateUrl = `${tbkConfig.baseUrl}${TRANSBANK_API.transactionPath}`;

    console.log(
      `[create-payment] Creando transacción Transbank: buy_order=${buyOrder}, amount=${totalAmount}, user=${user.id}`
    );

    const tbkResponse = await fetch(tbkCreateUrl, {
      method: "POST",
      headers: {
        "Tbk-Api-Key-Id": tbkConfig.commerceCode,
        "Tbk-Api-Key-Secret": tbkConfig.apiKeySecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        buy_order: buyOrder,
        session_id: sessionId,
        amount: totalAmount,
        return_url: returnUrl,
      }),
    });

    if (!tbkResponse.ok) {
      const errorText = await tbkResponse.text();
      console.error(
        `[create-payment] Error Transbank (${tbkResponse.status}):`,
        errorText
      );

      // Marcar transacción como fallida
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed",
          error_message: `Transbank HTTP ${tbkResponse.status}: ${errorText.substring(0, 200)}`,
        })
        .eq("id", transaction.id);

      // Marcar suscripciones como rechazadas
      await supabaseAdmin
        .from("subscriptions")
        .update({
          estado: "rechazada",
          notas: `Error al crear transacción Transbank: ${tbkResponse.status}`,
        })
        .in("id", subscriptionIds);

      return jsonResponse(
        { error: "Error al conectar con el procesador de pago" },
        502
      );
    }

    const tbkData = await tbkResponse.json();

    // ── 8. Actualizar transacción con el token de Transbank ──
    await supabaseAdmin
      .from("transactions")
      .update({
        token_ws: tbkData.token,
        status: "processing",
      })
      .eq("id", transaction.id);

    console.log(
      `[create-payment] Transacción creada exitosamente: buy_order=${buyOrder}, token=***${tbkData.token?.substring(tbkData.token.length - 8)}`
    );

    // ── 9. Retornar datos al frontend para redirigir ──
    return jsonResponse({
      token: tbkData.token,
      url: tbkData.url,
      buy_order: buyOrder,
      amount: totalAmount,
    });
  } catch (error) {
    console.error("[create-payment] Error inesperado:", error);
    return jsonResponse({ error: "Error interno del servidor" }, 500);
  }
});

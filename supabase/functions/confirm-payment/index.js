// ============================================
// EDGE FUNCTION: confirm-payment
// POST /functions/v1/confirm-payment
//
// Recibe el retorno de Transbank después de que el usuario
// completa (o abandona) el pago. Esta función:
// 1. Lee los parámetros de Transbank (token_ws o TBK_TOKEN)
// 2. Confirma (commit) la transacción con Transbank
// 3. Actualiza la base de datos según el resultado
// 4. Redirige al frontend con el estado del pago
//
// NO requiere JWT: es llamada por redirección del navegador
// desde Transbank (form POST), no por AJAX.
// La autenticidad se valida contra la DB + API de Transbank.
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ──────────────────────────────────────────────
// CONFIGURACIÓN
// ──────────────────────────────────────────────

// Transbank Webpay Plus REST API v1.2
const TRANSBANK_API = {
  integration: "https://webpay3gint.transbank.cl",
  production: "https://webpay3g.transbank.cl",
  transactionPath: "/rswebpaytransaction/api/webpay/v1.2/transactions",
};

/**
 * Obtiene configuración de Transbank desde secrets
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
 * Sanitiza la respuesta de Transbank para almacenarla.
 * Preserva datos útiles, elimina información sensible.
 */
function sanitizeTransbankResponse(response) {
  const sanitized = { ...response };
  if (sanitized.card_detail && typeof sanitized.card_detail === "object") {
    sanitized.card_detail = {
      card_number: sanitized.card_detail.card_number || "****",
    };
  }
  return sanitized;
}

/**
 * Redirige al frontend con parámetros de resultado
 */
function redirectToFrontend(params) {
  const baseUrl = Deno.env.get("BASE_URL") || "https://www.extrovertidos.cl";
  const queryString = new URLSearchParams(params).toString();
  const redirectUrl = `${baseUrl}/payment/result?${queryString}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl,
    },
  });
}

/**
 * Marca suscripciones como rechazadas de forma segura
 */
async function rejectSubscriptions(supabaseAdmin, subscriptionIds, reason) {
  if (!Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
    return;
  }
  await supabaseAdmin
    .from("subscriptions")
    .update({
      estado: "rechazada",
      notas: reason,
    })
    .in("id", subscriptionIds);
}

/**
 * Envía un email de resultado de pago al usuario.
 * Non-blocking: no lanza error si falla.
 */
async function sendPaymentEmail(supabaseAdmin, userId, type, paymentData) {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("nombre, email")
      .eq("id", userId)
      .single();

    if (!profile?.email) {
      console.warn("[confirm-payment] Sin email para usuario:", userId);
      return;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({
        to: profile.email,
        type,
        data: {
          nombre: profile.nombre || "",
          ...paymentData,
        },
      }),
    });
  } catch (err) {
    console.error("[confirm-payment] Error enviando email de pago:", err);
  }
}

// ──────────────────────────────────────────────
// HANDLER PRINCIPAL
// ──────────────────────────────────────────────

Deno.serve(async (req) => {
  // Esta función recibe POST de Transbank (form-urlencoded)
  // y también OPTIONS del navegador

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  // Transbank puede redirigir con POST o GET
  if (req.method !== "POST" && req.method !== "GET") {
    return redirectToFrontend({
      status: "error",
      message: "Método no permitido",
    });
  }

  // Supabase admin client (service_role, bypasa RLS)
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ── 1. Leer parámetros de Transbank ──
    let tokenWs = null;
    let tbkToken = null;
    let tbkOrdenCompra = null;
    let tbkIdSesion = null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      tokenWs = url.searchParams.get("token_ws");
      tbkToken = url.searchParams.get("TBK_TOKEN");
      tbkOrdenCompra = url.searchParams.get("TBK_ORDEN_COMPRA");
      tbkIdSesion = url.searchParams.get("TBK_ID_SESION");
    } else {
      // POST: leer del body según content-type
      const contentType = req.headers.get("content-type") || "";
      let params;

      if (contentType.includes("application/json")) {
        const body = await req.json();
        tokenWs = body.token_ws || null;
        tbkToken = body.TBK_TOKEN || null;
        tbkOrdenCompra = body.TBK_ORDEN_COMPRA || null;
        tbkIdSesion = body.TBK_ID_SESION || null;
      } else {
        // form-urlencoded o cualquier otro formato
        const formBody = await req.text();
        params = new URLSearchParams(formBody);
        tokenWs = params.get("token_ws");
        tbkToken = params.get("TBK_TOKEN");
        tbkOrdenCompra = params.get("TBK_ORDEN_COMPRA");
        tbkIdSesion = params.get("TBK_ID_SESION");
      }
    }

    // ── 2. Caso: Usuario abandonó / Timeout ──
    // Transbank envía TBK_TOKEN (sin token_ws) cuando el usuario
    // cancela o el tiempo de espera se agota.
    if (!tokenWs && tbkToken) {
      console.log(
        `[confirm-payment] Usuario abandonó el pago. TBK_ORDEN_COMPRA=${tbkOrdenCompra}`,
      );

      if (tbkOrdenCompra) {
        const { data: tx } = await supabaseAdmin
          .from("transactions")
          .select("id, subscription_ids, status")
          .eq("buy_order", tbkOrdenCompra)
          .single();

        if (tx && tx.status !== "completed") {
          await supabaseAdmin
            .from("transactions")
            .update({
              status: "failed",
              error_message: "Pago cancelado por el usuario",
            })
            .eq("id", tx.id);

          await rejectSubscriptions(
            supabaseAdmin,
            tx.subscription_ids,
            "Pago cancelado por el usuario en Transbank",
          );
        }
      }

      return redirectToFrontend({
        status: "aborted",
        buy_order: tbkOrdenCompra || "",
      });
    }

    // ── 3. Caso: Pago completado (necesita commit) ──
    if (!tokenWs) {
      console.error("[confirm-payment] No se recibió token_ws ni TBK_TOKEN");
      return redirectToFrontend({
        status: "error",
        message: "No se recibieron datos de Transbank",
      });
    }

    // Buscar la transacción en nuestra DB por token_ws
    const { data: transaction, error: txLookupError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("token_ws", tokenWs)
      .single();

    if (txLookupError || !transaction) {
      console.error(
        `[confirm-payment] Transacción no encontrada para token: ***${tokenWs.substring(tokenWs.length - 8)}`,
      );
      return redirectToFrontend({
        status: "error",
        message: "Transacción no encontrada",
      });
    }

    // Verificar idempotencia: si ya se procesó, redirigir con el resultado previo
    if (transaction.status === "completed") {
      console.log(
        `[confirm-payment] Transacción ya completada: ${transaction.buy_order}`,
      );
      return redirectToFrontend({
        status: "success",
        buy_order: transaction.buy_order,
        authorization_code: transaction.authorization_code || "",
      });
    }

    if (transaction.status === "failed" || transaction.status === "refunded") {
      console.log(
        `[confirm-payment] Transacción ya procesada como ${transaction.status}: ${transaction.buy_order}`,
      );
      return redirectToFrontend({
        status: "failed",
        buy_order: transaction.buy_order,
        message: transaction.error_message || "Pago rechazado",
      });
    }

    // ── 4. Confirmar (commit) con Transbank ──
    const tbkConfig = getTransbankConfig();
    const commitUrl = `${tbkConfig.baseUrl}${TRANSBANK_API.transactionPath}/${tokenWs}`;

    console.log(
      `[confirm-payment] Confirmando transacción: buy_order=${transaction.buy_order}`,
    );

    const tbkCommitResponse = await fetch(commitUrl, {
      method: "PUT",
      headers: {
        "Tbk-Api-Key-Id": tbkConfig.commerceCode,
        "Tbk-Api-Key-Secret": tbkConfig.apiKeySecret,
        "Content-Type": "application/json",
      },
    });

    if (!tbkCommitResponse.ok) {
      const errorText = await tbkCommitResponse.text();
      console.error(
        `[confirm-payment] Error en commit Transbank (${tbkCommitResponse.status}):`,
        errorText,
      );

      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed",
          error_message: `Error commit Transbank: ${tbkCommitResponse.status}`,
        })
        .eq("id", transaction.id);

      await rejectSubscriptions(
        supabaseAdmin,
        transaction.subscription_ids,
        `Error al confirmar pago con Transbank: ${tbkCommitResponse.status}`,
      );

      return redirectToFrontend({
        status: "error",
        buy_order: transaction.buy_order,
        message: "Error al confirmar el pago con el procesador",
      });
    }

    const tbkResult = await tbkCommitResponse.json();

    // ── 5. Validar la respuesta de Transbank ──
    // response_code === 0 significa APROBADO
    const isApproved = tbkResult.response_code === 0;

    if (isApproved) {
      // Validar que el monto coincida
      if (tbkResult.amount !== transaction.amount) {
        console.error(
          `[confirm-payment] ALERTA: Monto no coincide. Esperado: ${transaction.amount}, Recibido: ${tbkResult.amount}`,
        );
        await supabaseAdmin
          .from("transactions")
          .update({
            status: "failed",
            error_message: `Monto no coincide: esperado=${transaction.amount}, recibido=${tbkResult.amount}`,
            transbank_response: sanitizeTransbankResponse(tbkResult),
          })
          .eq("id", transaction.id);

        return redirectToFrontend({
          status: "error",
          buy_order: transaction.buy_order,
          message: "Error de validación en el monto del pago",
        });
      }

      // Validar que el buy_order coincida
      if (tbkResult.buy_order !== transaction.buy_order) {
        console.error(
          `[confirm-payment] ALERTA: buy_order no coincide. Esperado: ${transaction.buy_order}, Recibido: ${tbkResult.buy_order}`,
        );
        await supabaseAdmin
          .from("transactions")
          .update({
            status: "failed",
            error_message: "buy_order no coincide",
            transbank_response: sanitizeTransbankResponse(tbkResult),
          })
          .eq("id", transaction.id);

        return redirectToFrontend({
          status: "error",
          buy_order: transaction.buy_order,
          message: "Error de validación en la orden de compra",
        });
      }
    }

    // Extraer últimos dígitos de la tarjeta (ya enmascarados por Transbank)
    const cardLastFour = tbkResult.card_detail?.card_number || null;

    // ── 6. Actualizar transacción en DB ──
    await supabaseAdmin
      .from("transactions")
      .update({
        status: isApproved ? "completed" : "failed",
        response_code: tbkResult.response_code,
        authorization_code: isApproved ? tbkResult.authorization_code : null,
        card_last_four: cardLastFour,
        transbank_response: sanitizeTransbankResponse(tbkResult),
        error_message: isApproved
          ? null
          : `Pago rechazado (código: ${tbkResult.response_code})`,
      })
      .eq("id", transaction.id);

    // ── 7. Si el pago fue aprobado, activar suscripciones ──
    if (isApproved) {
      console.log(
        `[confirm-payment] Pago APROBADO: buy_order=${transaction.buy_order}, auth_code=${tbkResult.authorization_code}`,
      );

      const subscriptionIds = transaction.subscription_ids;

      if (Array.isArray(subscriptionIds) && subscriptionIds.length > 0) {
        const failedActivations = [];

        for (const subId of subscriptionIds) {
          try {
            const { error: rpcError } = await supabaseAdmin.rpc(
              "activate_subscription",
              {
                p_subscription_id: subId,
                p_metodo: "webpay",
                p_transaccion_id: transaction.buy_order,
                p_detalles: {
                  authorization_code: tbkResult.authorization_code,
                  payment_type_code: tbkResult.payment_type_code,
                  installments_number: tbkResult.installments_number,
                  transaction_date: tbkResult.transaction_date,
                  card_last_four: cardLastFour,
                },
              },
            );

            if (rpcError) {
              console.error(
                `[confirm-payment] RPC error activando suscripción ${subId}:`,
                rpcError,
              );
              failedActivations.push(subId);
            }
          } catch (activationError) {
            console.error(
              `[confirm-payment] Error activando suscripción ${subId}:`,
              activationError,
            );
            failedActivations.push(subId);
          }
        }

        // Fallback: activar directamente por UPDATE si el RPC falló
        if (failedActivations.length > 0) {
          console.warn(
            `[confirm-payment] Intentando fallback para ${failedActivations.length} suscripciones fallidas`,
          );

          for (const subId of failedActivations) {
            try {
              // Verificar estado actual
              const { data: subData } = await supabaseAdmin
                .from("subscriptions")
                .select("id, plan, estado")
                .eq("id", subId)
                .single();

              if (
                subData &&
                (subData.estado === "pendiente" ||
                  subData.estado === "rechazada")
              ) {
                // Determinar publicaciones según plan
                const pubTotal = {
                  panorama_unica: 1,
                  panorama_pack4: 4,
                  panorama_ilimitado: 0,
                  superguia: 1,
                };

                const { error: updateError } = await supabaseAdmin
                  .from("subscriptions")
                  .update({
                    estado: "activa",
                    fecha_inicio: new Date().toISOString(),
                    fecha_fin: new Date(
                      Date.now() + 30 * 24 * 60 * 60 * 1000,
                    ).toISOString(),
                    publicaciones_total: pubTotal[subData.plan] ?? 0,
                    publicaciones_usadas: 0,
                    metodo_pago: "webpay",
                    transaccion_id: transaction.buy_order,
                    detalles_pago: {
                      authorization_code: tbkResult.authorization_code,
                      card_last_four: cardLastFour,
                      activated_via: "fallback_direct_update",
                    },
                  })
                  .eq("id", subId);

                if (updateError) {
                  console.error(
                    `[confirm-payment] Fallback también falló para ${subId}:`,
                    updateError,
                  );
                } else {
                  console.log(
                    `[confirm-payment] Suscripción ${subId} activada via fallback`,
                  );
                }
              }
            } catch (fallbackError) {
              console.error(
                `[confirm-payment] Error en fallback para ${subId}:`,
                fallbackError,
              );
            }
          }
        }
      } else {
        console.warn(
          `[confirm-payment] Pago aprobado pero sin subscription_ids: buy_order=${transaction.buy_order}`,
        );
      }

      // Enviar boleta por email (non-blocking)
      await sendPaymentEmail(
        supabaseAdmin,
        transaction.user_id,
        "pago_exitoso",
        {
          buy_order: transaction.buy_order,
          amount: transaction.amount,
          authorization_code: tbkResult.authorization_code || "",
          card_last_four: cardLastFour,
          items: transaction.items || [],
          fecha: new Date().toISOString(),
        },
      );

      return redirectToFrontend({
        status: "success",
        buy_order: transaction.buy_order,
        authorization_code: tbkResult.authorization_code || "",
        amount: String(transaction.amount),
      });
    }

    // ── 8. Pago RECHAZADO por el banco ──
    console.log(
      `[confirm-payment] Pago RECHAZADO: buy_order=${transaction.buy_order}, response_code=${tbkResult.response_code}`,
    );

    await rejectSubscriptions(
      supabaseAdmin,
      transaction.subscription_ids,
      `Pago rechazado por Transbank (código: ${tbkResult.response_code})`,
    );

    // Enviar email de pago fallido (non-blocking)
    await sendPaymentEmail(supabaseAdmin, transaction.user_id, "pago_fallido", {
      buy_order: transaction.buy_order,
      amount: transaction.amount,
      items: transaction.items || [],
    });

    return redirectToFrontend({
      status: "failed",
      buy_order: transaction.buy_order,
      message: "El pago fue rechazado por tu banco",
    });
  } catch (error) {
    console.error("[confirm-payment] Error inesperado:", error);
    return redirectToFrontend({
      status: "error",
      message: "Error interno al procesar el pago",
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ===== HELPERS =====
function formatCLPEmail(amount) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatPlanLabel(plan) {
  const labels = {
    panorama_unica: "Publicación Única",
    panorama_pack4: "Pack 4 Publicaciones",
    panorama_ilimitado: "Plan Ilimitado",
    superguia: "Superguía",
  };
  return labels[plan] || plan;
}

function formatDateCL(isoString) {
  return new Date(isoString || Date.now()).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ===== TEMPLATES DE EMAIL =====
const templates = {
  pago_exitoso: (nombre, data) => {
    const itemsHtml = (data.items || [])
      .map(
        (item) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#e0e0e0;">${formatPlanLabel(item.plan)}</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#22c55e;text-align:right;font-weight:600;">${formatCLPEmail(item.amount)}</td>
          </tr>`,
      )
      .join("");

    return {
      subject: "✅ Boleta de pago — Extrovertidos",
      html: `
        <div style="font-family:'Figtree',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;">
          <div style="background:#111111;padding:16px;text-align:center;border-bottom:1px solid #1e1e1e;">
            <img src="https://extrovertidos.cl/img/Logo_con_r.png" alt="Extrovertidos" style="height:50px;" />
          </div>
          <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:30px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:26px;">¡Pago exitoso! ✅</h1>
            <p style="color:#dcfce7;margin:8px 0 0;font-size:14px;">Tu plan ha sido activado correctamente</p>
          </div>
          <div style="padding:30px;color:#e0e0e0;">
            <p style="font-size:17px;margin-top:0;">Hola <strong style="color:#22c55e;">${nombre || "Extrovertido"}</strong>,</p>
            <p>Gracias por tu compra. A continuación encontrarás el detalle de tu pago:</p>

            <!-- Detalle de la boleta -->
            <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin:20px 0;">
              <h3 style="color:#fff;margin:0 0 16px;font-size:16px;text-transform:uppercase;letter-spacing:0.05em;">Boleta de pago</h3>
              <table style="width:100%;border-collapse:collapse;">
                ${itemsHtml}
                <tr>
                  <td style="padding:14px 0 0;color:#aaa;font-size:13px;">N° Orden</td>
                  <td style="padding:14px 0 0;color:#fff;text-align:right;font-family:monospace;font-size:13px;">${data.buy_order || "—"}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#aaa;font-size:13px;">Código autorización</td>
                  <td style="padding:6px 0;color:#fff;text-align:right;font-family:monospace;font-size:13px;">${data.authorization_code || "—"}</td>
                </tr>
                ${
                  data.card_last_four
                    ? `
                <tr>
                  <td style="padding:6px 0;color:#aaa;font-size:13px;">Tarjeta</td>
                  <td style="padding:6px 0;color:#fff;text-align:right;font-size:13px;">**** **** **** ${data.card_last_four}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding:6px 0;color:#aaa;font-size:13px;">Fecha</td>
                  <td style="padding:6px 0;color:#fff;text-align:right;font-size:13px;">${formatDateCL(data.fecha)}</td>
                </tr>
                <tr>
                  <td style="padding:16px 0 4px;color:#fff;font-size:16px;font-weight:700;border-top:2px solid #333;">Total pagado</td>
                  <td style="padding:16px 0 4px;color:#22c55e;font-size:20px;font-weight:700;text-align:right;border-top:2px solid #333;">${formatCLPEmail(data.amount)}</td>
                </tr>
              </table>
            </div>

            <div style="text-align:center;margin:28px 0;">
              <a href="https://extrovertidos.cl/perfil" style="background:#22c55e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Ver mi perfil</a>
            </div>
            <p style="color:#666;font-size:12px;text-align:center;">Guarda este correo como comprobante de tu compra.</p>
            <p style="color:#888;font-size:13px;text-align:center;margin-top:20px;">— El equipo de Extrovertidos</p>
          </div>
        </div>
      `,
    };
  },

  pago_fallido: (nombre, data) => ({
    subject: "❌ No pudimos procesar tu pago",
    html: `
      <div style="font-family:'Figtree',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;">
        <div style="background:#111111;padding:16px;text-align:center;border-bottom:1px solid #1e1e1e;">
          <img src="https://extrovertidos.cl/img/Logo_con_r.png" alt="Extrovertidos" style="height:50px;" />
        </div>
        <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Pago no procesado ❌</h1>
        </div>
        <div style="padding:30px;color:#e0e0e0;">
          <p style="font-size:17px;margin-top:0;">Hola <strong style="color:#ef4444;">${nombre || "Extrovertido"}</strong>,</p>
          <p>Lamentablemente tu pago no pudo ser procesado. No se realizó ningún cargo a tu cuenta.</p>
          <div style="background:#1a1a1a;border-left:4px solid #ef4444;padding:15px;border-radius:4px;margin:20px 0;">
            <p style="margin:0 0 6px;color:#aaa;font-size:13px;">N° Orden: <code style="color:#fff;">${data.buy_order || "—"}</code></p>
            <p style="margin:0;color:#aaa;font-size:13px;">Monto: <strong style="color:#fff;">${data.amount ? formatCLPEmail(data.amount) : "—"}</strong></p>
          </div>
          <p><strong>¿Qué puedo hacer?</strong></p>
          <ul style="line-height:2;color:#ccc;">
            <li>Verifica que tu tarjeta tenga fondos suficientes</li>
            <li>Asegúrate de que tu banco no haya bloqueado la transacción</li>
            <li>Intenta con otra tarjeta o medio de pago</li>
          </ul>
          <div style="text-align:center;margin:28px 0;">
            <a href="https://extrovertidos.cl/planes" style="background:#ff6600;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Intentar nuevamente</a>
          </div>
          <p style="color:#888;font-size:13px;text-align:center;margin-top:20px;">— El equipo de Extrovertidos</p>
        </div>
      </div>
    `,
  }),

  publicacion_pendiente: (nombre, titulo) => ({
    subject: "⏳ Tu publicación está en revisión",
    html: `
      <div style="font-family:'Figtree',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;">
        <div style="background:#111111;padding:16px;text-align:center;border-bottom:1px solid #1e1e1e;">
          <img src="https://extrovertidos.cl/img/Logo_con_r.png" alt="Extrovertidos" style="height:50px;" />
        </div>
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Publicación en Revisión ⏳</h1>
        </div>
        <div style="padding:30px;color:#e0e0e0;">
          <p style="font-size:18px;margin-top:0;">Hola <strong style="color:#f59e0b;">${nombre || "Extrovertido"}</strong>,</p>
          <p>Recibimos tu publicación <strong>"${titulo}"</strong> y está siendo revisada por nuestro equipo.</p>
          <p>Te notificaremos por correo cuando sea aprobada o si necesitamos algún cambio.</p>
          <div style="background:#1a1a1a;border-left:4px solid #f59e0b;padding:15px;border-radius:4px;margin:20px 0;">
            <strong>¿Cuánto demora?</strong> Normalmente revisamos en menos de 24 horas.
          </div>
          <p style="color:#888;font-size:13px;text-align:center;margin-top:30px;">— El equipo de Extrovertidos</p>
        </div>
      </div>
    `,
  }),

  negocio_pendiente: (nombre, titulo) => ({
    subject: "⏳ Tu negocio está en revisión",
    html: `
      <div style="font-family:'Figtree',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;">
        <div style="background:#111111;padding:16px;text-align:center;border-bottom:1px solid #1e1e1e;">
          <img src="https://extrovertidos.cl/img/Logo_con_r.png" alt="Extrovertidos" style="height:50px;" />
        </div>
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Negocio en Revisión ⏳</h1>
        </div>
        <div style="padding:30px;color:#e0e0e0;">
          <p style="font-size:18px;margin-top:0;">Hola <strong style="color:#f59e0b;">${nombre || "Extrovertido"}</strong>,</p>
          <p>Recibimos tu negocio <strong>"${titulo}"</strong> y está siendo revisado por nuestro equipo.</p>
          <p>Te notificaremos por correo cuando sea aprobado o si necesitamos algún cambio.</p>
          <div style="background:#1a1a1a;border-left:4px solid #f59e0b;padding:15px;border-radius:4px;margin:20px 0;">
            <strong>¿Cuánto demora?</strong> Normalmente revisamos en menos de 24 horas.
          </div>
          <p style="color:#888;font-size:13px;text-align:center;margin-top:30px;">— El equipo de Extrovertidos</p>
        </div>
      </div>
    `,
  }),

  welcome: (nombre) => ({
    subject: "¡Bienvenido a Extrovertidos! 🎉",
    html: `
      <div style="font-family:'Figtree',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;">
        <div style="background:#111111;padding:16px;text-align:center;border-bottom:1px solid #1e1e1e;">
          <img src="https://extrovertidos.cl/img/Logo_con_r.png" alt="Extrovertidos" style="height:50px;" />
        </div>
        <div style="background:linear-gradient(135deg,#ff6600,#ff8833);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">¡Bienvenido a Extrovertidos!</h1>
        </div>
        <div style="padding:30px;color:#e0e0e0;">
          <p style="font-size:18px;margin-top:0;">Hola <strong style="color:#ff6600;">${nombre || "Extrovertido"}</strong>,</p>
          <p>Nos alegra tenerte en la comunidad. Ahora puedes:</p>
          <ul style="line-height:2;">
            <li>🎯 Descubrir <strong>panoramas, eventos y actividades</strong> en tu ciudad</li>
            <li>📋 Explorar la <strong>Superguía de negocios y servicios</strong></li>
            <li>📣 <strong>Publicar tus propios panoramas</strong> y negocios</li>
          </ul>
          <div style="text-align:center;margin:30px 0;">
            <a href="https://extrovertidos.cl/panoramas" style="background:#ff6600;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">Explorar Panoramas</a>
          </div>
          <p style="color:#888;font-size:13px;text-align:center;margin-top:30px;">
            — El equipo de Extrovertidos
          </p>
        </div>
      </div>
    `,
  }),

  publicacion_aprobada: (nombre, titulo) => ({
    subject: "✅ Tu publicación fue aprobada",
    html: `
      <div style="font-family:'Figtree',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;">
        <div style="background:#111111;padding:16px;text-align:center;border-bottom:1px solid #1e1e1e;">
          <img src="https://extrovertidos.cl/img/Logo_con_r.png" alt="Extrovertidos" style="height:50px;" />
        </div>
        <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">¡Publicación Aprobada! ✅</h1>
        </div>
        <div style="padding:30px;color:#e0e0e0;">
          <p style="font-size:18px;margin-top:0;">Hola <strong style="color:#22c55e;">${nombre || "Extrovertido"}</strong>,</p>
          <p>Tu publicación <strong>"${titulo}"</strong> ha sido aprobada y ya es visible para todos.</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="https://extrovertidos.cl/panoramas" style="background:#22c55e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">Ver Panoramas</a>
          </div>
          <p style="color:#888;font-size:13px;text-align:center;">— El equipo de Extrovertidos</p>
        </div>
      </div>
    `,
  }),

  publicacion_rechazada: (nombre, titulo, motivo) => ({
    subject: "❌ Tu publicación fue rechazada",
    html: `
      <div style="font-family:'Figtree',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;">
        <div style="background:#111111;padding:16px;text-align:center;border-bottom:1px solid #1e1e1e;">
          <img src="https://extrovertidos.cl/img/Logo_con_r.png" alt="Extrovertidos" style="height:50px;" />
        </div>
        <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Publicación Rechazada</h1>
        </div>
        <div style="padding:30px;color:#e0e0e0;">
          <p style="font-size:18px;margin-top:0;">Hola <strong style="color:#ef4444;">${nombre || "Extrovertido"}</strong>,</p>
          <p>Lamentablemente tu publicación <strong>"${titulo}"</strong> no fue aprobada.</p>
          ${motivo ? `<div style="background:#1a1a1a;border-left:4px solid #ef4444;padding:15px;border-radius:4px;margin:20px 0;"><strong>Motivo:</strong> ${motivo}</div>` : ""}
          <p>Puedes corregirla y volver a enviarla para revisión.</p>
          <p style="color:#888;font-size:13px;text-align:center;margin-top:30px;">— El equipo de Extrovertidos</p>
        </div>
      </div>
    `,
  }),

  negocio_aprobado: (nombre, titulo) => ({
    subject: "✅ Tu negocio fue aprobado en la Superguía",
    html: `
      <div style="font-family:'Figtree',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;">
        <div style="background:#111111;padding:16px;text-align:center;border-bottom:1px solid #1e1e1e;">
          <img src="https://extrovertidos.cl/img/Logo_con_r.png" alt="Extrovertidos" style="height:50px;" />
        </div>
        <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">¡Negocio Aprobado! ✅</h1>
        </div>
        <div style="padding:30px;color:#e0e0e0;">
          <p style="font-size:18px;margin-top:0;">Hola <strong style="color:#22c55e;">${nombre || "Extrovertido"}</strong>,</p>
          <p>Tu negocio <strong>"${titulo}"</strong> ha sido aprobado y ya es visible en la Superguía.</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="https://extrovertidos.cl/superguia" style="background:#22c55e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">Ver Superguía</a>
          </div>
          <p style="color:#888;font-size:13px;text-align:center;">— El equipo de Extrovertidos</p>
        </div>
      </div>
    `,
  }),

  negocio_rechazado: (nombre, titulo, motivo) => ({
    subject: "❌ Tu negocio fue rechazado",
    html: `
      <div style="font-family:'Figtree',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;">
        <div style="background:#111111;padding:16px;text-align:center;border-bottom:1px solid #1e1e1e;">
          <img src="https://extrovertidos.cl/img/Logo_con_r.png" alt="Extrovertidos" style="height:50px;" />
        </div>
        <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Negocio Rechazado</h1>
        </div>
        <div style="padding:30px;color:#e0e0e0;">
          <p style="font-size:18px;margin-top:0;">Hola <strong style="color:#ef4444;">${nombre || "Extrovertido"}</strong>,</p>
          <p>Lamentablemente tu negocio <strong>"${titulo}"</strong> no fue aprobado.</p>
          ${motivo ? `<div style="background:#1a1a1a;border-left:4px solid #ef4444;padding:15px;border-radius:4px;margin:20px 0;"><strong>Motivo:</strong> ${motivo}</div>` : ""}
          <p>Puedes corregirlo y volver a enviarlo para revisión.</p>
          <p style="color:#888;font-size:13px;text-align:center;margin-top:30px;">— El equipo de Extrovertidos</p>
        </div>
      </div>
    `,
  }),
};

// ===== HANDLER =====
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return jsonResponse({ error: "RESEND_API_KEY no configurada" }, 500);
    }

    const { to, type, data } = await req.json();

    if (!to || !type) {
      return jsonResponse({ error: "Faltan campos: to, type" }, 400);
    }

    // Seleccionar template
    let template;
    switch (type) {
      case "pago_exitoso":
        template = templates.pago_exitoso(data?.nombre, data);
        break;
      case "pago_fallido":
        template = templates.pago_fallido(data?.nombre, data);
        break;
      case "publicacion_pendiente":
        template = templates.publicacion_pendiente(data?.nombre, data?.titulo);
        break;
      case "negocio_pendiente":
        template = templates.negocio_pendiente(data?.nombre, data?.titulo);
        break;
      case "welcome":
        template = templates.welcome(data?.nombre);
        break;
      case "publicacion_aprobada":
        template = templates.publicacion_aprobada(data?.nombre, data?.titulo);
        break;
      case "publicacion_rechazada":
        template = templates.publicacion_rechazada(
          data?.nombre,
          data?.titulo,
          data?.motivo,
        );
        break;
      case "negocio_aprobado":
        template = templates.negocio_aprobado(data?.nombre, data?.titulo);
        break;
      case "negocio_rechazado":
        template = templates.negocio_rechazado(
          data?.nombre,
          data?.titulo,
          data?.motivo,
        );
        break;
      default:
        return jsonResponse({ error: `Tipo de email no válido: ${type}` }, 400);
    }

    // Enviar con Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Extrovertidos <hola@send.extrovertidos.cl>",
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return jsonResponse(
        { error: "Error enviando email", details: resendData },
        500,
      );
    }

    return jsonResponse({ success: true, id: resendData.id });
  } catch (err) {
    console.error("send-email error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});

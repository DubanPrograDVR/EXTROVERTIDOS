// ============================================
// EDGE FUNCTION: analyze-instagram
// POST /functions/v1/analyze-instagram
//
// Extrae informacion de una URL de Instagram y 
// devuelve la informacion extraida en crudo (sin IA aun).
// 
// Requiere: JWT de Supabase Auth (usuario debe ser admin/moderador)
// ============================================

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

Deno.serve(async (req) => {
  // 1. Manejo de CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "No authorization header" }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    // Verificar si es admin/moderator
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.rol !== "admin" && profile.rol !== "moderator")) {
      return jsonResponse({ error: "Access denied" }, 403);
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string" || !url.includes("instagram.com")) {
      return jsonResponse({ error: "URL de Instagram invalida" }, 400);
    }

    // 2. Extraer informacion de Instagram
    // Utilizaremos fetch estandar con un User-Agent comun para intentar obtener og:tags
    let extractedText = "";
    let extractedImage = "";
    
    try {
      const igResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "es-CL,es;q=0.9,en;q=0.8"
        },
      });
      
      const html = await igResponse.text();
      
      // Intentar extraer og:description y og:image
      const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
      const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
      const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
      
      if (descMatch) extractedText += descMatch[1] + "\n";
      if (titleMatch) extractedText += titleMatch[1] + "\n";
      if (imgMatch) extractedImage = imgMatch[1];
      
    } catch (fetchError) {
      console.error("Error fetching Instagram URL:", fetchError);
    }

    // Por ahora, solo devolver lo extraido. La integracion con IA va en la Fase 4.
    return jsonResponse({ 
      success: true, 
      extracted_text: extractedText,
      extracted_image: extractedImage,
      message: extractedText ? "Extraccion exitosa" : "No se pudo extraer informacion de la URL, Instagram podria haber bloqueado el acceso."
    }, 200);

  } catch (error) {
    console.error("Analyze Instagram Error:", error);
    return jsonResponse({ error: "Internal Server Error", details: error.message }, 500);
  }
});

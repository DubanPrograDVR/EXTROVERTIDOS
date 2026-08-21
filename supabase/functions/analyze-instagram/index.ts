// ============================================
// EDGE FUNCTION: analyze-instagram
// POST /functions/v1/analyze-instagram
//
// Extrae informacin de una URL de Instagram y 
// devuelve la informacin estructurada usando Gemini.
// 
// Requiere: JWT de Supabase Auth (usuario debe ser admin/moderador)
// Requiere: Secreto GEMINI_API_KEY en Supabase
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

// ----------------------------------------------------
// LLAMADA A GEMINI
// ----------------------------------------------------
async function analyzeWithGemini(extractedText, originalUrl, imageUrl) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no est configurada en Supabase.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
Eres un asistente experto en identificar y estructurar eventos y panoramas a partir de publicaciones de redes sociales.
El usuario te proporcionar el texto crudo extrado de una publicacin de Instagram.

TU OBJETIVO:
Extraer la informacin del panorama y estructurarla en el JSON solicitado.

REGLAS IMPORTANTES:
1. IDENTIFICACIN: Si la publicacin NO es un evento o panorama (por ejemplo: un meme, una foto personal sin actividad asociada, o una noticia genrica), pon "es_panorama": false, y en "motivo_rechazo" explica por qu.
2. FECHA Y HORA: Formatea la fecha como DD/MM/YYYY y las horas como HH:MM si es posible deducirlas. Si no, djalas vacas.
3. CONFIANZA: Asigna un porcentaje (0 a 100). 100 = datos perfectos. Baja la puntuacin si faltan campos clave (fecha, ubicacin) o el texto es muy confuso.
4. FALTANTES: En el array "informacion_faltante" lista qu datos importantes (como hora, precio, ubicacin) no estaban en el texto.
5. DATOS BASE: Completa "url_original" con la URL dada. Completa "imagen_url" con la imagen dada si hay, de lo contrario un string vaco.

URL Original: ${originalUrl}
Imagen encontrada: ${imageUrl || "Ninguna"}

Texto extrado de la publicacin:
--------------------------------
${extractedText}
--------------------------------
`;

  // Esquema estricto para forzar la salida a ser un JSON con los tipos correctos.
  const schema = {
    type: "OBJECT",
    properties: {
      es_panorama: { type: "BOOLEAN" },
      titulo: { type: "STRING" },
      descripcion: { type: "STRING" },
      fecha: { type: "STRING" },
      hora_inicio: { type: "STRING" },
      hora_fin: { type: "STRING" },
      ubicacion: { type: "STRING" },
      comuna: { type: "STRING" },
      region: { type: "STRING" },
      categoria: { type: "STRING" },
      precio: { type: "STRING" },
      organizador: { type: "STRING" },
      telefono: { type: "STRING" },
      instagram: { type: "STRING" },
      imagen_url: { type: "STRING" },
      url_original: { type: "STRING" },
      confianza: { type: "INTEGER" },
      informacion_faltante: {
        type: "ARRAY",
        items: { type: "STRING" }
      },
      motivo_rechazo: { type: "STRING" }
    },
    required: [
      "es_panorama", "titulo", "descripcion", "fecha", "hora_inicio", "hora_fin", 
      "ubicacion", "comuna", "region", "categoria", "precio", "organizador", 
      "telefono", "instagram", "imagen_url", "url_original", "confianza", 
      "informacion_faltante", "motivo_rechazo"
    ]
  };

  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2 // Baja temperatura para mayor precisin extrayendo
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API Error:", errText);
    throw new Error(`Error en la API de Gemini: ${response.status}`);
  }

  const result = await response.json();
  const textResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textResponse) {
    throw new Error("Respuesta vaca de Gemini");
  }

  return JSON.parse(textResponse);
}

// ----------------------------------------------------
// HANDLER
// ----------------------------------------------------
Deno.serve(async (req) => {
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
      return jsonResponse({ error: "URL de Instagram invlida" }, 400);
    }

    // 1. EXTRAER INFO
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
      
      const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
      const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
      const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
      
      if (descMatch) extractedText += descMatch[1] + "\n";
      if (titleMatch) extractedText += titleMatch[1] + "\n";
      if (imgMatch) extractedImage = imgMatch[1];
      
    } catch (fetchError) {
      console.error("Error fetching Instagram URL:", fetchError);
    }

    if (!extractedText.trim()) {
      return jsonResponse({ 
        success: false, 
        error: "No se pudo extraer informacin de la publicacin. Instagram podra estar bloqueando el acceso o es privada."
      }, 400);
    }

    // 2. ENVIAR A GEMINI
    let iaResult;
    try {
      iaResult = await analyzeWithGemini(extractedText, url, extractedImage);
    } catch (aiError) {
      return jsonResponse({ 
        success: false, 
        error: "Error analizando el contenido con la Inteligencia Artificial",
        details: aiError.message
      }, 500);
    }

    // Retornamos el resultado estructurado al frontend
    
    // ----------------------------------------------------
    // FASE 5: VALIDACION GEOGRAFICA (REGION DEL MAULE)
    // ----------------------------------------------------
    const comunasMaule = [
      // Curic�
      "curico", "molina", "romeral", "teno", "rauco", "sagrada familia", "hualane", "licanten", "vichuquen",
      // Talca
      "talca", "san clemente", "maule", "pelarco", "pencahue", "rio claro", "constitucion", "empedrado", "curepto", "san rafael",
      // Linares
      "linares", "colbun", "longavi", "parral", "retiro", "yerbas buenas", "villa alegre", "san javier",
      // Cauquenes
      "cauquenes", "chanco", "pelluhue"
    ];

    if (iaResult.es_panorama && iaResult.comuna) {
      // Normalize to remove accents and lowercase
      const comunaNormalizada = iaResult.comuna.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const isMaule = comunasMaule.some(c => comunaNormalizada.includes(c));
      
      if (!isMaule) {
        iaResult.es_panorama = false;
        iaResult.motivo_rechazo = "Este panorama no pertenece a la Región del Maule.";
        iaResult.confianza = Math.min(iaResult.confianza, 10);
      }
    }

    return jsonResponse({ 
      success: true, 
      data: iaResult 
    }, 200);

  } catch (error) {
    console.error("Analyze Instagram Error:", error);
    return jsonResponse({ error: "Internal Server Error", details: error.message }, 500);
  }
});

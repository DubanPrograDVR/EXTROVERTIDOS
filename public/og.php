<?php
/**
 * og.php — Dynamic Open Graph meta tags for social media previews
 *
 * Cuando Instagram, WhatsApp, Telegram u otro bot scrapea una URL compartida,
 * este script devuelve el HTML con los OG tags correctos (imagen real del evento
 * o negocio) y luego redirige al usuario de vuelta a la app React.
 *
 * ⚙️  CONFIGURACIÓN REQUERIDA: Rellena las 3 constantes de abajo con tus
 *     valores reales (los mismos que tienes en tu .env local).
 */

// ─── 1. CONFIGURACIÓN ────────────────────────────────────────────────────────
// Las credenciales se cargan desde og_config.php (NO tracked en git).
// En el servidor: copia og_config.example.php → og_config.php y rellena los valores.
$_configFile = __DIR__ . '/og_config.php';
if (!file_exists($_configFile)) {
    http_response_code(503);
    exit('Configuración no encontrada. Crea og_config.php en el servidor.');
}
require_once $_configFile;
// ─────────────────────────────────────────────────────────────────────────────

// ─── 2. LEER PARÁMETROS ───────────────────────────────────────────────────────
$highlightId = isset($_GET['highlight']) ? trim($_GET['highlight']) : '';
$type        = isset($_GET['type'])      ? trim($_GET['type'])      : 'event'; // 'event' | 'business'

// Validar UUID (previene inyección / path traversal)
$isValidUuid = (bool) preg_match(
    '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
    $highlightId
);

if (!$isValidUuid) {
    // Sin ID válido → redirigir a la home React
    header('Location: ' . SITE_URL . '/');
    exit;
}

// ─── 3. CONSULTAR SUPABASE ────────────────────────────────────────────────────
function supabase_get(string $table, string $id, array $fields): ?array {
    $select  = implode(',', $fields);
    $apiUrl  = SUPABASE_URL . '/rest/v1/' . $table
             . '?id=eq.' . urlencode($id)
             . '&select=' . urlencode($select)
             . '&limit=1';

    $headers = [
        'apikey: '        . SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . SUPABASE_ANON_KEY,
        'Accept: application/json',
    ];

    // Intentar con cURL (preferido en cPanel)
    if (function_exists('curl_init')) {
        $ch = curl_init($apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
    } elseif (ini_get('allow_url_fopen')) {
        // Fallback con file_get_contents
        $ctx      = stream_context_create(['http' => [
            'method'  => 'GET',
            'header'  => implode("\r\n", $headers),
            'timeout' => 8,
        ]]);
        $response = @file_get_contents($apiUrl, false, $ctx);
    } else {
        return null;
    }

    if ($response === false) return null;
    $data = json_decode($response, true);
    return (is_array($data) && !empty($data)) ? $data[0] : null;
}

// Elegir tabla y campos según el tipo
if ($type === 'business') {
    $record = supabase_get('businesses', $highlightId, [
        'nombre', 'descripcion', 'slogan', 'imagenes', 'imagen_url',
        'imagen_portada_url', 'galeria', 'comuna', 'provincia',
    ]);
    $redirectPath = '/superguia?highlight=' . $highlightId;
} else {
    $record = supabase_get('events', $highlightId, [
        'titulo', 'descripcion', 'imagenes', 'comuna', 'provincia',
    ]);
    $redirectPath = '/panoramas?highlight=' . $highlightId;
}

// ─── 4. PREPARAR META TAGS ────────────────────────────────────────────────────
$e = fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

if ($record) {
    // Título exacto del evento/negocio
    $rawTitle = $record['titulo'] ?? $record['nombre'] ?? '';
    $title    = $rawTitle ?: 'Extrovertidos';

    // Prefijo según tipo para que se vea bien en todas las redes
    $titleFull = $type === 'business'
        ? '🏪 ' . $title . ' | Superguía Extrovertidos'
        : '📍 ' . $title . ' | Extrovertidos';

    // Descripción: ubicación + descripción real, o fallback
    $location = trim(($record['comuna'] ?? '') . ', ' . ($record['provincia'] ?? ''), ', ');
    $rawDesc  = $record['descripcion'] ?? $record['slogan'] ?? '';
    $rawDesc  = mb_substr(strip_tags(str_replace(['<br>', '<br/>', '<br />'], ' ', $rawDesc)), 0, 160);

    if ($rawDesc) {
        $description = ($location ? $location . ' — ' : '') . $rawDesc;
    } elseif ($location) {
        $description = $type === 'business'
            ? 'Negocio en ' . $location . ' · Superguía Extrovertidos'
            : '¡Mira este panorama en ' . $location . '! Encuéntralo en Extrovertidos.cl';
    } else {
        $description = $type === 'business'
            ? 'Descúbrelo en la Superguía Extrovertidos'
            : 'Panoramas, Actividades y Eventos del Maule · Extrovertidos.cl';
    }

    // Imagen — prioridad: imagenes[0] > imagen_portada_url > imagen_url > galeria[0]
    $image = DEFAULT_IMAGE;
    foreach ([
        fn($r) => (is_array($r['imagenes'] ?? null) && !empty($r['imagenes'])) ? $r['imagenes'][0] : null,
        fn($r) => $r['imagen_portada_url'] ?? null,
        fn($r) => $r['imagen_url'] ?? null,
        fn($r) => (is_array($r['galeria'] ?? null) && !empty($r['galeria'])) ? $r['galeria'][0] : null,
    ] as $resolver) {
        $candidate = $resolver($record);
        if ($candidate && filter_var($candidate, FILTER_VALIDATE_URL)) {
            $image = $candidate;
            break;
        }
    }
} else {
    $title       = 'Extrovertidos';
    $titleFull   = 'Extrovertidos · ¡Somos tu Panorama!';
    $description = 'Panoramas, Actividades, Eventos y Superguía de Negocios del Maule';
    $image       = DEFAULT_IMAGE;
}

// Forzar HTTPS en la imagen (algunos crawlers rechazan http://)
$image = preg_replace('/^http:\/\//i', 'https://', $image);

// Detectar el tipo MIME real por extensión (WhatsApp/Facebook lo validan)
$imgPath   = parse_url($image, PHP_URL_PATH) ?: '';
$imgExt    = strtolower(pathinfo($imgPath, PATHINFO_EXTENSION));
$imageType = [
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png'  => 'image/png',
    'webp' => 'image/webp',
    'gif'  => 'image/gif',
][$imgExt] ?? 'image/jpeg';

$canonicalUrl = SITE_URL . $redirectPath;

// Header explícito para que el crawler interprete bien la respuesta
header('Content-Type: text/html; charset=UTF-8');

?><!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title><?= $e($titleFull) ?></title>
  <meta name="description" content="<?= $e($description) ?>">

  <!-- Open Graph — Facebook, Instagram, WhatsApp, Telegram, Discord, LinkedIn, Slack -->
  <meta property="og:type"              content="website">
  <meta property="og:site_name"         content="Extrovertidos">
  <meta property="og:title"             content="<?= $e($titleFull) ?>">
  <meta property="og:description"       content="<?= $e($description) ?>">
  <meta property="og:url"               content="<?= $e($canonicalUrl) ?>">
  <meta property="og:image"             content="<?= $e($image) ?>">
  <meta property="og:image:secure_url"  content="<?= $e($image) ?>">
  <meta property="og:image:type"        content="<?= $e($imageType) ?>">
  <meta property="og:image:width"       content="1200">
  <meta property="og:image:height"      content="630">
  <meta property="og:image:alt"         content="<?= $e($title) ?>">
  <meta property="og:locale"            content="es_CL">

  <!-- Twitter / X Card -->
  <meta name="twitter:card"             content="summary_large_image">
  <meta name="twitter:site"             content="@extrovertidos">
  <meta name="twitter:title"            content="<?= $e($titleFull) ?>">
  <meta name="twitter:description"      content="<?= $e($description) ?>">
  <meta name="twitter:image"            content="<?= $e($image) ?>">
  <meta name="twitter:image:alt"        content="<?= $e($title) ?>">

  <!-- Redirigir a la app React inmediatamente (usuarios humanos) -->
  <meta http-equiv="refresh" content="0;url=<?= $e($canonicalUrl) ?>">
  <link rel="canonical" href="<?= $e($canonicalUrl) ?>">
</head>
<body>
  <script>window.location.replace("<?= $e($canonicalUrl) ?>");</script>
  <p>Redirigiendo... <a href="<?= $e($canonicalUrl) ?>">Haz clic aquí</a></p>
</body>
</html>

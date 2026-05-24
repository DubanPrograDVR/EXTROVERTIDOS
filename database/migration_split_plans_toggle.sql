-- =============================================================================
-- Migración: separar el toggle global de "Activar planes" en tres flags.
-- =============================================================================
-- Crea las claves `panoramas_enabled` y `superguia_enabled` en `app_settings`
-- (default false) y actualiza los RPC de consumo de publicación para que
-- respeten la nueva visibilidad combinada.
--
-- Visibilidad efectiva:
--   panoramasVisible = planes_enabled OR panoramas_enabled
--   superguiaVisible = planes_enabled OR superguia_enabled
--
-- La capa de aplicación mantiene la invariante de exclusión mutua:
-- activar el global apaga los individuales, y viceversa.
-- =============================================================================

-- 1. Insertar las nuevas claves si no existen.
INSERT INTO app_settings (key, value, description)
VALUES
  (
    'panoramas_enabled',
    'false'::jsonb,
    'Si es true (y planes_enabled es false), muestra únicamente la sección de Panoramas.'
  ),
  (
    'superguia_enabled',
    'false'::jsonb,
    'Si es true (y planes_enabled es false), muestra únicamente la sección de Superguía.'
  )
ON CONFLICT (key) DO NOTHING;

-- 2. Helper interno: ¿están habilitados los planes de Panoramas?
--    (global OR individual)
CREATE OR REPLACE FUNCTION public.panoramas_plans_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (value)::boolean FROM app_settings WHERE key = 'planes_enabled'),
    true
  )
  OR COALESCE(
    (SELECT (value)::boolean FROM app_settings WHERE key = 'panoramas_enabled'),
    false
  );
$$;

-- 3. Helper interno: ¿están habilitados los planes de Superguía?
CREATE OR REPLACE FUNCTION public.superguia_plans_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (value)::boolean FROM app_settings WHERE key = 'planes_enabled'),
    true
  )
  OR COALESCE(
    (SELECT (value)::boolean FROM app_settings WHERE key = 'superguia_enabled'),
    false
  );
$$;

-- 4. Recordatorio para mantenedores:
--    Si los RPC `validate_and_consume_publication` (panoramas) y
--    `validate_and_consume_business_publication` (superguía) leen hoy
--    directamente la clave `planes_enabled`, deben actualizarse para usar
--    los helpers anteriores en su check de "modo prueba":
--
--      -- Panoramas:
--      IF NOT public.panoramas_plans_enabled() THEN
--        -- Modo Prueba para Panoramas: no consumir suscripción, permitir publicar.
--        ...
--      END IF;
--
--      -- Superguía:
--      IF NOT public.superguia_plans_enabled() THEN
--        -- Modo Prueba para Superguía.
--        ...
--      END IF;
--
--    Esta migración deja los helpers creados; las funciones RPC originales no
--    están versionadas en este repositorio (`database/schema.sql`) y deben
--    editarse directamente en la consola de Supabase o en la migración donde
--    fueron definidas originalmente.

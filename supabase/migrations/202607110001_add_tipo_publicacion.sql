-- ============================================
-- MIGRATION: add_tipo_publicacion
-- Adds tipo_publicacion field to events (normal | destacada, scalable).
-- Adds publicacion_destacada price entry to app_settings.plan_prices.
-- ============================================

-- 1) Add tipo_publicacion column (idempotent)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS tipo_publicacion TEXT NOT NULL DEFAULT 'normal';

-- 2) Add CHECK constraint (drop first for idempotency, then re-add)
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_tipo_publicacion_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_tipo_publicacion_check
  CHECK (tipo_publicacion IN ('normal', 'destacada'));

-- 3) Index for filtering by type in Panoramas page
CREATE INDEX IF NOT EXISTS idx_events_tipo_publicacion
  ON public.events(tipo_publicacion);

COMMENT ON COLUMN public.events.tipo_publicacion IS
  'Publication type: normal (free), destacada (paid highlighted). Extensible via CHECK constraint.';

-- 4) Ensure existing publications default to 'normal'
UPDATE public.events
SET tipo_publicacion = 'normal'
WHERE tipo_publicacion IS NULL;

-- 5) Add publicacion_destacada price to app_settings.plan_prices
-- Merges into existing JSONB without overwriting other keys.
INSERT INTO public.app_settings (key, value, description, updated_at)
VALUES (
  'plan_prices',
  jsonb_build_object(
    'panorama_unica', 25000,
    'panorama_pack4', 39990,
    'panorama_ilimitado', 70000,
    'superguia', 15000,
    'publicacion_destacada', 10000
  ),
  'Precios de planes en CLP por plan_type',
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = public.app_settings.value || jsonb_build_object(
      'publicacion_destacada',
      COALESCE(public.app_settings.value->'publicacion_destacada', to_jsonb(10000))
    ),
    updated_at = NOW();

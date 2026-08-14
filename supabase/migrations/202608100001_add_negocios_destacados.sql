-- ============================================
-- MIGRATION: add_negocios_destacados
-- Agrega publicación destacada de negocios sin alterar
-- la semántica existente de Superguía.
-- ============================================

-- 1) Tipo de publicación para negocios.
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS tipo_publicacion TEXT NOT NULL DEFAULT 'normal';

ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_tipo_publicacion_check;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_tipo_publicacion_check
  CHECK (tipo_publicacion IN ('normal', 'destacada'));

UPDATE public.businesses
SET tipo_publicacion = 'normal'
WHERE tipo_publicacion IS NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_tipo_publicacion
  ON public.businesses(tipo_publicacion);

COMMENT ON COLUMN public.businesses.tipo_publicacion IS
  'Tipo de publicación del negocio: normal (Superguía) o destacada (pago único).';

-- 1b) Defensa en base de datos: un usuario puede crear el borrador necesario
-- para Webpay, pero no puede convertirlo directamente en una publicación
-- destacada visible. El service_role de confirm-payment no tiene auth.uid(),
-- y staff conserva su flujo directo.
CREATE OR REPLACE FUNCTION public.guard_business_destacada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT rol INTO actor_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF actor_role IN ('admin', 'moderator') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT'
     AND NEW.tipo_publicacion = 'destacada'
     AND COALESCE(NEW.estado, '') <> 'borrador' THEN
    RAISE EXCEPTION 'Un usuario solo puede iniciar una destacada como borrador';
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.tipo_publicacion = 'destacada'
     AND (
       (
         OLD.tipo_publicacion <> 'destacada'
         AND COALESCE(NEW.estado, '') <> 'borrador'
       )
       OR (
         OLD.tipo_publicacion = 'destacada'
         AND OLD.estado = 'borrador'
         AND COALESCE(NEW.estado, '') <> 'borrador'
       )
       OR (
         OLD.tipo_publicacion = 'destacada'
         AND OLD.estado NOT IN ('borrador', 'publicado')
         AND NEW.estado = 'publicado'
       )
     ) THEN
    RAISE EXCEPTION 'La activación de un negocio destacado requiere el pago confirmado';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_guard_business_destacada ON public.businesses;

CREATE TRIGGER tr_guard_business_destacada
  BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_business_destacada();

-- 2) Precio separado para el pago único de negocio destacado.
-- No pisa una configuración existente administrada desde la aplicación.
INSERT INTO public.app_settings (key, value, description, updated_at)
VALUES (
  'plan_prices',
  jsonb_build_object('negocio_destacado', 10000),
  'Precios de planes y publicaciones en CLP',
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = public.app_settings.value || jsonb_build_object(
      'negocio_destacado',
      COALESCE(public.app_settings.value->'negocio_destacado', to_jsonb(10000))
    ),
    updated_at = NOW();

-- 3) Toggle independiente del toggle de panoramas destacadas.
-- Se apaga por defecto hasta que el administrador lo habilite.
INSERT INTO public.app_settings (key, value, description, updated_at)
VALUES (
  'destacadas_negocios_enabled',
  'false'::jsonb,
  'Permite ofrecer publicaciones destacadas de negocios',
  NOW()
)
ON CONFLICT (key) DO NOTHING;

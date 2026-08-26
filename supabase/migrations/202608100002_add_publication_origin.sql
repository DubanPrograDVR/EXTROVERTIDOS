-- Distingue el origen de cobro sin cambiar events.tipo_publicacion.
-- tipo_publicacion sigue siendo normal/destacada para el render existente.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS origen_publicacion TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS subscription_id UUID;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_origen_publicacion_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_origen_publicacion_check
  CHECK (origen_publicacion IN ('legacy', 'gratuita', 'suscripcion', 'destacada'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_subscription_id_fkey'
      AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_subscription_id_fkey
      FOREIGN KEY (subscription_id)
      REFERENCES public.subscriptions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_subscription_id
  ON public.events(subscription_id);

CREATE INDEX IF NOT EXISTS idx_events_origen_publicacion
  ON public.events(origen_publicacion);

-- Un usuario puede iniciar su propio pago como borrador, pero no puede marcar
-- directamente un evento visible como destacado.
CREATE OR REPLACE FUNCTION public.guard_event_destacada()
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
     AND COALESCE(NEW.estado::text, '') <> 'borrador' THEN
    RAISE EXCEPTION 'Un usuario solo puede iniciar una destacada como borrador';
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.tipo_publicacion = 'destacada'
     AND (
       OLD.tipo_publicacion <> 'destacada'
       OR (OLD.estado = 'borrador' AND COALESCE(NEW.estado::text, '') <> 'borrador')
     ) THEN
    RAISE EXCEPTION 'La activacion de un panorama destacado requiere el pago confirmado';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_guard_event_destacada ON public.events;

CREATE TRIGGER tr_guard_event_destacada
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_event_destacada();

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS origen_publicacion TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS subscription_id UUID;

ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_origen_publicacion_check;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_origen_publicacion_check
  CHECK (origen_publicacion IN ('legacy', 'suscripcion', 'destacada'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'businesses_subscription_id_fkey'
      AND conrelid = 'public.businesses'::regclass
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_subscription_id_fkey
      FOREIGN KEY (subscription_id)
      REFERENCES public.subscriptions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_businesses_subscription_id
  ON public.businesses(subscription_id);

CREATE INDEX IF NOT EXISTS idx_businesses_origen_publicacion
  ON public.businesses(origen_publicacion);

-- Los reembolsos se hacen sobre la suscripcion que realmente consumio el cupo,
-- no sobre la suscripcion activa mas reciente del usuario.
CREATE OR REPLACE FUNCTION public.refund_publication_by_subscription(
  p_subscription_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
BEGIN
  SELECT id, plan, publicaciones_usadas, publicaciones_total
  INTO v_sub
  FROM public.subscriptions
  WHERE id = p_subscription_id
    AND estado = 'activa'
    AND plan IN ('panorama_unica', 'panorama_pack4')
    AND publicaciones_usadas > 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('refunded', false, 'reason', 'no_refundable_subscription');
  END IF;

  UPDATE public.subscriptions
  SET publicaciones_usadas = publicaciones_usadas - 1,
      updated_at = NOW()
  WHERE id = v_sub.id;

  RETURN jsonb_build_object(
    'refunded', true,
    'subscription_id', v_sub.id,
    'plan_type', v_sub.plan::TEXT,
    'publicaciones_usadas', v_sub.publicaciones_usadas - 1,
    'publicaciones_total', v_sub.publicaciones_total
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_business_publication_by_subscription(
  p_subscription_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
BEGIN
  SELECT id, plan, publicaciones_usadas, publicaciones_total
  INTO v_sub
  FROM public.subscriptions
  WHERE id = p_subscription_id
    AND estado = 'activa'
    AND plan = 'superguia'
    AND publicaciones_usadas > 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('refunded', false, 'reason', 'no_refundable_subscription');
  END IF;

  UPDATE public.subscriptions
  SET publicaciones_usadas = publicaciones_usadas - 1,
      updated_at = NOW()
  WHERE id = v_sub.id;

  RETURN jsonb_build_object(
    'refunded', true,
    'subscription_id', v_sub.id,
    'plan_type', v_sub.plan::TEXT,
    'publicaciones_usadas', v_sub.publicaciones_usadas - 1,
    'publicaciones_total', v_sub.publicaciones_total
  );
END;
$$;

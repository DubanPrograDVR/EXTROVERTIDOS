-- =============================================================================
-- Fix: RPCs usan helpers de toggle individual en vez de solo planes_enabled
-- =============================================================================
-- Los cuerpos de las funciones se basan en el dump real de producción
-- (pg_get_functiondef). Solo se cambió la condición de "modo prueba":
--   ANTES: SELECT value FROM app_settings WHERE key = 'planes_enabled'
--   AHORA: v_restrictions_enabled := public.panoramas_plans_enabled()  o
--          v_restrictions_enabled := public.superguia_plans_enabled()
-- =============================================================================

-- 1. Reparar CHECK que bloquea superguía con publicaciones_total = 1
--    Pero primero: NORMALIZAR DATOS EXISTENTES que violarían el nuevo CHECK.
--    (filas viejas de superguía con publicaciones_total = 0, etc.)

-- 1a. Quitar el CHECK viejo
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS chk_publicaciones_coherentes;

-- 1b. Normalizar publicaciones_total de filas existentes según su plan.
--     Se respeta publicaciones_usadas; si alguna fila tiene usadas > nuevo total,
--     se ajusta usadas para no romper el CHECK chk_publicaciones_no_excede.
UPDATE public.subscriptions
SET publicaciones_total = 1
WHERE plan = 'panorama_unica' AND publicaciones_total <> 1;

UPDATE public.subscriptions
SET publicaciones_total = 4
WHERE plan = 'panorama_pack4' AND publicaciones_total <> 4;

UPDATE public.subscriptions
SET publicaciones_total = 0,
    publicaciones_usadas = 0
WHERE plan = 'panorama_ilimitado' AND publicaciones_total <> 0;

UPDATE public.subscriptions
SET publicaciones_total = 1
WHERE plan = 'superguia' AND publicaciones_total <> 1;

-- Asegurar invariante publicaciones_usadas <= publicaciones_total tras la normalización
UPDATE public.subscriptions
SET publicaciones_usadas = publicaciones_total
WHERE publicaciones_usadas > publicaciones_total;

-- 1c. Ahora sí, agregar el CHECK nuevo
ALTER TABLE public.subscriptions
  ADD CONSTRAINT chk_publicaciones_coherentes CHECK (
    (plan = 'panorama_unica'      AND publicaciones_total = 1)
    OR (plan = 'panorama_pack4'   AND publicaciones_total = 4)
    OR (plan = 'panorama_ilimitado' AND publicaciones_total = 0)
    OR (plan = 'superguia'        AND publicaciones_total = 1)
  );

-- =============================================================================
-- 2. validate_and_consume_publication (panoramas)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.validate_and_consume_publication(
    p_user_id uuid,
    p_is_admin boolean DEFAULT false,
    p_is_moderator boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_restrictions_enabled BOOLEAN;
  v_sub RECORD;
  v_any_active_sub RECORD;
  v_limit INT;
  v_pub_expires TIMESTAMPTZ;
BEGIN
  IF p_is_admin OR p_is_moderator THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'reason', NULL,
      'subscription_id', NULL,
      'plan_type', NULL,
      'publications_used', NULL,
      'publications_total', NULL,
      'plan_expires_at', NULL,
      'publication_expires_at', (NOW() + INTERVAL '30 days'),
      'restrictions_enabled', NULL
    );
  END IF;

  -- <<< CORREGIDO: usar helper de toggle panoramas >>>
  v_restrictions_enabled := public.panoramas_plans_enabled();

  IF NOT v_restrictions_enabled THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'reason', 'Restricciones de plan desactivadas. Publicación libre.',
      'subscription_id', NULL,
      'plan_type', NULL,
      'publications_used', NULL,
      'publications_total', NULL,
      'plan_expires_at', NULL,
      'publication_expires_at', (NOW() + INTERVAL '30 days'),
      'restrictions_enabled', FALSE
    );
  END IF;

  SELECT * INTO v_sub
  FROM subscriptions
  WHERE user_id = p_user_id
    AND estado = 'activa'
    AND plan IN ('panorama_unica', 'panorama_pack4', 'panorama_ilimitado')
    AND (fecha_fin IS NULL OR fecha_fin > NOW())
    AND (
      plan = 'panorama_ilimitado'
      OR publicaciones_total = 0
      OR publicaciones_usadas < publicaciones_total
    )
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT * INTO v_any_active_sub
    FROM subscriptions
    WHERE user_id = p_user_id
      AND estado = 'activa'
      AND plan IN ('panorama_unica', 'panorama_pack4', 'panorama_ilimitado')
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'allowed', FALSE,
        'reason', 'Necesitas un plan activo para publicar. Ve a "Activar Plan" para contratar uno.',
        'subscription_id', NULL,
        'plan_type', NULL,
        'publications_used', NULL,
        'publications_total', NULL,
        'plan_expires_at', NULL,
        'publication_expires_at', NULL,
        'restrictions_enabled', TRUE
      );
    END IF;

    v_sub := v_any_active_sub;
  END IF;

  IF v_sub.fecha_fin IS NOT NULL AND v_sub.fecha_fin <= NOW() THEN
    UPDATE subscriptions
    SET estado = 'expirada', updated_at = NOW()
    WHERE id = v_sub.id;

    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'Tu plan ha vencido. Adquiere un nuevo plan para seguir publicando.',
      'subscription_id', v_sub.id,
      'plan_type', v_sub.plan::TEXT,
      'publications_used', v_sub.publicaciones_usadas,
      'publications_total', v_sub.publicaciones_total,
      'plan_expires_at', v_sub.fecha_fin,
      'publication_expires_at', NULL,
      'restrictions_enabled', TRUE
    );
  END IF;

  CASE v_sub.plan
    WHEN 'panorama_unica' THEN v_limit := 1;
    WHEN 'panorama_pack4' THEN v_limit := 4;
    WHEN 'panorama_ilimitado' THEN v_limit := 0;
    ELSE v_limit := 0;
  END CASE;

  IF v_limit > 0 AND v_sub.publicaciones_usadas >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', FORMAT(
        'Has alcanzado el límite de %s publicación%s de tu plan. Debe renovar plan.',
        v_limit,
        CASE WHEN v_limit > 1 THEN 'es' ELSE '' END
      ),
      'subscription_id', v_sub.id,
      'plan_type', v_sub.plan::TEXT,
      'publications_used', v_sub.publicaciones_usadas,
      'publications_total', v_sub.publicaciones_total,
      'plan_expires_at', v_sub.fecha_fin,
      'publication_expires_at', NULL,
      'restrictions_enabled', TRUE
    );
  END IF;

  v_pub_expires := NOW() + INTERVAL '30 days';

  IF v_limit > 0 THEN
    UPDATE subscriptions
    SET publicaciones_usadas = publicaciones_usadas + 1,
        updated_at = NOW()
    WHERE id = v_sub.id;
  END IF;

  RETURN jsonb_build_object(
    'allowed', TRUE,
    'reason', NULL,
    'subscription_id', v_sub.id,
    'plan_type', v_sub.plan::TEXT,
    'publications_used', v_sub.publicaciones_usadas + (CASE WHEN v_limit > 0 THEN 1 ELSE 0 END),
    'publications_total', v_sub.publicaciones_total,
    'plan_expires_at', v_sub.fecha_fin,
    'publication_expires_at', v_pub_expires,
    'restrictions_enabled', TRUE
  );
END;
$function$;

-- =============================================================================
-- 3. validate_and_consume_business_publication (superguía)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.validate_and_consume_business_publication(
    p_user_id uuid,
    p_is_admin boolean DEFAULT false,
    p_is_moderator boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_restrictions_enabled BOOLEAN;
  v_sub RECORD;
  v_any_active_sub RECORD;
  v_effective_total INT;
  v_pub_expires TIMESTAMPTZ;
  v_dias_desde_compra INT;
BEGIN
  IF p_is_admin OR p_is_moderator THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'reason', NULL,
      'subscription_id', NULL,
      'plan_type', 'superguia',
      'publications_used', NULL,
      'publications_total', NULL,
      'plan_expires_at', NULL,
      'publication_expires_at', (NOW() + INTERVAL '30 days'),
      'restrictions_enabled', NULL
    );
  END IF;

  -- <<< CORREGIDO: usar helper de toggle superguía >>>
  v_restrictions_enabled := public.superguia_plans_enabled();

  IF NOT v_restrictions_enabled THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'reason', 'Restricciones de plan desactivadas. Publicacion libre.',
      'subscription_id', NULL,
      'plan_type', NULL,
      'publications_used', NULL,
      'publications_total', NULL,
      'plan_expires_at', NULL,
      'publication_expires_at', (NOW() + INTERVAL '30 days'),
      'restrictions_enabled', FALSE
    );
  END IF;

  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND estado = 'activa'
    AND plan = 'superguia'
    AND (fecha_fin IS NULL OR fecha_fin > NOW())
    AND COALESCE(publicaciones_usadas, 0) < GREATEST(COALESCE(NULLIF(publicaciones_total, 0), 1), 1)
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT * INTO v_any_active_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND estado = 'activa'
      AND plan = 'superguia'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'allowed', FALSE,
        'reason', 'Necesitas un plan Superguia activo para publicar tu negocio. Ve a "Activar Plan" para contratar uno.',
        'subscription_id', NULL,
        'plan_type', NULL,
        'publications_used', NULL,
        'publications_total', NULL,
        'plan_expires_at', NULL,
        'publication_expires_at', NULL,
        'restrictions_enabled', TRUE
      );
    END IF;

    v_effective_total := GREATEST(COALESCE(NULLIF(v_any_active_sub.publicaciones_total, 0), 1), 1);

    IF v_any_active_sub.fecha_fin IS NOT NULL AND v_any_active_sub.fecha_fin <= NOW() THEN
      UPDATE public.subscriptions
      SET estado = 'expirada', updated_at = NOW()
      WHERE id = v_any_active_sub.id;

      RETURN jsonb_build_object(
        'allowed', FALSE,
        'reason', 'Tu suscripcion Superguia ha vencido. Adquiere una nueva para seguir publicando.',
        'subscription_id', v_any_active_sub.id,
        'plan_type', 'superguia',
        'publications_used', COALESCE(v_any_active_sub.publicaciones_usadas, 0),
        'publications_total', v_effective_total,
        'plan_expires_at', v_any_active_sub.fecha_fin,
        'publication_expires_at', NULL,
        'restrictions_enabled', TRUE
      );
    END IF;

    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'Has utilizado tu cupo de publicacion de negocio. Adquiere una nueva suscripcion Superguia para publicar otro negocio.',
      'subscription_id', v_any_active_sub.id,
      'plan_type', 'superguia',
      'publications_used', COALESCE(v_any_active_sub.publicaciones_usadas, 0),
      'publications_total', v_effective_total,
      'plan_expires_at', v_any_active_sub.fecha_fin,
      'publication_expires_at', NULL,
      'restrictions_enabled', TRUE
    );
  END IF;

  v_effective_total := GREATEST(COALESCE(NULLIF(v_sub.publicaciones_total, 0), 1), 1);

  IF v_sub.fecha_inicio IS NOT NULL THEN
    v_dias_desde_compra := EXTRACT(DAY FROM (NOW() - v_sub.fecha_inicio))::INT;

    IF v_dias_desde_compra > 30 THEN
      RETURN jsonb_build_object(
        'allowed', FALSE,
        'reason', 'Tu plazo de 30 dias para crear tu publicacion de negocio ha vencido. Adquiere una nueva suscripcion.',
        'subscription_id', v_sub.id,
        'plan_type', 'superguia',
        'publications_used', COALESCE(v_sub.publicaciones_usadas, 0),
        'publications_total', v_effective_total,
        'plan_expires_at', v_sub.fecha_fin,
        'publication_expires_at', NULL,
        'restrictions_enabled', TRUE
      );
    END IF;
  END IF;

  v_pub_expires := NOW() + INTERVAL '30 days';

  UPDATE public.subscriptions
  SET publicaciones_total = v_effective_total,
      publicaciones_usadas = COALESCE(publicaciones_usadas, 0) + 1,
      updated_at = NOW()
  WHERE id = v_sub.id;

  RETURN jsonb_build_object(
    'allowed', TRUE,
    'reason', NULL,
    'subscription_id', v_sub.id,
    'plan_type', 'superguia',
    'publications_used', COALESCE(v_sub.publicaciones_usadas, 0) + 1,
    'publications_total', v_effective_total,
    'plan_expires_at', v_sub.fecha_fin,
    'publication_expires_at', v_pub_expires,
    'restrictions_enabled', TRUE
  );
END;
$function$;

-- =============================================================================
-- 4. refund_publication (panoramas)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.refund_publication(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_restrictions_enabled BOOLEAN;
  v_sub RECORD;
BEGIN
  -- <<< CORREGIDO: usar helper de toggle panoramas >>>
  v_restrictions_enabled := public.panoramas_plans_enabled();

  IF NOT v_restrictions_enabled THEN
    RETURN jsonb_build_object(
      'refunded', FALSE,
      'reason', 'restrictions_disabled'
    );
  END IF;

  SELECT * INTO v_sub
  FROM subscriptions
  WHERE user_id = p_user_id
    AND estado = 'activa'
    AND plan IN ('panorama_unica', 'panorama_pack4')
    AND publicaciones_usadas > 0
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'refunded', FALSE,
      'reason', 'no_refundable_subscription'
    );
  END IF;

  UPDATE subscriptions
  SET publicaciones_usadas = publicaciones_usadas - 1,
      updated_at = NOW()
  WHERE id = v_sub.id;

  RETURN jsonb_build_object(
    'refunded', TRUE,
    'subscription_id', v_sub.id,
    'plan_type', v_sub.plan::TEXT,
    'publicaciones_usadas', v_sub.publicaciones_usadas - 1,
    'publicaciones_total', v_sub.publicaciones_total
  );
END;
$function$;

-- =============================================================================
-- 5. refund_business_publication (superguía)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.refund_business_publication(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_restrictions_enabled BOOLEAN;
  v_sub RECORD;
BEGIN
  -- <<< CORREGIDO: usar helper de toggle superguía >>>
  v_restrictions_enabled := public.superguia_plans_enabled();

  IF NOT v_restrictions_enabled THEN
    RETURN jsonb_build_object(
      'refunded', FALSE,
      'reason', 'restrictions_disabled'
    );
  END IF;

  SELECT * INTO v_sub
  FROM subscriptions
  WHERE user_id = p_user_id
    AND estado = 'activa'
    AND plan = 'superguia'
    AND publicaciones_usadas > 0
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'refunded', FALSE,
      'reason', 'no_refundable_subscription'
    );
  END IF;

  UPDATE subscriptions
  SET publicaciones_usadas = publicaciones_usadas - 1,
      updated_at = NOW()
  WHERE id = v_sub.id;

  RETURN jsonb_build_object(
    'refunded', TRUE,
    'subscription_id', v_sub.id,
    'plan_type', v_sub.plan::TEXT,
    'publicaciones_usadas', v_sub.publicaciones_usadas - 1,
    'publicaciones_total', v_sub.publicaciones_total
  );
END;
$function$;

-- Habilita Supabase Realtime para las tablas events y businesses.
-- Esto permite que el hook useAdminPendingCount reciba cambios en tiempo real
-- (INSERT/UPDATE/DELETE) vía WebSocket sin necesidad de polling.

-- Agregar tablas a la publicación de Realtime (solo si no están ya)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.events';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'businesses'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses';
  END IF;
END;
$$;

-- REPLICA IDENTITY FULL permite recibir los valores anteriores (old record)
-- en eventos UPDATE y DELETE, necesario para que el cliente pueda comparar
-- el estado anterior y actualizar correctamente los contadores.
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.businesses REPLICA IDENTITY FULL;

-- Asegura que el admin/moderador pueda ver TODOS los eventos vía SELECT (RLS).
-- Sin esta policy, Supabase Realtime descartaría los payloads al validar RLS
-- por el suscriptor admin, y la burbuja nunca se actualizaría.
DO $$
BEGIN
  -- Policy para events
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'events'
      AND policyname = 'Staff ve todos los eventos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Staff ve todos los eventos"
        ON public.events FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND rol IN ('admin', 'moderator')
          )
        );
    $policy$;
  END IF;

  -- Policy para businesses
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'businesses'
      AND policyname = 'Staff ve todos los negocios'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Staff ve todos los negocios"
        ON public.businesses FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND rol IN ('admin', 'moderator')
          )
        );
    $policy$;
  END IF;
END;
$$;

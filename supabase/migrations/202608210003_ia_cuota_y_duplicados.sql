-- ==========================================
-- CUOTA DIARIA DE IMPORTACIÓN IA + DUPLICADOS
-- ==========================================
--
-- La edge function analyze-instagram no tenía ningún límite: un bucle desde
-- una cuenta de moderador agota la cuota de Gemini y deja la importación caída
-- para todos, además del coste si el proyecto de Google tiene facturación.
--
-- Las edge functions no guardan estado entre invocaciones, así que el contador
-- vive aquí y se incrementa de forma atómica.

-- ------------------------------------------
-- 1. CONTADOR DIARIO POR USUARIO
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.ia_import_usage (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dia        date NOT NULL,
  contador   int  NOT NULL DEFAULT 0,
  actualizado timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dia)
);

COMMENT ON TABLE public.ia_import_usage IS
  'Análisis de Instagram con IA consumidos por usuario y día (hora de Chile).';

ALTER TABLE public.ia_import_usage ENABLE ROW LEVEL SECURITY;

-- Cada quien ve solo su propio consumo. La escritura va exclusivamente por la
-- función SECURITY DEFINER de abajo, así que no se otorga ninguna política de
-- INSERT ni UPDATE: nadie puede manipular su contador a mano.
DROP POLICY IF EXISTS "Ver el propio consumo de IA" ON public.ia_import_usage;
CREATE POLICY "Ver el propio consumo de IA"
  ON public.ia_import_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- ------------------------------------------
-- 2. CONSUMO ATÓMICO DE CUOTA
-- ------------------------------------------
--
-- Devuelve el estado de la cuota DESPUÉS de intentar consumir una unidad.
-- El INSERT ... ON CONFLICT hace el incremento en una sola sentencia, de modo
-- que dos peticiones simultáneas no pueden leer el mismo valor y pisarse.
CREATE OR REPLACE FUNCTION public.consumir_cuota_ia(p_limite int)
RETURNS TABLE (permitido boolean, usado int, limite int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user  uuid := auth.uid();
  v_dia   date := (now() AT TIME ZONE 'America/Santiago')::date;
  v_usado int;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Sin sesión activa' USING ERRCODE = '28000';
  END IF;

  IF p_limite IS NULL OR p_limite < 0 THEN
    RAISE EXCEPTION 'Límite inválido' USING ERRCODE = '22023';
  END IF;

  -- Se reserva primero y se decide después: así el incremento es atómico.
  INSERT INTO public.ia_import_usage AS u (user_id, dia, contador, actualizado)
       VALUES (v_user, v_dia, 1, now())
  ON CONFLICT (user_id, dia) DO UPDATE
          SET contador = u.contador + 1,
              actualizado = now()
    RETURNING u.contador INTO v_usado;

  -- Si el consumo se pasó del límite, se devuelve la unidad reservada para que
  -- reintentar mañana no arrastre el exceso de hoy.
  IF v_usado > p_limite THEN
    UPDATE public.ia_import_usage
       SET contador = contador - 1
     WHERE user_id = v_user AND dia = v_dia;

    RETURN QUERY SELECT false, p_limite, p_limite;
  END IF;

  RETURN QUERY SELECT true, v_usado, p_limite;
END;
$$;

REVOKE ALL ON FUNCTION public.consumir_cuota_ia(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consumir_cuota_ia(int) TO authenticated;

-- ------------------------------------------
-- 3. BÚSQUEDA DE DUPLICADOS
-- ------------------------------------------
--
-- Índice de búsqueda, NO único a propósito: un índice único haría fallar el
-- insert con un error de Postgres incomprensible para el administrador, y hay
-- casos legítimos de volver a publicar un post (una edición de un evento que
-- se repite). El aviso de duplicado se da antes, y el admin decide.
CREATE INDEX IF NOT EXISTS idx_events_fuente_url
  ON public.events (fuente_url)
  WHERE fuente_url IS NOT NULL;

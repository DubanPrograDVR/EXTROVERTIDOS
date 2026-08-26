-- ==========================================
-- CORRIGE ia_fecha_analisis EN events
-- ==========================================
--
-- La migración 202608210001 creó la columna con DEFAULT NOW(). Eso tiene dos
-- problemas:
--
--   1. ALTER TABLE ... ADD COLUMN ... DEFAULT NOW() rellenó TODAS las filas
--      existentes con el instante de la migración, así que cada panorama
--      publicado a mano meses atrás quedó con una "fecha de análisis IA"
--      inventada. Un `WHERE ia_fecha_analisis IS NOT NULL` para auditar
--      importaciones devolvería la tabla entera.
--
--   2. Toda fila nueva -- venga o no de IA -- recibía su created_at disfrazado
--      de fecha de análisis, haciendo la columna indistinguible de created_at.
--
-- La columna debe ser nullable y escribirla solo el flujo de importación
-- (useEventSubmit la setea cuando generado_por_ia es true).
--
-- REVISAR ANTES DE APLICAR: el UPDATE limpia el backfill falso. Solo toca filas
-- que NO están marcadas como generadas por IA.

ALTER TABLE public.events
  ALTER COLUMN ia_fecha_analisis DROP DEFAULT;

-- Limpia el backfill falso. Solo toca filas que NO están marcadas como IA.
UPDATE public.events
  SET ia_fecha_analisis = NULL
  WHERE generado_por_ia IS NOT TRUE
    AND ia_fecha_analisis IS NOT NULL;

-- Las filas que sí vienen de IA y se quedaron sin fecha usan su created_at,
-- que es la mejor aproximación disponible al momento del análisis.
UPDATE public.events
  SET ia_fecha_analisis = created_at
  WHERE generado_por_ia IS TRUE
    AND ia_fecha_analisis IS NULL;

-- Coherencia: si una publicación está marcada como generada por IA, debe
-- tener origen y fecha de análisis.
--
-- NOT VALID a propósito: la restricción se aplica a todo INSERT/UPDATE nuevo
-- (que es donde importa), pero no se valida contra las filas históricas. Si
-- alguna fila antigua quedó incoherente, la migración no aborta a medias.
-- Para validarla más adelante, cuando se haya revisado el histórico:
--   ALTER TABLE public.events VALIDATE CONSTRAINT events_ia_coherente;
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_ia_coherente;

ALTER TABLE public.events
  ADD CONSTRAINT events_ia_coherente CHECK (
    generado_por_ia IS NOT TRUE
    OR (fuente_url IS NOT NULL AND ia_fecha_analisis IS NOT NULL)
  ) NOT VALID;


-- ==========================================
-- ADD IA FIELDS TO EVENTS
-- ==========================================

-- Agrega campos necesarios para trazar el origen IA
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS fuente_url TEXT,
  ADD COLUMN IF NOT EXISTS generado_por_ia BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ia_confianza INTEGER CHECK (ia_confianza >= 0 AND ia_confianza <= 100),
  ADD COLUMN IF NOT EXISTS ia_fecha_analisis TIMESTAMPTZ DEFAULT NOW();

-- Indice para facilitar bsquedas futuras de eventos importados
CREATE INDEX IF NOT EXISTS idx_events_generado_por_ia 
  ON public.events(generado_por_ia) 
  WHERE generado_por_ia = TRUE;


-- ============================================================
-- Agrega contador de compartidos a events y businesses
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS share_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS share_count INTEGER NOT NULL DEFAULT 0;

-- Función RPC para incremento atómico (evita race conditions)
CREATE OR REPLACE FUNCTION increment_share_count(event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE events
  SET share_count = share_count + 1
  WHERE id = event_id;
END;
$$;

-- Función RPC para incremento atómico en businesses
CREATE OR REPLACE FUNCTION increment_business_share_count(business_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE businesses
  SET share_count = share_count + 1
  WHERE id = business_id_param;
END;
$$;

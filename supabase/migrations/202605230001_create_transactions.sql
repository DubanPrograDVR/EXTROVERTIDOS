-- Tabla de auditoria para pagos Webpay.
-- Requerida por las Edge Functions create-payment, confirm-payment y payment-status.

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  subscription_ids UUID[] NOT NULL DEFAULT '{}',

  buy_order VARCHAR(26) NOT NULL UNIQUE,
  session_id VARCHAR(61) NOT NULL,
  amount INT NOT NULL CHECK (amount > 0),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'refunded')
  ),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,

  token_ws TEXT UNIQUE,
  response_code INT,
  authorization_code TEXT,
  card_last_four TEXT,
  transbank_response JSONB,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created
  ON public.transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_status
  ON public.transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_token_ws
  ON public.transactions(token_ws)
  WHERE token_ws IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'tr_transactions_updated'
    AND tgrelid = 'public.transactions'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER tr_transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()';
  END IF;
END $$;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'transactions'
    AND policyname = 'Usuarios ven sus transacciones'
  ) THEN
    EXECUTE 'CREATE POLICY "Usuarios ven sus transacciones" ON public.transactions FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

COMMENT ON TABLE public.transactions IS 'Auditoria de transacciones de pago Webpay';
COMMENT ON COLUMN public.transactions.buy_order IS 'Orden de compra enviada a Transbank';
COMMENT ON COLUMN public.transactions.token_ws IS 'Token de transaccion retornado por Transbank';
-- Adicionar colunas OxaPay na tabela deposits
ALTER TABLE deposits 
ADD COLUMN IF NOT EXISTS oxapay_track_id TEXT,
ADD COLUMN IF NOT EXISTS oxapay_pay_link TEXT;

-- Criar função para incrementar saldo do usuário
CREATE OR REPLACE FUNCTION public.increment_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;
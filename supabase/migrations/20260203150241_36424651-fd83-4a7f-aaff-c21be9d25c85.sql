-- Tabela de carteiras de depósito cripto
CREATE TABLE public.deposit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cryptocurrency_id UUID REFERENCES public.cryptocurrencies(id) ON DELETE CASCADE NOT NULL,
  network_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trigger para updated_at
CREATE TRIGGER update_deposit_wallets_updated_at
BEFORE UPDATE ON public.deposit_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies
ALTER TABLE public.deposit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active deposit wallets"
ON public.deposit_wallets FOR SELECT
USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage deposit wallets"
ON public.deposit_wallets FOR ALL
USING (is_admin());

-- Adicionar campos na tabela deposits para tipo de pagamento
ALTER TABLE public.deposits ADD COLUMN payment_method TEXT DEFAULT 'pix';
ALTER TABLE public.deposits ADD COLUMN cryptocurrency_id UUID REFERENCES public.cryptocurrencies(id);
ALTER TABLE public.deposits ADD COLUMN network_name TEXT;
ALTER TABLE public.deposits ADD COLUMN wallet_address TEXT;
-- Adicionar coluna is_active
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- Atualizar usuários existentes com investimentos para ativo
UPDATE public.profiles SET is_active = true 
WHERE user_id IN (SELECT DISTINCT user_id FROM public.investments);

-- Trigger para ativar usuário no primeiro investimento
CREATE OR REPLACE FUNCTION public.activate_user_on_investment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET is_active = true, updated_at = now()
  WHERE user_id = NEW.user_id AND is_active = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_activate_user_on_investment
AFTER INSERT ON public.investments
FOR EACH ROW EXECUTE FUNCTION public.activate_user_on_investment();

-- Atualizar process_referral para validar referrer ativo
CREATE OR REPLACE FUNCTION public.process_referral(
    new_user_id UUID,
    referrer_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    referrer_user_id UUID;
    referrer_is_active BOOLEAN;
BEGIN
    -- Encontrar o usuário que fez a indicação e verificar se está ativo
    SELECT user_id, is_active INTO referrer_user_id, referrer_is_active
    FROM public.profiles 
    WHERE referral_code = upper(referrer_code);
    
    IF referrer_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se o referrer está ativo
    IF referrer_is_active IS NOT TRUE THEN
        RETURN FALSE;
    END IF;
    
    -- Evitar auto-indicação
    IF referrer_user_id = new_user_id THEN
        RETURN FALSE;
    END IF;
    
    -- Inserir a indicação
    INSERT INTO public.referrals (user_id, referrer_id, referral_code, level)
    VALUES (new_user_id, referrer_user_id, upper(referrer_code), 1);
    
    RETURN TRUE;
EXCEPTION
    WHEN unique_violation THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
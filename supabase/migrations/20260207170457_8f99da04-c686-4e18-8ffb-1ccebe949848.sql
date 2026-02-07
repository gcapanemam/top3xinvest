-- Criar função para distribuir comissões baseadas em depósitos
CREATE OR REPLACE FUNCTION public.distribute_deposit_commission(
    p_deposit_id uuid,
    p_user_id uuid,
    p_deposit_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_upline_user_id uuid;
    v_upline_level integer;
    v_commission_percentage numeric;
    v_commission_amount numeric;
BEGIN
    -- Distribuir comissões para a upline (4 níveis)
    FOR v_upline_user_id, v_upline_level IN 
        SELECT get_user_upline.user_id, get_user_upline.level 
        FROM public.get_user_upline(p_user_id)
    LOOP
        -- Buscar percentual da tabela mlm_settings
        SELECT commission_percentage INTO v_commission_percentage
        FROM public.mlm_settings
        WHERE level = v_upline_level;
        
        -- Fallback se não encontrar
        IF v_commission_percentage IS NULL THEN
            v_commission_percentage := 0;
        END IF;
        
        -- Calcular valor da comissão sobre o depósito
        v_commission_amount := (p_deposit_amount * v_commission_percentage) / 100;
        
        IF v_commission_amount > 0 THEN
            -- Inserir registro de comissão (investment_id = NULL para depósitos)
            INSERT INTO public.referral_commissions 
                (user_id, from_user_id, investment_id, level, percentage, amount)
            VALUES 
                (v_upline_user_id, p_user_id, NULL, 
                 v_upline_level, v_commission_percentage, v_commission_amount);
            
            -- Creditar saldo na carteira do usuário da upline
            UPDATE public.profiles
            SET balance = balance + v_commission_amount,
                updated_at = now()
            WHERE user_id = v_upline_user_id;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$;

-- Atualizar percentuais padrão para valores baseados em depósito
UPDATE public.mlm_settings SET commission_percentage = 10 WHERE level = 1;
UPDATE public.mlm_settings SET commission_percentage = 5 WHERE level = 2;
UPDATE public.mlm_settings SET commission_percentage = 3 WHERE level = 3;
UPDATE public.mlm_settings SET commission_percentage = 2 WHERE level = 4;
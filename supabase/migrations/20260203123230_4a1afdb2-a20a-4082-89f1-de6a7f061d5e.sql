-- Create table for MLM commission settings
CREATE TABLE public.mlm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL UNIQUE CHECK (level >= 1 AND level <= 4),
  commission_percentage NUMERIC NOT NULL DEFAULT 0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default values
INSERT INTO public.mlm_settings (level, commission_percentage) VALUES 
  (1, 100),
  (2, 50),
  (3, 25),
  (4, 10);

-- Enable RLS
ALTER TABLE public.mlm_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view settings
CREATE POLICY "Everyone can view MLM settings"
ON public.mlm_settings FOR SELECT
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update MLM settings"
ON public.mlm_settings FOR UPDATE
USING (is_admin());

-- Update distribute_investment_profit function to use dynamic percentages
CREATE OR REPLACE FUNCTION public.distribute_investment_profit(p_investment_id uuid, p_profit_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_investor_id uuid;
    v_upline_user_id uuid;
    v_upline_level integer;
    v_commission_percentage numeric;
    v_commission_amount numeric;
BEGIN
    -- Buscar o investidor
    SELECT user_id INTO v_investor_id
    FROM public.investments
    WHERE id = p_investment_id;
    
    IF v_investor_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar o lucro acumulado do investimento
    UPDATE public.investments
    SET profit_accumulated = profit_accumulated + p_profit_amount,
        updated_at = now()
    WHERE id = p_investment_id;
    
    -- Distribuir comissoes para a upline
    FOR v_upline_user_id, v_upline_level IN 
        SELECT get_user_upline.user_id, get_user_upline.level FROM public.get_user_upline(v_investor_id)
    LOOP
        -- Buscar percentual da tabela mlm_settings
        SELECT commission_percentage INTO v_commission_percentage
        FROM public.mlm_settings
        WHERE level = v_upline_level;
        
        -- Fallback para valores padrao se nao encontrar
        IF v_commission_percentage IS NULL THEN
            v_commission_percentage := CASE v_upline_level
                WHEN 1 THEN 100
                WHEN 2 THEN 50
                WHEN 3 THEN 25
                WHEN 4 THEN 10
                ELSE 0
            END;
        END IF;
        
        -- Calcular valor da comissao
        v_commission_amount := (p_profit_amount * v_commission_percentage) / 100;
        
        IF v_commission_amount > 0 THEN
            -- Inserir registro de comissao
            INSERT INTO public.referral_commissions 
                (user_id, from_user_id, investment_id, level, percentage, amount)
            VALUES 
                (v_upline_user_id, v_investor_id, p_investment_id, 
                 v_upline_level, v_commission_percentage, v_commission_amount);
            
            -- Atualizar saldo do usuario
            UPDATE public.profiles
            SET balance = balance + v_commission_amount,
                updated_at = now()
            WHERE user_id = v_upline_user_id;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$function$;
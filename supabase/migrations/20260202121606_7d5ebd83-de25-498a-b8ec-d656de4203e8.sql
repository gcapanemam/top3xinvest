-- Função para buscar a upline (quem indicou) até 4 níveis
CREATE OR REPLACE FUNCTION public.get_user_upline(p_user_id uuid)
RETURNS TABLE(user_id uuid, level integer)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE upline AS (
        -- Nivel 1: quem indicou o usuario
        SELECT 
            r.referrer_id as user_id,
            1 as level
        FROM public.referrals r
        WHERE r.user_id = p_user_id
        
        UNION ALL
        
        -- Niveis subsequentes
        SELECT 
            r.referrer_id,
            u.level + 1
        FROM public.referrals r
        INNER JOIN upline u ON r.user_id = u.user_id
        WHERE u.level < 4
    )
    SELECT upline.user_id, upline.level
    FROM upline
    ORDER BY upline.level;
END;
$$;

-- Função para distribuir lucro de investimento e comissões MLM
CREATE OR REPLACE FUNCTION public.distribute_investment_profit(
    p_investment_id uuid,
    p_profit_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
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
        -- Definir percentual baseado no nivel (100%, 50%, 25%, 10%)
        v_commission_percentage := CASE v_upline_level
            WHEN 1 THEN 100
            WHEN 2 THEN 50
            WHEN 3 THEN 25
            WHEN 4 THEN 10
            ELSE 0
        END;
        
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
$$;

-- Função para creditar lucros de um robô para todos os investimentos ativos
CREATE OR REPLACE FUNCTION public.credit_robot_profits(
    p_robot_id uuid,
    p_profit_percentage numeric
)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_investment RECORD;
    v_profit_amount numeric;
    v_count integer := 0;
BEGIN
    FOR v_investment IN 
        SELECT id, amount 
        FROM public.investments 
        WHERE robot_id = p_robot_id 
        AND status = 'active'
    LOOP
        -- Calcular lucro baseado no valor investido
        v_profit_amount := (v_investment.amount * p_profit_percentage) / 100;
        
        -- Distribuir lucro e comissoes
        PERFORM public.distribute_investment_profit(
            v_investment.id, 
            v_profit_amount
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$;
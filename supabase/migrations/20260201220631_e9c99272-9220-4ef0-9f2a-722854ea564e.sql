-- Adicionar coluna referral_code na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Criar tabela de indicações (referrals)
CREATE TABLE public.referrals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    referrer_id UUID NOT NULL,
    referral_code TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 4),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de comissões de indicação
CREATE TABLE public.referral_commissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    from_user_id UUID NOT NULL,
    investment_id UUID,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4),
    percentage DECIMAL NOT NULL,
    amount DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- Criar índices para performance
CREATE INDEX idx_referrals_user_id ON public.referrals(user_id);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referral_commissions_user_id ON public.referral_commissions(user_id);
CREATE INDEX idx_referral_commissions_from_user_id ON public.referral_commissions(from_user_id);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- RLS Policies para referrals
CREATE POLICY "Admins can manage referrals"
ON public.referrals
FOR ALL
USING (public.is_admin());

CREATE POLICY "Users can view own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = referrer_id);

-- RLS Policies para referral_commissions
CREATE POLICY "Admins can manage commissions"
ON public.referral_commissions
FOR ALL
USING (public.is_admin());

CREATE POLICY "Users can view own commissions"
ON public.referral_commissions
FOR SELECT
USING (auth.uid() = user_id);

-- Função para gerar código de referral único
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Gerar código de 8 caracteres alfanuméricos
        new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
        
        -- Verificar se o código já existe
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    NEW.referral_code := new_code;
    RETURN NEW;
END;
$$;

-- Trigger para gerar código automaticamente ao criar perfil (apenas se não tiver)
CREATE TRIGGER trigger_generate_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION public.generate_referral_code();

-- Gerar códigos para usuários existentes que não têm
UPDATE public.profiles 
SET referral_code = upper(substr(md5(random()::text || id::text), 1, 8))
WHERE referral_code IS NULL;

-- Função para obter a árvore de rede de um usuário
CREATE OR REPLACE FUNCTION public.get_network_tree(root_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    referrer_id UUID,
    level INTEGER,
    full_name TEXT,
    total_invested DECIMAL,
    referral_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE network AS (
        -- Nível 1: Indicados diretos
        SELECT 
            r.user_id,
            r.referrer_id,
            1 as level
        FROM public.referrals r
        WHERE r.referrer_id = root_user_id
        
        UNION ALL
        
        -- Níveis subsequentes
        SELECT 
            r.user_id,
            r.referrer_id,
            n.level + 1
        FROM public.referrals r
        INNER JOIN network n ON r.referrer_id = n.user_id
        WHERE n.level < 4
    )
    SELECT 
        n.user_id,
        n.referrer_id,
        n.level,
        p.full_name,
        COALESCE(SUM(i.amount), 0) as total_invested,
        p.referral_code
    FROM network n
    LEFT JOIN public.profiles p ON p.user_id = n.user_id
    LEFT JOIN public.investments i ON i.user_id = n.user_id AND i.status = 'active'
    GROUP BY n.user_id, n.referrer_id, n.level, p.full_name, p.referral_code
    ORDER BY n.level, total_invested DESC;
END;
$$;

-- Função para obter estatísticas de rede de um usuário
CREATE OR REPLACE FUNCTION public.get_network_stats(target_user_id UUID)
RETURNS TABLE (
    total_members INTEGER,
    direct_members INTEGER,
    total_volume DECIMAL,
    active_levels INTEGER,
    level_1_count INTEGER,
    level_1_volume DECIMAL,
    level_2_count INTEGER,
    level_2_volume DECIMAL,
    level_3_count INTEGER,
    level_3_volume DECIMAL,
    level_4_count INTEGER,
    level_4_volume DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH network_data AS (
        SELECT * FROM public.get_network_tree(target_user_id)
    ),
    level_stats AS (
        SELECT 
            nd.level,
            COUNT(*)::INTEGER as member_count,
            COALESCE(SUM(nd.total_invested), 0) as volume
        FROM network_data nd
        GROUP BY nd.level
    )
    SELECT 
        COALESCE((SELECT SUM(member_count) FROM level_stats), 0)::INTEGER as total_members,
        COALESCE((SELECT member_count FROM level_stats WHERE level = 1), 0)::INTEGER as direct_members,
        COALESCE((SELECT SUM(volume) FROM level_stats), 0) as total_volume,
        (SELECT COUNT(DISTINCT level)::INTEGER FROM level_stats WHERE member_count > 0) as active_levels,
        COALESCE((SELECT member_count FROM level_stats WHERE level = 1), 0)::INTEGER,
        COALESCE((SELECT volume FROM level_stats WHERE level = 1), 0),
        COALESCE((SELECT member_count FROM level_stats WHERE level = 2), 0)::INTEGER,
        COALESCE((SELECT volume FROM level_stats WHERE level = 2), 0),
        COALESCE((SELECT member_count FROM level_stats WHERE level = 3), 0)::INTEGER,
        COALESCE((SELECT volume FROM level_stats WHERE level = 3), 0),
        COALESCE((SELECT member_count FROM level_stats WHERE level = 4), 0)::INTEGER,
        COALESCE((SELECT volume FROM level_stats WHERE level = 4), 0);
END;
$$;

-- Função para processar indicação no registro
CREATE OR REPLACE FUNCTION public.process_referral(
    new_user_id UUID,
    referrer_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    referrer_user_id UUID;
BEGIN
    -- Encontrar o usuário que fez a indicação
    SELECT user_id INTO referrer_user_id 
    FROM public.profiles 
    WHERE referral_code = upper(referrer_code);
    
    IF referrer_user_id IS NULL THEN
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
$$;
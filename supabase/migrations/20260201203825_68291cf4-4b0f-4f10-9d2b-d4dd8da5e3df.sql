-- =============================================
-- FASE 1: ESTRUTURA BASE DO INVEST HUB
-- =============================================

-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Criar enum para status de transações
CREATE TYPE public.transaction_status AS ENUM ('pending', 'approved', 'rejected', 'processing', 'completed');

-- 3. Criar enum para tipo de transação
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'investment', 'profit', 'refund');

-- 4. Criar enum para tipo de notificação
CREATE TYPE public.notification_type AS ENUM ('alert', 'info', 'promo', 'system');

-- =============================================
-- TABELA: profiles (dados dos usuários)
-- =============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    balance DECIMAL(18, 2) DEFAULT 0.00 NOT NULL,
    is_blocked BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- TABELA: user_roles (controle de permissões)
-- =============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- =============================================
-- TABELA: cryptocurrencies (criptomoedas)
-- =============================================
CREATE TABLE public.cryptocurrencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    current_price DECIMAL(18, 8) DEFAULT 0.00 NOT NULL,
    price_change_24h DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- TABELA: robots (robôs de investimento)
-- =============================================
CREATE TABLE public.robots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cryptocurrency_id UUID REFERENCES public.cryptocurrencies(id) ON DELETE SET NULL,
    profit_percentage DECIMAL(10, 2) NOT NULL,
    profit_period_days INTEGER NOT NULL DEFAULT 30,
    lock_period_days INTEGER NOT NULL DEFAULT 7,
    min_investment DECIMAL(18, 2) NOT NULL DEFAULT 100.00,
    max_investment DECIMAL(18, 2),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- TABELA: investments (investimentos dos usuários)
-- =============================================
CREATE TABLE public.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    robot_id UUID REFERENCES public.robots(id) ON DELETE SET NULL,
    amount DECIMAL(18, 2) NOT NULL,
    profit_accumulated DECIMAL(18, 2) DEFAULT 0.00 NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    lock_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- TABELA: deposits (solicitações de depósito)
-- =============================================
CREATE TABLE public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    status public.transaction_status DEFAULT 'pending' NOT NULL,
    payment_proof_url TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- TABELA: withdrawals (solicitações de saque)
-- =============================================
CREATE TABLE public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    status public.transaction_status DEFAULT 'pending' NOT NULL,
    pix_key TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- TABELA: transactions (histórico de movimentações)
-- =============================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type public.transaction_type NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- TABELA: notifications (notificações)
-- =============================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type public.notification_type DEFAULT 'info' NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    is_global BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- TABELA: robot_operations (operações simuladas)
-- =============================================
CREATE TABLE public.robot_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    robot_id UUID REFERENCES public.robots(id) ON DELETE CASCADE NOT NULL,
    operation_type TEXT NOT NULL,
    cryptocurrency_symbol TEXT NOT NULL,
    entry_price DECIMAL(18, 8) NOT NULL,
    exit_price DECIMAL(18, 8),
    profit_percentage DECIMAL(10, 2),
    status TEXT DEFAULT 'open' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- TABELA: crypto_price_history (histórico de cotações)
-- =============================================
CREATE TABLE public.crypto_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cryptocurrency_id UUID REFERENCES public.cryptocurrencies(id) ON DELETE CASCADE NOT NULL,
    price DECIMAL(18, 8) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =============================================
-- FUNÇÃO: has_role (verificar role do usuário)
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- =============================================
-- FUNÇÃO: is_admin (atalho para verificar admin)
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'admin')
$$;

-- =============================================
-- TRIGGER: criar profile automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: atualizar updated_at automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_robots_updated_at
    BEFORE UPDATE ON public.robots
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
    BEFORE UPDATE ON public.investments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deposits_updated_at
    BEFORE UPDATE ON public.deposits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cryptocurrencies_updated_at
    BEFORE UPDATE ON public.cryptocurrencies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS: Habilitar em todas as tabelas
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cryptocurrencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robot_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_price_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: profiles
-- =============================================
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- RLS POLICIES: user_roles
-- =============================================
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can manage roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- RLS POLICIES: cryptocurrencies
-- =============================================
CREATE POLICY "Everyone can view active cryptocurrencies"
    ON public.cryptocurrencies FOR SELECT
    TO authenticated
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage cryptocurrencies"
    ON public.cryptocurrencies FOR ALL
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- RLS POLICIES: robots
-- =============================================
CREATE POLICY "Everyone can view active robots"
    ON public.robots FOR SELECT
    TO authenticated
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage robots"
    ON public.robots FOR ALL
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- RLS POLICIES: investments
-- =============================================
CREATE POLICY "Users can view own investments"
    ON public.investments FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create investments"
    ON public.investments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments"
    ON public.investments FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can manage investments"
    ON public.investments FOR ALL
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- RLS POLICIES: deposits
-- =============================================
CREATE POLICY "Users can view own deposits"
    ON public.deposits FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposits"
    ON public.deposits FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposits"
    ON public.deposits FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can manage deposits"
    ON public.deposits FOR ALL
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- RLS POLICIES: withdrawals
-- =============================================
CREATE POLICY "Users can view own withdrawals"
    ON public.withdrawals FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals"
    ON public.withdrawals FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals"
    ON public.withdrawals FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can manage withdrawals"
    ON public.withdrawals FOR ALL
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- RLS POLICIES: transactions
-- =============================================
CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can manage transactions"
    ON public.transactions FOR ALL
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- RLS POLICIES: notifications
-- =============================================
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR is_global = true);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- RLS POLICIES: robot_operations
-- =============================================
CREATE POLICY "Everyone can view robot operations"
    ON public.robot_operations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage robot operations"
    ON public.robot_operations FOR ALL
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- RLS POLICIES: crypto_price_history
-- =============================================
CREATE POLICY "Everyone can view price history"
    ON public.crypto_price_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage price history"
    ON public.crypto_price_history FOR ALL
    TO authenticated
    USING (public.is_admin());

-- =============================================
-- DADOS INICIAIS: Criptomoedas
-- =============================================
INSERT INTO public.cryptocurrencies (symbol, name, current_price, price_change_24h) VALUES
('BTC', 'Bitcoin', 42500.00, 2.35),
('ETH', 'Ethereum', 2250.00, -1.20),
('BNB', 'Binance Coin', 310.50, 0.85),
('SOL', 'Solana', 98.75, 5.40),
('XRP', 'Ripple', 0.62, -0.45),
('ADA', 'Cardano', 0.58, 1.15),
('DOGE', 'Dogecoin', 0.082, 3.20),
('DOT', 'Polkadot', 7.85, -2.10);
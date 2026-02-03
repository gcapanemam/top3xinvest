-- Tabela de relacionamento robô <-> criptomoedas
CREATE TABLE public.robot_cryptocurrencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_id UUID NOT NULL REFERENCES robots(id) ON DELETE CASCADE,
  cryptocurrency_id UUID NOT NULL REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(robot_id, cryptocurrency_id)
);

-- RLS policies
ALTER TABLE robot_cryptocurrencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view robot cryptocurrencies"
ON robot_cryptocurrencies FOR SELECT
USING (true);

CREATE POLICY "Admins can manage robot cryptocurrencies"
ON robot_cryptocurrencies FOR ALL
USING (is_admin());

-- Migrar dados existentes (robôs com cryptocurrency_id)
INSERT INTO robot_cryptocurrencies (robot_id, cryptocurrency_id)
SELECT id, cryptocurrency_id FROM robots WHERE cryptocurrency_id IS NOT NULL;
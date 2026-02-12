
-- Fix robot_operations: recreate SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Everyone can view robot operations" ON robot_operations;
CREATE POLICY "Everyone can view robot operations" 
  ON robot_operations FOR SELECT 
  USING (true);

-- Fix robots: recreate SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Everyone can view active robots" ON robots;
CREATE POLICY "Everyone can view active robots" 
  ON robots FOR SELECT 
  USING ((is_active = true) OR is_admin() OR (EXISTS ( SELECT 1 FROM investments WHERE investments.robot_id = robots.id AND investments.user_id = auth.uid() AND investments.status = 'active')));

-- Fix cryptocurrencies: recreate SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Everyone can view active cryptocurrencies" ON cryptocurrencies;
CREATE POLICY "Everyone can view active cryptocurrencies" 
  ON cryptocurrencies FOR SELECT 
  USING ((is_active = true) OR is_admin());

-- Fix robot_cryptocurrencies: recreate SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Everyone can view robot cryptocurrencies" ON robot_cryptocurrencies;
CREATE POLICY "Everyone can view robot cryptocurrencies" 
  ON robot_cryptocurrencies FOR SELECT 
  USING (true);

-- Fix crypto_price_history: recreate SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Everyone can view price history" ON crypto_price_history;
CREATE POLICY "Everyone can view price history" 
  ON crypto_price_history FOR SELECT 
  USING (true);

-- Fix mlm_settings: recreate SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Everyone can view MLM settings" ON mlm_settings;
CREATE POLICY "Everyone can view MLM settings" 
  ON mlm_settings FOR SELECT 
  USING (true);

-- Fix deposit_wallets: recreate SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Everyone can view active deposit wallets" ON deposit_wallets;
CREATE POLICY "Everyone can view active deposit wallets" 
  ON deposit_wallets FOR SELECT 
  USING ((is_active = true) OR is_admin());

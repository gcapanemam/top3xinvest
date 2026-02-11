
-- 1. Limpar registros órfãos em referral_commissions
DELETE FROM public.referral_commissions
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR from_user_id NOT IN (SELECT id FROM auth.users);

-- 2. Limpar registros órfãos em referrals
DELETE FROM public.referrals
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR referrer_id NOT IN (SELECT id FROM auth.users);

-- 3. Adicionar foreign keys com CASCADE na tabela referrals
ALTER TABLE public.referrals
  ADD CONSTRAINT referrals_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.referrals
  ADD CONSTRAINT referrals_referrer_id_fkey
  FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Adicionar foreign keys com CASCADE na tabela referral_commissions
ALTER TABLE public.referral_commissions
  ADD CONSTRAINT referral_commissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.referral_commissions
  ADD CONSTRAINT referral_commissions_from_user_id_fkey
  FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

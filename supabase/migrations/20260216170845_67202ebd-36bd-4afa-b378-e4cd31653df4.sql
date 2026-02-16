
-- Platform settings table for configurable values
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  label text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view settings" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.platform_settings
  FOR ALL USING (is_admin());

-- Seed default values
INSERT INTO public.platform_settings (key, value, label) VALUES
  ('fundraising_goal', '300000', 'Meta do 1º Ciclo (USD)'),
  ('fundraising_raised', '26850', 'Valor Arrecadado (USD)');

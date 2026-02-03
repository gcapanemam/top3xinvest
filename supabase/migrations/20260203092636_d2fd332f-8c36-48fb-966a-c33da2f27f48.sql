-- Create admin_audit_logs table for tracking all administrative actions
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for fast queries
CREATE INDEX idx_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.admin_audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can view and insert logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (is_admin());
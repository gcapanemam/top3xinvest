import { supabase } from '@/integrations/supabase/client';

export type EntityType = 'user' | 'deposit' | 'withdrawal' | 'robot' | 'cryptocurrency' | 'notification' | 'mlm_settings' | 'deposit_wallet';

export type ActionType = 
  // User actions
  | 'user_edited'
  | 'user_blocked'
  | 'user_unblocked'
  | 'user_admin_granted'
  | 'user_admin_revoked'
  | 'user_password_reset_sent'
  | 'user_deleted'
  // Deposit actions
  | 'deposit_approved'
  | 'deposit_rejected'
  // Withdrawal actions
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  // Robot actions
  | 'robot_created'
  | 'robot_edited'
  | 'robot_deleted'
  | 'robot_profit_credited'
  // Crypto actions
  | 'crypto_price_updated'
  // Notification actions
  | 'notification_sent'
  // MLM settings actions
  | 'mlm_settings_updated'
  // Wallet actions
  | 'wallet_created'
  | 'wallet_updated'
  | 'wallet_deleted';

export interface AuditLogParams {
  action: ActionType;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, unknown>;
}

export const createAuditLog = async (params: AuditLogParams): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Audit log: No user found');
      return;
    }

    const logEntry = {
      admin_id: user.id,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      details: params.details ? JSON.parse(JSON.stringify(params.details)) : null,
    };

    const { error } = await supabase.from('admin_audit_logs').insert(logEntry as unknown as never);

    if (error) {
      console.error('Error creating audit log:', error);
    }
  } catch (error) {
    console.error('Unexpected error creating audit log:', error);
  }
};

// Helper to get action display name in Portuguese
export const getActionDisplayName = (action: ActionType): string => {
  const actionNames: Record<ActionType, string> = {
    user_edited: 'Usuário editado',
    user_blocked: 'Usuário bloqueado',
    user_unblocked: 'Usuário desbloqueado',
    user_admin_granted: 'Admin concedido',
    user_admin_revoked: 'Admin removido',
    user_password_reset_sent: 'Reset de senha enviado',
    user_deleted: 'Usuário excluído',
    deposit_approved: 'Depósito aprovado',
    deposit_rejected: 'Depósito rejeitado',
    withdrawal_approved: 'Saque aprovado',
    withdrawal_rejected: 'Saque rejeitado',
    robot_created: 'Robô criado',
    robot_edited: 'Robô editado',
    robot_deleted: 'Robô excluído',
    robot_profit_credited: 'Lucro creditado',
    crypto_price_updated: 'Cotação atualizada',
    notification_sent: 'Notificação enviada',
    mlm_settings_updated: 'Comissões MLM atualizadas',
    wallet_created: 'Carteira criada',
    wallet_updated: 'Carteira atualizada',
    wallet_deleted: 'Carteira excluída',
  };
  return actionNames[action] || action;
};

// Helper to get entity type display name in Portuguese
export const getEntityTypeDisplayName = (entityType: EntityType): string => {
  const entityNames: Record<EntityType, string> = {
    user: 'Usuário',
    deposit: 'Depósito',
    withdrawal: 'Saque',
    robot: 'Robô',
    cryptocurrency: 'Criptomoeda',
    notification: 'Notificação',
    mlm_settings: 'Configurações MLM',
    deposit_wallet: 'Carteira de Depósito',
  };
  return entityNames[entityType] || entityType;
};

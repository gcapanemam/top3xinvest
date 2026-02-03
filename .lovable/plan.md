
# Plano: Sistema de Logs de Auditoria para Administradores

## Visao Geral

Implementar um sistema completo de auditoria que registra todas as acoes realizadas por administradores, incluindo quem executou, o que foi feito, quando e detalhes adicionais. Isso garante transparencia, rastreabilidade e seguranca no sistema.

## Acoes Administrativas a Serem Registradas

### Por Pagina/Funcionalidade

| Pagina | Acoes |
|--------|-------|
| AdminUsers | Editar usuario, Bloquear/Desbloquear, Tornar admin, Remover admin, Enviar reset senha, Excluir usuario |
| AdminDeposits | Aprovar deposito, Rejeitar deposito |
| AdminWithdrawals | Aprovar saque, Rejeitar saque |
| AdminRobots | Criar robo, Editar robo, Excluir robo, Creditar lucro |
| AdminPrices | Atualizar cotacao de criptomoeda |
| AdminNotifications | Enviar notificacao (individual ou global) |

---

## Secao Tecnica

### 1. Nova Tabela: admin_audit_logs

Criar tabela para armazenar todos os logs de auditoria:

```sql
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

-- Indices para buscas rapidas
CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON admin_audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- RLS: Apenas admins podem ver logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON admin_audit_logs FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert audit logs"
ON admin_audit_logs FOR INSERT
WITH CHECK (is_admin());
```

### Estrutura dos Campos

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Identificador unico |
| admin_id | UUID | ID do admin que executou a acao |
| action | TEXT | Tipo da acao (ex: user_blocked, deposit_approved) |
| entity_type | TEXT | Tipo da entidade (user, deposit, withdrawal, robot, etc) |
| entity_id | UUID | ID da entidade afetada |
| details | JSONB | Detalhes adicionais (valores antes/depois, notas, etc) |
| ip_address | TEXT | IP do admin (opcional) |
| created_at | TIMESTAMP | Data/hora da acao |

---

### 2. Funcao Utilitaria para Criar Logs

Criar hook ou funcao reutilizavel no frontend:

```typescript
// src/lib/auditLog.ts
import { supabase } from '@/integrations/supabase/client';

type EntityType = 'user' | 'deposit' | 'withdrawal' | 'robot' | 'cryptocurrency' | 'notification';

type ActionType = 
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
  | 'notification_sent';

interface AuditLogParams {
  action: ActionType;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, any>;
}

export const createAuditLog = async (params: AuditLogParams) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  await supabase.from('admin_audit_logs').insert({
    admin_id: user.id,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    details: params.details || null,
  });
};
```

---

### 3. Integracao nas Paginas Admin

**AdminUsers.tsx - Exemplo de integracao:**

```typescript
// Ao bloquear usuario
const toggleUserBlock = async (user: UserWithStats) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_blocked: !user.is_blocked })
    .eq('id', user.id);

  if (!error) {
    // Registrar log
    await createAuditLog({
      action: user.is_blocked ? 'user_unblocked' : 'user_blocked',
      entityType: 'user',
      entityId: user.user_id,
      details: {
        user_name: user.full_name,
        previous_status: user.is_blocked ? 'blocked' : 'active',
        new_status: user.is_blocked ? 'active' : 'blocked',
      },
    });
  }
};

// Ao editar usuario
const handleUpdateUser = async () => {
  // ... atualizacao
  
  await createAuditLog({
    action: 'user_edited',
    entityType: 'user',
    entityId: editUser.user_id,
    details: {
      user_name: editUser.full_name,
      changes: {
        full_name: { from: editUser.full_name, to: editData.full_name },
        phone: { from: editUser.phone, to: editData.phone },
        balance: { from: editUser.balance, to: parseFloat(editData.balance) },
      },
    },
  });
};
```

**AdminDeposits.tsx:**

```typescript
const processDeposit = async (approve: boolean) => {
  // ... processamento

  await createAuditLog({
    action: approve ? 'deposit_approved' : 'deposit_rejected',
    entityType: 'deposit',
    entityId: selectedDeposit.id,
    details: {
      user_id: selectedDeposit.user_id,
      amount: selectedDeposit.amount,
      admin_notes: adminNotes || null,
    },
  });
};
```

**AdminWithdrawals.tsx:**

```typescript
const processWithdrawal = async (approve: boolean) => {
  // ... processamento

  await createAuditLog({
    action: approve ? 'withdrawal_approved' : 'withdrawal_rejected',
    entityType: 'withdrawal',
    entityId: selectedWithdrawal.id,
    details: {
      user_id: selectedWithdrawal.user_id,
      amount: selectedWithdrawal.amount,
      pix_key: selectedWithdrawal.pix_key,
      admin_notes: adminNotes || null,
    },
  });
};
```

**AdminRobots.tsx:**

```typescript
const handleSubmit = async () => {
  // ... criar/editar robo

  await createAuditLog({
    action: editingRobot ? 'robot_edited' : 'robot_created',
    entityType: 'robot',
    entityId: editingRobot?.id,
    details: {
      robot_name: formData.name,
      profit_percentage: formData.profit_percentage,
      is_active: formData.is_active,
    },
  });
};

const handleCreditProfit = async () => {
  // ... creditar lucro

  await createAuditLog({
    action: 'robot_profit_credited',
    entityType: 'robot',
    entityId: selectedRobotForCredit.id,
    details: {
      robot_name: selectedRobotForCredit.name,
      percentage: parseFloat(creditPercentage),
      affected_investments: processedCount,
      estimated_value: estimatedProfit,
    },
  });
};
```

**AdminPrices.tsx:**

```typescript
const saveAllPrices = async () => {
  // Para cada crypto alterada
  for (const crypto of cryptos) {
    if (priceChanged) {
      await createAuditLog({
        action: 'crypto_price_updated',
        entityType: 'cryptocurrency',
        entityId: crypto.id,
        details: {
          symbol: crypto.symbol,
          previous_price: crypto.current_price,
          new_price: newPrice,
          previous_change: crypto.price_change_24h,
          new_change: newChange,
        },
      });
    }
  }
};
```

**AdminNotifications.tsx:**

```typescript
const handleSubmit = async () => {
  // ... enviar notificacao

  await createAuditLog({
    action: 'notification_sent',
    entityType: 'notification',
    details: {
      title: formData.title,
      type: formData.type,
      is_global: formData.isGlobal,
      target_user_id: formData.isGlobal ? null : formData.userId,
    },
  });
};
```

---

### 4. Nova Pagina: AdminAuditLogs.tsx

Criar pagina para visualizar os logs:

```text
+------------------------------------------+
| Logs de Auditoria                        |
+------------------------------------------+
| [Buscar...]  [Filtro: Todas]  [Data: Hoje]|
+------------------------------------------+
| Acao          | Admin    | Quando  | Det. |
+------------------------------------------+
| Deposito      | João     | 14:32   | [>]  |
| aprovado      | Admin    | hoje    |      |
+------------------------------------------+
| Usuario       | Maria    | 12:15   | [>]  |
| bloqueado     | Admin    | hoje    |      |
+------------------------------------------+
| Robo          | João     | 10:00   | [>]  |
| criado        | Admin    | ontem   |      |
+------------------------------------------+
```

**Funcionalidades da pagina:**
- Lista paginada de logs (mais recentes primeiro)
- Filtro por tipo de acao (usuarios, depositos, saques, robos, etc)
- Filtro por admin especifico
- Filtro por data (hoje, 7 dias, 30 dias, periodo customizado)
- Busca por texto nos detalhes
- Expansao para ver detalhes completos de cada log
- Exportar para CSV

---

### 5. Integracao no Menu Admin

Adicionar link no Sidebar para a nova pagina:

```typescript
// No Sidebar.tsx, adicionar item no menu admin
{
  icon: ClipboardList,
  label: 'Logs de Auditoria',
  href: '/admin/logs',
}
```

---

### 6. Edge Function: Registrar Logs de Acoes Privilegiadas

Atualizar `admin-user-actions` para registrar logs diretamente:

```typescript
// Apos cada acao bem-sucedida
await supabaseAdmin.from('admin_audit_logs').insert({
  admin_id: requestingUser.id,
  action: 'user_deleted', // ou 'user_password_reset_sent'
  entity_type: 'user',
  entity_id: user_id,
  details: {
    user_email: userData.user.email,
    action_via: 'edge_function',
  },
});
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar tabela admin_audit_logs |
| src/lib/auditLog.ts | Criar funcao utilitaria |
| src/pages/admin/AdminAuditLogs.tsx | Nova pagina de logs |
| src/pages/admin/AdminUsers.tsx | Integrar logs |
| src/pages/admin/AdminDeposits.tsx | Integrar logs |
| src/pages/admin/AdminWithdrawals.tsx | Integrar logs |
| src/pages/admin/AdminRobots.tsx | Integrar logs |
| src/pages/admin/AdminPrices.tsx | Integrar logs |
| src/pages/admin/AdminNotifications.tsx | Integrar logs |
| supabase/functions/admin-user-actions/index.ts | Integrar logs |
| src/components/layout/Sidebar.tsx | Adicionar link menu |
| src/App.tsx | Adicionar rota |

---

### Tipos de Acoes (action)

| Codigo | Descricao PT-BR |
|--------|-----------------|
| user_edited | Usuario editado |
| user_blocked | Usuario bloqueado |
| user_unblocked | Usuario desbloqueado |
| user_admin_granted | Admin concedido |
| user_admin_revoked | Admin removido |
| user_password_reset_sent | Reset de senha enviado |
| user_deleted | Usuario excluido |
| deposit_approved | Deposito aprovado |
| deposit_rejected | Deposito rejeitado |
| withdrawal_approved | Saque aprovado |
| withdrawal_rejected | Saque rejeitado |
| robot_created | Robo criado |
| robot_edited | Robo editado |
| robot_deleted | Robo excluido |
| robot_profit_credited | Lucro creditado |
| crypto_price_updated | Cotacao atualizada |
| notification_sent | Notificacao enviada |

---

### Interface Visual da Pagina de Logs

```text
+--------------------------------------------------+
| [ClipboardList] Logs de Auditoria                |
| Historico de todas as acoes administrativas      |
+--------------------------------------------------+
| Filtros:                                         |
| [Todas as acoes v] [Todos admins v] [Ultimos 7d v]|
| [Buscar por detalhes...]                         |
+--------------------------------------------------+
| +----------------------------------------------+ |
| | 14:32 - Hoje                                 | |
| | [CheckCircle] Deposito Aprovado              | |
| | Por: Joao Admin                              | |
| | Usuario: Maria Silva - R$ 500,00             | |
| | [Expandir detalhes]                          | |
| +----------------------------------------------+ |
| | 12:15 - Hoje                                 | |
| | [Ban] Usuario Bloqueado                      | |
| | Por: Maria Admin                             | |
| | Usuario: Carlos Teste                        | |
| | [Expandir detalhes]                          | |
| +----------------------------------------------+ |
| | 10:00 - Ontem                                | |
| | [Bot] Robo Criado                            | |
| | Por: Joao Admin                              | |
| | Nome: Bot BTC Agressivo                      | |
| | [Expandir detalhes]                          | |
| +----------------------------------------------+ |
+--------------------------------------------------+
| [< Anterior]  Pagina 1 de 10  [Proximo >]        |
+--------------------------------------------------+
```

---

### Exemplo de Log Expandido

```text
+----------------------------------------------+
| Deposito Aprovado                             |
| 14:32:45 - 02/02/2026                        |
+----------------------------------------------+
| Administrador: Joao Admin                     |
| ID: 123e4567-e89b-12d3-a456-426614174000     |
+----------------------------------------------+
| Detalhes:                                     |
| - ID do Deposito: abc123...                  |
| - Usuario: Maria Silva                        |
| - Valor: R$ 500,00                           |
| - Observacoes: Comprovante verificado        |
+----------------------------------------------+
```

---

### Consideracoes de Seguranca

1. **RLS**: Apenas admins podem ler/inserir logs
2. **Imutabilidade**: Logs nao podem ser editados ou excluidos
3. **Auditoria da Edge Function**: Acoes privilegiadas tambem sao registradas
4. **Detalhes Sensiveis**: Nao armazenar senhas ou dados sensiveis nos logs
5. **Retencao**: Considerar politica de retencao (ex: manter por 1 ano)

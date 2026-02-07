

# Plano: Remover Funcionalidade de Reenvio de Email de Validação

## Visão Geral

Remover a opção de "Reenviar Email de Confirmação" do painel de administração, mantendo apenas a funcionalidade de "Enviar Email de Redefinição de Senha" (esqueci minha senha).

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/admin-user-actions/index.ts` | Remover case `send_email_confirmation` |
| `src/pages/admin/AdminUsers.tsx` | Remover botão, handler e estado relacionado |
| `src/lib/auditLog.ts` | Remover `user_email_confirmation_resent` do ActionType |

---

## Alterações Detalhadas

### 1. Edge Function: admin-user-actions

Remover o case `send_email_confirmation` (linhas 176-222):

```typescript
// REMOVER ESTE BLOCO INTEIRO:
case 'send_email_confirmation': {
  // ... todo o código
}
```

### 2. AdminUsers.tsx - Estado

Remover o estado:
```typescript
// REMOVER:
const [isSendingEmailConfirmation, setIsSendingEmailConfirmation] = useState(false);
```

### 3. AdminUsers.tsx - Handler

Remover a função `handleSendEmailConfirmation` (linhas 432-459):
```typescript
// REMOVER ESTE BLOCO INTEIRO:
const handleSendEmailConfirmation = async () => {
  // ...
};
```

### 4. AdminUsers.tsx - Interface

Remover o botão de reenvio de email de confirmação (linhas 1094-1106):
```tsx
// REMOVER ESTE BLOCO:
<div>
  <button
    onClick={handleSendEmailConfirmation}
    disabled={isSendingEmailConfirmation}
    ...
  >
    <Mail className="h-4 w-4" />
    {isSendingEmailConfirmation ? 'Enviando...' : 'Reenviar Email de Confirmação'}
  </button>
  <p className="text-xs text-gray-500 mt-1">
    O usuário receberá um email com link para validar seu email
  </p>
</div>
```

### 5. auditLog.ts - ActionType

Remover do tipo `ActionType`:
```typescript
// REMOVER:
| 'user_email_confirmation_resent'
```

Remover do `getActionDisplayName`:
```typescript
// REMOVER:
user_email_confirmation_resent: 'Email de confirmação reenviado',
```

---

## Resultado Esperado

1. A seção "Segurança" no dialog de edição de usuários mostrará apenas o botão "Enviar Email de Redefinição de Senha"
2. O código da Edge Function será mais limpo, sem lógica não utilizada
3. Tipos de auditoria atualizados sem referência à funcionalidade removida

---

## Interface Final

```text
┌─────────────────────────────────────────────┐
│ Segurança                                   │
├─────────────────────────────────────────────┤
│ [Enviar Email de Redefinição de Senha]      │
│                                             │
│ O usuário receberá um email com link        │
│ para criar uma nova senha                   │
└─────────────────────────────────────────────┘
```


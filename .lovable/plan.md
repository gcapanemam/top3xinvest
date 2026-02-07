
# Plano: Corrigir URL de Redirecionamento do Email de Recuperação de Senha

## Problema Identificado

O link enviado no email de recuperação de senha está direcionando para uma página inexistente.

### Inconsistência Encontrada:

| Local | URL Atual | Status |
|-------|-----------|--------|
| Rota no App.tsx | `/auth/reset-password` | ✅ Correto |
| AuthContext.tsx (esqueci senha do usuário) | `/auth/reset-password` | ✅ Correto |
| Edge Function (admin envia reset) | `/reset-password` | ❌ **Errado** |

A Edge Function `admin-user-actions` está enviando emails com o link `https://top3xinvest.lovable.app/reset-password`, mas a rota correta é `https://top3xinvest.lovable.app/auth/reset-password`.

---

## Solução

Corrigir a URL na Edge Function `admin-user-actions` para usar o caminho correto `/auth/reset-password`.

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/admin-user-actions/index.ts` | Corrigir URL de `/reset-password` para `/auth/reset-password` |

---

## Alteração Detalhada

**Linha 89 - Antes:**
```typescript
{ redirectTo: data?.redirectTo || 'https://top3xinvest.lovable.app/reset-password' }
```

**Depois:**
```typescript
{ redirectTo: data?.redirectTo || 'https://top3xinvest.lovable.app/auth/reset-password' }
```

---

## Fluxo Corrigido

```text
1. Admin clica "Enviar Email de Redefinição"
          |
          v
2. Edge Function envia email via Supabase Auth
   com redirectTo = /auth/reset-password
          |
          v
3. Usuário recebe email e clica no link
          |
          v
4. Supabase redireciona para:
   https://top3xinvest.lovable.app/auth/reset-password#access_token=...
          |
          v
5. Página ResetPassword.tsx carrega ✅
          |
          v
6. Usuário define nova senha
```

---

## Resultado Esperado

Após a correção, quando um admin enviar o email de redefinição de senha, o usuário receberá um link que abrirá corretamente a página de redefinição de senha, onde poderá criar uma nova senha.

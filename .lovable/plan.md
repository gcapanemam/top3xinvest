

# Plano: Corrigir Saldo na Pagina de Robos para Impersonacao

## Problema Identificado
A pagina de Robos (`src/pages/Robots.tsx`) usa `user.id` (o ID do admin logado) para buscar o saldo e criar investimentos. Quando o admin impersona um usuario via "Acessar Painel", o sistema busca o saldo do admin (que e $0), nao do usuario impersonado. Por isso aparece "saldo insuficiente".

## Causa Raiz
- `fetchUserBalance` usa `user.id` em vez de `effectiveUserId`
- `handleInvest` cria o investimento com `user_id: user.id` (admin) em vez do usuario impersonado
- `fetchRobots` tambem filtra investimentos pelo `user.id` errado

## Mudancas em `src/pages/Robots.tsx`

### 1. Importar `effectiveUserId` do AuthContext
Trocar `const { user } = useAuth()` por `const { user, effectiveUserId } = useAuth()`

### 2. Usar `effectiveUserId` em todas as queries
- `fetchUserBalance`: trocar `.eq('user_id', user.id)` por `.eq('user_id', effectiveUserId)`
- `fetchRobots`: trocar `user.id` por `effectiveUserId` na busca de investimentos ativos
- `handleInvest`: trocar `user_id: user.id` por `user_id: effectiveUserId` ao criar investimento e ao atualizar saldo

### 3. Atualizar dependencias dos useEffect
- Trocar `[user]` por `[effectiveUserId]` nos useEffect de fetch

### Detalhes tecnicos

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Robots.tsx` | Substituir todas as referencias a `user.id` por `effectiveUserId` nas queries de saldo, investimentos e criacao de investimento |

Isso garante que quando o admin impersona um usuario, a pagina de robos mostra o saldo correto e cria investimentos na conta do usuario impersonado.



# Plano: Corrigir impersonacao em todas as paginas

## Problema
Quando o admin usa "Acessar Painel" para ver o dashboard de um usuario, varias paginas continuam mostrando dados do admin em vez do usuario impersonado. Isso acontece porque essas paginas usam `user.id` (ID do admin autenticado) ao inves de `effectiveUserId` (que prioriza o usuario impersonado).

## Paginas afetadas

| Pagina | Arquivo | Problema |
|--------|---------|----------|
| Meus Investimentos | `src/pages/Investments.tsx` | Busca investimentos do admin |
| Saques | `src/pages/Withdrawals.tsx` | Busca saldo e saques do admin |
| Depositos | `src/pages/Deposits.tsx` | Busca depositos do admin |
| Notificacoes | `src/pages/Notifications.tsx` | Busca notificacoes do admin |
| Minha Rede | `src/pages/MLMNetwork.tsx` | Busca perfil, stats, arvore e comissoes do admin |

## Paginas ja corretas (nao precisam de alteracao)
- Dashboard, Robos, Recebimentos, Configuracoes - ja usam `effectiveUserId`

## Correcoes

### 1. Investments.tsx
- Importar `effectiveUserId` do `useAuth()` (atualmente so importa `user`)
- Substituir `user!.id` por `effectiveUserId` na query de investimentos (linha 73)
- Alterar o `useEffect` para depender de `effectiveUserId` em vez de `user`

### 2. Withdrawals.tsx
- Importar `effectiveUserId` do `useAuth()`
- Substituir `user!.id` por `effectiveUserId` nas queries de perfil (linha 57), saques (linha 68)
- Na criacao de saque (linha 120), manter `user!.id` para evitar que o admin crie saques em nome de outro usuario, OU usar `effectiveUserId` se o admin deve poder fazer isso
- Alterar o `useEffect` para depender de `effectiveUserId`

### 3. Deposits.tsx
- Importar `effectiveUserId` do `useAuth()`
- Substituir `user!.id` por `effectiveUserId` na query de depositos (linha 57)
- Na criacao de deposito (linha 108), manter `user!.id` (mesma logica de saques)
- Alterar o `useEffect` para depender de `effectiveUserId`

### 4. Notifications.tsx
- Importar `effectiveUserId` do `useAuth()`
- Substituir `user!.id` por `effectiveUserId` na query de notificacoes (linha 33)
- Alterar o `useEffect` para depender de `effectiveUserId`

### 5. MLMNetwork.tsx
- Substituir todas as ocorrencias de `user.id` por `effectiveUserId` nas queries (linhas 142, 158, 174, 209)
- Ja importa `effectiveUserId` mas nao usa nas queries de perfil, stats, arvore e comissoes

## Observacao importante
Para acoes de escrita (criar saque, criar deposito), as queries continuarao usando `user!.id` do admin autenticado, pois operacoes financeiras reais devem ser feitas pelo usuario real. O objetivo e apenas corrigir a **visualizacao** dos dados.

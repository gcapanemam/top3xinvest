

# Plano: Finalizar investimentos automaticamente quando o prazo expira

## Problema atual

Quando o `lock_until` de um investimento expira, nada acontece:
- O `status` continua `active` no banco
- O `profit_accumulated` permanece `0.00`
- O saldo do usuario nao e creditado
- Apenas o badge visual muda na tela (e so apos refresh)

## Solucao

Criar uma funcao no banco de dados que finaliza investimentos expirados, creditando o valor investido + lucro calculado no saldo do usuario. Essa funcao sera chamada automaticamente quando o usuario acessar a pagina de Investimentos ou o Dashboard.

## Detalhes tecnicos

### 1. Funcao PostgreSQL: `finalize_expired_investments`

Criar uma funcao RPC que:
1. Busca todos os investimentos com `status = 'active'` e `lock_until < now()`
2. Para cada investimento encontrado:
   - Calcula o lucro a partir das operacoes do robo (`robot_operations`), somando os percentuais diarios e aplicando sobre o valor investido (mesma logica do frontend)
   - Atualiza `profit_accumulated` com o lucro calculado
   - Muda o `status` para `completed`
   - Credita `amount + lucro` no `balance` do perfil do usuario
3. Retorna a quantidade de investimentos finalizados

A funcao aceita opcionalmente um `p_user_id` para filtrar apenas investimentos de um usuario especifico.

```text
Pseudocodigo:
  PARA CADA investimento ativo com lock_until expirado DO usuario:
    lucro = calcular_lucro_das_operacoes(robot_id, amount)
    UPDATE investments SET status='completed', profit_accumulated=lucro
    UPDATE profiles SET balance = balance + amount + lucro
  RETORNAR quantidade processada
```

### 2. Migracao SQL

Uma unica migracao que cria a funcao `finalize_expired_investments(p_user_id UUID)`.

### 3. Chamada no frontend

**Investments.tsx:**
- Ao carregar a pagina (`fetchInvestments`), chamar `supabase.rpc('finalize_expired_investments', { p_user_id: effectiveUserId })` ANTES de buscar os investimentos
- Se retornar > 0, os dados ja virao atualizados na query seguinte

**Dashboard.tsx:**
- Ao carregar o dashboard (`fetchData`), chamar a mesma RPC antes de buscar investimentos
- Isso garante que o saldo e status estejam corretos em ambas as paginas

### 4. Timer de auto-refresh (ja existente)

O timer de 30 segundos ja implementado em `Investments.tsx` continuara funcionando, mas agora quando detectar investimentos expirados, vai re-executar o `fetchInvestments` que por sua vez chama a RPC de finalizacao.

## Fluxo resumido

```text
Usuario abre pagina
  -> RPC finalize_expired_investments(user_id)
    -> Investimentos expirados encontrados?
      -> SIM: Calcula lucro, credita saldo, muda status para completed
      -> NAO: Nada acontece
  -> Busca investimentos atualizados
  -> Exibe na tela com status correto
```

## Arquivos modificados

- **Nova migracao SQL**: Funcao `finalize_expired_investments`
- **src/pages/Investments.tsx**: Chamar RPC antes de buscar dados + ajustar timer para re-fetch
- **src/pages/Dashboard.tsx**: Chamar RPC antes de buscar dados


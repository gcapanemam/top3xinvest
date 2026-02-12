

# Plano: Verificar e garantir que operacoes refletem nos lucros de todos os usuarios

## Diagnostico

Apos investigacao detalhada, identifiquei que:

1. **As operacoes existem no banco** - Robot `dbf0e633` tem 20 operacoes (Feb 10 e 11) com 6.61% de lucro total
2. **O calculo de lucro esta correto** - O codigo em `Investments.tsx` e `Dashboard.tsx` calcula lucros dinamicamente a partir das operacoes
3. **O bug principal ja foi corrigido** - A correcao de impersonacao feita na mensagem anterior resolvia o problema do admin ver dados errados ao acessar paineis de usuarios

## Problema residual potencial

As politicas RLS da tabela `robot_operations` podem estar configuradas como **RESTRICTIVE** (restritivas). Se ambas as politicas forem restritivas, a politica "Admins can manage" (que exige `is_admin()`) pode bloquear usuarios comuns de lerem as operacoes, mesmo com a politica "Everyone can view" retornando `true`. Isso significaria que usuarios reais (nao-admin) veriam lucro $0.00 ao acessar seus proprios paineis.

## Correcoes

### 1. Garantir que a politica SELECT de `robot_operations` seja PERMISSIVE
- Recriar a politica "Everyone can view robot operations" como PERMISSIVE para garantir que usuarios comuns possam ler as operacoes
- Manter a politica admin como RESTRICTIVE para gerenciamento

### 2. Aplicar a mesma correcao para outras tabelas publicas
Verificar e corrigir tabelas que seguem o mesmo padrao e precisam ser lidas por usuarios comuns:
- `robots` (usuarios precisam ver robos ativos)
- `cryptocurrencies` (usuarios precisam ver cotacoes)
- `robot_cryptocurrencies` (usuarios precisam ver criptos dos robos)
- `crypto_price_history` (usuarios precisam ver historico)
- `mlm_settings` (usuarios precisam ver configuracoes de comissao)

### 3. Verificar o fluxo completo
- Testar que o lucro aparece corretamente nas paginas de Investimentos, Dashboard e Extrato de Recebimentos

## Detalhes tecnicos

### Migracao SQL

Para cada tabela com politica publica de leitura, recriar a politica SELECT como PERMISSIVE:

```sql
-- robot_operations
DROP POLICY IF EXISTS "Everyone can view robot operations" ON robot_operations;
CREATE POLICY "Everyone can view robot operations" 
  ON robot_operations FOR SELECT 
  USING (true);

-- Repetir padrao similar para robots, cryptocurrencies, etc.
```

### Paginas afetadas (sem mudanca de codigo necessaria)
- `src/pages/Investments.tsx` - ja calcula lucro de operacoes corretamente
- `src/pages/Dashboard.tsx` - ja calcula lucro acumulado e graficos corretamente
- `src/pages/Receivables.tsx` - ja busca operacoes para extrato

A correcao e puramente no nivel do banco de dados (RLS), sem necessidade de alterar codigo frontend.


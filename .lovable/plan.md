

# Plano: Gatilho de Comissoes MLM

## Visao Geral

Implementar um sistema automatico de calculo e distribuicao de comissoes quando um investimento gera lucro. O sistema distribuira comissoes para ate 4 niveis da rede de indicacoes conforme os percentuais definidos (100%, 50%, 25%, 10%).

## Funcionalidades a Implementar

### 1. Funcao de Creditar Lucro com Comissoes
Uma funcao que o administrador pode chamar para creditar lucro a um investimento, e automaticamente:
- Atualiza o `profit_accumulated` do investimento
- Calcula e distribui comissoes para toda a cadeia de indicacoes (ate 4 niveis)
- Credita o valor das comissoes no saldo dos usuarios beneficiados
- Registra as comissoes na tabela `referral_commissions`

### 2. Interface Admin para Operacoes
Botao na pagina de Robots ou nova pagina para o admin:
- Creditar lucro para todos os investimentos ativos de um robo
- Ver historico de operacoes realizadas

---

## Secao Tecnica

### 1. Nova Funcao SQL: `distribute_investment_profit`

```text
Parametros:
- p_investment_id: UUID do investimento
- p_profit_amount: Valor do lucro a ser creditado

Logica:
1. Buscar o investimento e usuario
2. Atualizar profit_accumulated do investimento
3. Buscar quem indicou o usuario (upline) ate 4 niveis
4. Para cada nivel da upline:
   - Calcular comissao baseada no percentual do nivel
   - Inserir registro em referral_commissions
   - Atualizar balance do usuario que recebe a comissao
5. Retornar sucesso/erro
```

### 2. Nova Funcao SQL: `get_user_upline`

```text
Parametros:
- p_user_id: UUID do usuario

Retorna:
- Tabela com user_id e level (1-4) de quem indicou o usuario
  ate 4 niveis acima na hierarquia

Logica (CTE recursiva):
1. Buscar quem indicou o usuario (nivel 1)
2. Buscar quem indicou o indicador (nivel 2)
3. Continuar ate nivel 4
```

### 3. Nova Funcao SQL: `credit_robot_profits`

```text
Parametros:
- p_robot_id: UUID do robo
- p_profit_percentage: Percentual de lucro a creditar

Logica:
1. Buscar todos os investimentos ativos do robo
2. Para cada investimento:
   - Calcular lucro baseado no valor investido
   - Chamar distribute_investment_profit
3. Retornar quantidade de investimentos processados
```

### 4. Estrutura das Funcoes

#### Funcao get_user_upline
```sql
CREATE OR REPLACE FUNCTION public.get_user_upline(p_user_id uuid)
RETURNS TABLE(user_id uuid, level integer)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE upline AS (
        -- Nivel 1: quem indicou o usuario
        SELECT 
            r.referrer_id as user_id,
            1 as level
        FROM public.referrals r
        WHERE r.user_id = p_user_id
        
        UNION ALL
        
        -- Niveis subsequentes
        SELECT 
            r.referrer_id,
            u.level + 1
        FROM public.referrals r
        INNER JOIN upline u ON r.user_id = u.user_id
        WHERE u.level < 4
    )
    SELECT upline.user_id, upline.level
    FROM upline
    ORDER BY upline.level;
END;
$$;
```

#### Funcao distribute_investment_profit
```sql
CREATE OR REPLACE FUNCTION public.distribute_investment_profit(
    p_investment_id uuid,
    p_profit_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_investor_id uuid;
    v_upline_user_id uuid;
    v_upline_level integer;
    v_commission_percentage numeric;
    v_commission_amount numeric;
BEGIN
    -- Buscar o investidor
    SELECT user_id INTO v_investor_id
    FROM public.investments
    WHERE id = p_investment_id;
    
    IF v_investor_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar o lucro acumulado do investimento
    UPDATE public.investments
    SET profit_accumulated = profit_accumulated + p_profit_amount,
        updated_at = now()
    WHERE id = p_investment_id;
    
    -- Distribuir comissoes para a upline
    FOR v_upline_user_id, v_upline_level IN 
        SELECT user_id, level FROM public.get_user_upline(v_investor_id)
    LOOP
        -- Definir percentual baseado no nivel
        v_commission_percentage := CASE v_upline_level
            WHEN 1 THEN 100
            WHEN 2 THEN 50
            WHEN 3 THEN 25
            WHEN 4 THEN 10
            ELSE 0
        END;
        
        -- Calcular valor da comissao
        v_commission_amount := (p_profit_amount * v_commission_percentage) / 100;
        
        IF v_commission_amount > 0 THEN
            -- Inserir registro de comissao
            INSERT INTO public.referral_commissions 
                (user_id, from_user_id, investment_id, level, percentage, amount)
            VALUES 
                (v_upline_user_id, v_investor_id, p_investment_id, 
                 v_upline_level, v_commission_percentage, v_commission_amount);
            
            -- Atualizar saldo do usuario
            UPDATE public.profiles
            SET balance = balance + v_commission_amount,
                updated_at = now()
            WHERE user_id = v_upline_user_id;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$;
```

#### Funcao credit_robot_profits
```sql
CREATE OR REPLACE FUNCTION public.credit_robot_profits(
    p_robot_id uuid,
    p_profit_percentage numeric
)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_investment RECORD;
    v_profit_amount numeric;
    v_count integer := 0;
BEGIN
    FOR v_investment IN 
        SELECT id, amount 
        FROM public.investments 
        WHERE robot_id = p_robot_id 
        AND status = 'active'
    LOOP
        -- Calcular lucro baseado no valor investido
        v_profit_amount := (v_investment.amount * p_profit_percentage) / 100;
        
        -- Distribuir lucro e comissoes
        PERFORM public.distribute_investment_profit(
            v_investment.id, 
            v_profit_amount
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$;
```

### 5. Interface Admin - Novo Componente em AdminRobots.tsx

Adicionar botao "Creditar Lucro" em cada card de robo que abre um dialog:

```text
+------------------------------------------+
|  Creditar Lucro - Robo BTC Pro           |
|                                          |
|  Percentual de lucro:                    |
|  [_______%] (sobre o valor investido)    |
|                                          |
|  Investimentos ativos: 45                |
|  Volume total: R$ 250.000,00             |
|  Lucro estimado: R$ 5.000,00             |
|                                          |
|  [Cancelar]  [Confirmar Credito]         |
+------------------------------------------+
```

### 6. Fluxo de Implementacao

```text
1. Criar funcao get_user_upline (SQL)
   |
   v
2. Criar funcao distribute_investment_profit (SQL)
   |
   v
3. Criar funcao credit_robot_profits (SQL)
   |
   v
4. Atualizar AdminRobots.tsx com botao de credito
   |
   v
5. Adicionar dialog de creditar lucro
   |
   v
6. Testar fluxo completo
```

### 7. Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar 3 novas funcoes |
| src/pages/admin/AdminRobots.tsx | Adicionar botao e dialog de creditar lucro |

### 8. Cenario de Uso

1. Admin acessa pagina de Robos
2. Clica em "Creditar Lucro" no robo BTC Pro
3. Define percentual (ex: 2%)
4. Sistema calcula lucro para cada investimento ativo
5. Sistema distribui comissoes automaticamente:
   - Se usuario A investiu R$ 1.000 e gerou R$ 20 de lucro
   - Se usuario A foi indicado por B (nivel 1): B recebe R$ 20 (100%)
   - Se B foi indicado por C (nivel 2): C recebe R$ 10 (50%)
   - Se C foi indicado por D (nivel 3): D recebe R$ 5 (25%)
   - Se D foi indicado por E (nivel 4): E recebe R$ 2 (10%)
6. Saldos sao atualizados automaticamente
7. Historico de comissoes e registrado

### 9. Seguranca

- Funcoes usam SECURITY DEFINER para executar com privilegios elevados
- Apenas admins podem chamar credit_robot_profits via RLS
- Todas as operacoes sao atomicas (dentro de transacao)
- Logs de comissoes sao imutaveis apos criacao

### 10. Atualizacao Visual nas Paginas

Apos implementacao, as comissoes distribuidas aparecerao:
- Na pagina MLMNetwork do usuario em "Historico de Comissoes"
- No card de estatisticas "Comissoes Recebidas"
- No saldo do usuario (balance no profiles)


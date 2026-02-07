

# Plano: Bonificação de Rede Baseada em Depósitos

## Resumo
Ajustar o sistema de comissões MLM para que a bonificação seja calculada sobre o **valor do depósito** do usuário, não sobre o lucro dos investimentos. Os percentuais configuráveis pelo admin (ex: Nível 1 = 10%, Nível 2 = 5%, etc.) serão aplicados sobre o valor depositado.

## Exemplo (conforme especificado)
- Usuário deposita **$100**
- Nível 1 (quem indicou diretamente) ganha: **10% = $10**
- Nível 2 ganha: **5% = $5**
- Nível 3 ganha: **3% = $3**
- Nível 4 ganha: **2% = $2**
- O usuário que depositou **permanece com os $100** (sem dedução)

## Mudanças Necessárias

### 1. Banco de Dados (Nova Função RPC)

Criar uma nova função `distribute_deposit_commission` que será chamada quando um depósito for aprovado:

```sql
CREATE OR REPLACE FUNCTION public.distribute_deposit_commission(
    p_deposit_id uuid,
    p_user_id uuid,
    p_deposit_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_upline_user_id uuid;
    v_upline_level integer;
    v_commission_percentage numeric;
    v_commission_amount numeric;
BEGIN
    -- Distribuir comissões para a upline (4 níveis)
    FOR v_upline_user_id, v_upline_level IN 
        SELECT get_user_upline.user_id, get_user_upline.level 
        FROM public.get_user_upline(p_user_id)
    LOOP
        -- Buscar percentual da tabela mlm_settings
        SELECT commission_percentage INTO v_commission_percentage
        FROM public.mlm_settings
        WHERE level = v_upline_level;
        
        -- Fallback se não encontrar
        IF v_commission_percentage IS NULL THEN
            v_commission_percentage := 0;
        END IF;
        
        -- Calcular valor da comissão sobre o depósito
        v_commission_amount := (p_deposit_amount * v_commission_percentage) / 100;
        
        IF v_commission_amount > 0 THEN
            -- Inserir registro de comissão (usando deposit_id)
            INSERT INTO public.referral_commissions 
                (user_id, from_user_id, investment_id, level, percentage, amount)
            VALUES 
                (v_upline_user_id, p_user_id, NULL, 
                 v_upline_level, v_commission_percentage, v_commission_amount);
            
            -- Creditar saldo na carteira do usuário da upline
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

### 2. Edge Function: `oxapay-webhook`

Modificar para chamar a nova função quando o depósito for aprovado:

**Arquivo:** `supabase/functions/oxapay-webhook/index.ts`

Após creditar o saldo do usuário (linha ~114), adicionar chamada para distribuir comissões:

```typescript
// Após creditar o saldo do usuário...
// Distribuir comissões MLM para a rede
console.log("Distributing MLM commissions for deposit...");
const { error: commissionError } = await supabase.rpc("distribute_deposit_commission", {
  p_deposit_id: orderId,
  p_user_id: deposit.user_id,
  p_deposit_amount: depositAmount,
});

if (commissionError) {
  console.error("Error distributing commissions:", commissionError);
  // Não falhar o webhook por isso - o depósito já foi creditado
} else {
  console.log("MLM commissions distributed successfully");
}
```

### 3. Atualizar Valores Padrão da Tabela `mlm_settings`

Os valores atuais (100%, 50%, 25%, 10%) eram baseados no lucro. Para depósitos, atualizar para valores mais baixos:

```sql
UPDATE public.mlm_settings SET commission_percentage = 10 WHERE level = 1;
UPDATE public.mlm_settings SET commission_percentage = 5 WHERE level = 2;
UPDATE public.mlm_settings SET commission_percentage = 3 WHERE level = 3;
UPDATE public.mlm_settings SET commission_percentage = 2 WHERE level = 4;
```

### 4. (Opcional) Alterar Função `distribute_investment_profit`

Se o admin **não quiser mais** distribuir comissões sobre lucros de investimento:
- Remover a lógica de comissão da função `distribute_investment_profit`
- Manter apenas a atualização do `profit_accumulated`

**Ou**, se quiser manter **ambos** (comissão sobre depósito E sobre lucro):
- Não alterar a função `distribute_investment_profit`
- Ambas as bonificações funcionarão

## Fluxo Final

```text
┌─────────────────────────────────────────────────────────────┐
│                  USUÁRIO FAZ DEPÓSITO                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│      OxaPay confirma pagamento via Webhook                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Depósito atualizado para "approved"                     │
│  2. Saldo do usuário creditado ($100)                       │
│  3. distribute_deposit_commission() chamada                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           DISTRIBUIÇÃO DE COMISSÕES (exemplo)               │
├─────────────────────────────────────────────────────────────┤
│  • Nível 1 (quem indicou): 10% × $100 = $10                 │
│  • Nível 2: 5% × $100 = $5                                  │
│  • Nível 3: 3% × $100 = $3                                  │
│  • Nível 4: 2% × $100 = $2                                  │
│                                                             │
│  → Cada usuário tem seu saldo creditado                     │
│  → Registro inserido em referral_commissions                │
└─────────────────────────────────────────────────────────────┘
```

## Arquivos que Serão Modificados

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| Nova migration SQL | Criar função `distribute_deposit_commission` + atualizar valores padrão |
| `supabase/functions/oxapay-webhook/index.ts` | Adicionar chamada à RPC de distribuição |

## Impacto e Considerações

- **Sem dedução do usuário**: O usuário que deposita recebe 100% do valor na carteira
- **Comissões são "custo" da plataforma**: A bonificação é paga pela plataforma, não descontada do depositante
- **Retroatividade**: Depósitos já aprovados não receberão comissão automaticamente
- **Configurável pelo admin**: Os percentuais podem ser ajustados a qualquer momento via tela de configuração MLM


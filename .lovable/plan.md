

# Plano: Creditar Valor Real Pago via OxaPay

## Problema
O usuario criou um deposito de $1.10, mas pagou $9.85 em USDT no OxaPay. O webhook creditou apenas $1.10 (o valor da fatura) ao inves do valor realmente pago. Isso acontece porque o webhook usa `deposit.amount` (valor da fatura) para creditar o saldo, ignorando o valor real enviado pelo usuario.

Dados do caso:
- Deposito: `8db996c7-fcbe-4baf-9223-1bc853b5148e`
- Usuario: `06cb34f5-8071-4c25-b84c-2512a4b4562b`
- Valor da fatura: $1.10
- Valor pago: 9.85 USDT (~$9.85 USD)
- Saldo atual: $1.10 (deveria ser $9.85)

## Solucao

### 1. Correcao manual do deposito atual (Migracao SQL)
- Atualizar o `amount` do deposito de $1.10 para $9.85
- Creditar a diferenca ($8.75) no saldo do usuario
- Atualizar o registro de transacao correspondente

### 2. Corrigir webhook para depositos futuros
No `oxapay-webhook/index.ts`, usar o valor real pago (campo `payAmount` * `rate` do webhook) em vez do valor da fatura quando houver diferenca:

- Extrair `payAmount` e `rate` do corpo do webhook
- Calcular o valor real em USD: `payAmount * rate`
- Se o valor real for diferente do valor da fatura, usar o valor real
- Atualizar o campo `amount` do deposito com o valor real
- Creditar o valor real no saldo do usuario

## Detalhes tecnicos

### Migracao SQL

```text
1. UPDATE deposits SET amount = 9.85 WHERE id = '8db996c7-...'
2. UPDATE profiles SET balance = balance + 8.75 WHERE user_id = '06cb34f5-...'
3. UPDATE transactions SET amount = 9.85 WHERE reference_id = '8db996c7-...'
```

### Mudancas no webhook (`supabase/functions/oxapay-webhook/index.ts`)

| Mudanca | Descricao |
|---------|-----------|
| Extrair campos | Adicionar `payAmount`, `rate` do body do webhook |
| Calcular USD real | `actualUsdPaid = parseFloat(payAmount) * parseFloat(rate)` quando ambos disponiveis |
| Atualizar amount | Se `actualUsdPaid` difere do invoice amount, atualizar `deposits.amount` com o valor real |
| Creditar saldo | Usar `actualUsdPaid` (ou `depositAmount` se payAmount nao disponivel) para creditar o saldo |
| Log detalhado | Logar quando o valor pago difere do valor da fatura |

### Logica do calculo no webhook

```text
1. webhookAmount = amount do webhook (valor da fatura em USD)
2. Se payAmount e rate existem:
   a. actualUsdPaid = payAmount * rate
   b. Se actualUsdPaid > webhookAmount → usar actualUsdPaid
3. Senao: usar depositAmount (comportamento atual)
4. Atualizar deposits.amount com o valor final
5. Creditar o valor final ao saldo
```

Isso garante que o usuario sempre receba o credito pelo valor que realmente pagou, mesmo quando diferente da fatura original.



# Plano: Alterar Moeda do Sistema de Real para Dólar

## Resumo
Alterar todas as formatações e referências de moeda no sistema de Real (R$, BRL, pt-BR) para Dólar ($ USD, en-US).

## Arquivos que serão modificados

### Páginas do Usuário

1. **`src/pages/Dashboard.tsx`**
   - Alterar `formatCurrency` de `pt-BR`/`BRL` para `en-US`/`USD`
   - Remover símbolo `R$` do tooltip do gráfico (linha 451)

2. **`src/pages/Investments.tsx`**
   - Alterar `formatCurrency` de `pt-BR`/`BRL` para `en-US`/`USD`

3. **`src/pages/Withdrawals.tsx`**
   - Alterar `formatCurrency` de `pt-BR`/`BRL` para `en-US`/`USD`
   - Atualizar mensagem de valor mínimo de "R$ 20,00" para "$20.00"
   - Atualizar placeholder "R$ 0,00" para "$0.00"

4. **`src/pages/Robots.tsx`**
   - Alterar `formatCurrency` de `pt-BR`/`BRL` para `en-US`/`USD`
   - Remover símbolo "R$" do input de investimento

5. **`src/pages/Deposits.tsx`**
   - Já está em USD - manter como está

6. **`src/pages/PaymentStatus.tsx`**
   - Já está em USD - manter como está

7. **`src/pages/MLMNetwork.tsx`**
   - Alterar `formatCurrency` de `pt-BR`/`BRL` para `en-US`/`USD`
   - Atualizar `formatCurrencyShort` de `R$` para `$`

### Páginas Administrativas

8. **`src/pages/admin/AdminDashboard.tsx`**
   - Alterar `formatCurrency` de `pt-BR`/`BRL` para `en-US`/`USD`

9. **`src/pages/admin/AdminDeposits.tsx`**
   - Unificar `formatCurrency` para usar sempre `en-US`/`USD`
   - Atualizar mensagens de notificação de "R$" para "$"

10. **`src/pages/admin/AdminWithdrawals.tsx`**
    - Alterar `formatCurrency` de `pt-BR`/`BRL` para `en-US`/`USD`
    - Atualizar mensagens de notificação de "R$" para "$"

11. **`src/pages/admin/AdminUsers.tsx`**
    - Alterar `formatCurrency` de `pt-BR`/`BRL` para `en-US`/`USD`
    - Remover símbolo "R$" do input de saldo

12. **`src/pages/admin/AdminMLM.tsx`**
    - Alterar `formatCurrency` de `pt-BR`/`BRL` para `en-US`/`USD`
    - Atualizar formatação inline para usar USD

13. **`src/pages/admin/AdminRobots.tsx`**
    - Alterar `formatCurrency` de `pt-BR`/`BRL` para `en-US`/`USD` (se existir)

## Detalhes Técnicos

### Padrão atual (Real)
```typescript
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
```

### Novo padrão (Dólar)
```typescript
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};
```

### Substituições de texto
| Atual | Novo |
|-------|------|
| `R$ 20,00` | `$20.00` |
| `R$ 0,00` | `$0.00` |
| `R$ ${valor}` | `$${valor}` |
| `Mínimo: R$ 20,00` | `Minimum: $20.00` |

## Considerações
- Nenhuma alteração de banco de dados necessária
- Os valores já são armazenados como números, apenas a exibição muda
- Depósitos cripto já estão em USD
- Saques via PIX: mantém funcionalidade, apenas a exibição do valor muda para USD

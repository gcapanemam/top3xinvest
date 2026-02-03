

# Plano: Adicionar USDT ao Sistema

## Visao Geral

Adicionar a criptomoeda USDT (Tether) na tabela `cryptocurrencies` para que ela fique disponivel para cadastro de carteiras de deposito.

---

## Criptomoedas Atuais no Sistema

| Simbolo | Nome | Preco Atual |
|---------|------|-------------|
| ADA | Cardano | $0.58 |
| BNB | Binance Coin | $310.50 |
| BTC | Bitcoin | $42,500.00 |
| DOGE | Dogecoin | $0.082 |
| DOT | Polkadot | $7.85 |
| ETH | Ethereum | $2,250.00 |
| SOL | Solana | $98.75 |
| XRP | Ripple | $0.62 |
| **USDT** | **Tether** | **$1.00** (sera adicionado) |

---

## Secao Tecnica

### Migracao SQL

```sql
INSERT INTO public.cryptocurrencies (symbol, name, current_price, price_change_24h, is_active)
VALUES ('USDT', 'Tether', 1.00, 0.00, true);
```

---

## Resultado

Apos a migracao, o USDT aparecera na lista de criptomoedas disponiveis ao cadastrar uma nova carteira de deposito na pagina /admin/wallets.


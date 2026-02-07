

# Plano: Busca Automatica de Cotacoes

## Visao Geral

Alterar o sistema para buscar e salvar precos de criptomoedas automaticamente, eliminando a necessidade de clique manual do administrador. Os precos serao atualizados ao carregar a pagina e salvos automaticamente no banco de dados.

---

## Mudanca de Comportamento

| Antes | Depois |
|-------|--------|
| Admin clica em "Buscar Precos Reais" | Precos buscados automaticamente ao carregar |
| Admin edita manualmente os campos | Campos mostram dados em tempo real (somente leitura) |
| Admin clica em "Salvar Alteracoes" | Dados salvos automaticamente no banco |
| Processo manual em 3 etapas | Processo automatico em 1 etapa |

---

## Novo Fluxo

```text
[Pagina Carrega]
      |
      v
[Busca criptos do banco]
      |
      v
[Chama Edge Function CoinGecko]
      |
      v
[Atualiza banco automaticamente]
      |
      v
[Exibe tabela com dados atuais]
      |
      v
[Botao "Atualizar Agora" para refresh manual]
```

---

## Alteracoes Propostas

### 1. Fluxo Automatico ao Carregar

Ao carregar a pagina, o sistema ira:
1. Buscar lista de criptomoedas do banco
2. Chamar a Edge Function para obter precos reais
3. Salvar os precos atualizados no banco
4. Exibir a tabela com os dados ja atualizados

### 2. Interface Simplificada

- Remover campos de input editaveis
- Exibir apenas dados de leitura
- Manter botao "Atualizar Agora" para refresh manual
- Mostrar timestamp da ultima atualizacao

### 3. Estados de Loading

- Loading inicial enquanto busca dados
- Indicador de sincronizacao com a API
- Mensagem de sucesso/erro apos atualizacao

---

## Secao Tecnica

### Arquivo: src/pages/admin/AdminPrices.tsx

**Principais alteracoes:**

1. **Novo useEffect para busca automatica:**
```typescript
useEffect(() => {
  if (isAdmin && cryptos.length > 0) {
    fetchAndSaveRealPrices();
  }
}, [isAdmin, cryptos.length]);
```

2. **Nova funcao combinada fetchAndSaveRealPrices:**
```typescript
const fetchAndSaveRealPrices = async () => {
  setIsFetchingReal(true);
  
  try {
    const symbols = cryptos.map(c => c.symbol);
    const { data, error } = await supabase.functions.invoke('fetch-crypto-prices', {
      body: { symbols }
    });
    
    if (error) throw error;
    
    // Salvar automaticamente no banco
    for (const crypto of cryptos) {
      if (data[crypto.symbol]) {
        const newPrice = data[crypto.symbol].price;
        const newChange = data[crypto.symbol].change;
        
        await supabase
          .from('cryptocurrencies')
          .update({
            current_price: newPrice,
            price_change_24h: newChange,
          })
          .eq('id', crypto.id);
      }
    }
    
    setLastUpdated(new Date());
    fetchCryptos(); // Recarregar dados do banco
    
    toast({
      title: 'Cotacoes Atualizadas',
      description: 'Precos sincronizados com o mercado!',
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    setIsFetchingReal(false);
  }
};
```

3. **Interface simplificada (somente leitura):**
- Remover campos `<Input>` editaveis
- Exibir valores formatados diretamente
- Adicionar coluna com timestamp da ultima atualizacao

4. **Novo estado para timestamp:**
```typescript
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
```

5. **Botao atualizado:**
```tsx
<button onClick={fetchAndSaveRealPrices} disabled={isFetchingReal}>
  <RefreshCw className={isFetchingReal ? 'animate-spin' : ''} />
  {isFetchingReal ? 'Atualizando...' : 'Atualizar Agora'}
</button>
```

---

## Layout Final

```text
+-----------------------------------------------------------+
| Gerenciar Cotacoes                                        |
| Precos atualizados automaticamente do mercado             |
|                                                           |
| Ultima atualizacao: 07/02/2026 15:30:45                   |
|                              [🔄 Atualizar Agora]         |
+-----------------------------------------------------------+
| Criptomoeda      |  Preco (USD)  | Variacao 24h           |
+-----------------------------------------------------------+
| Bitcoin BTC      |  $97,500.00   | +2.35% ▲               |
| Ethereum ETH     |  $2,850.00    | -1.20% ▼               |
| Solana SOL       |  $185.00      | +5.67% ▲               |
+-----------------------------------------------------------+
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| src/pages/admin/AdminPrices.tsx | Remover inputs editaveis, adicionar busca automatica |

---

## Resultado Esperado

- Precos buscados e salvos automaticamente ao abrir a pagina
- Interface simplificada sem campos editaveis
- Botao para atualizar manualmente quando necessario
- Timestamp mostrando quando foi a ultima atualizacao
- Processo totalmente automatizado


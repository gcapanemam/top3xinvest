
# Plano: Redesenhar Animação de Trading

## Resumo
Alterar o componente `TradingSimulation` para exibir um layout diferente:
1. **"Corretoras conectadas:"** - Título com lista de todas as corretoras
2. Cada corretora exibe: **bolinha verde + ícone + nome**
3. **Indicador circular animado** com texto "Robô em operação"

## Visual Proposto

```text
┌────────────────────────────────────────────────────────────────────┐
│  Corretoras conectadas:                                            │
│                                                                     │
│  🟢 [BI] Binance    🟢 [CO] Coinbase    🟢 [UP] Upbit              │
│  🟢 [OK] OKX        🟢 [BY] Bybit       🟢 [BG] Bitget             │
│  🟢 [GA] Gate       🟢 [KU] KuCoin      🟢 [ME] MEXC               │
│  🟢 [HT] HTX                                                        │
│                                                                     │
│     ( ⟳ )  Robô em operação                                        │
│   [spinner]                                                         │
└────────────────────────────────────────────────────────────────────┘
```

## Arquivo a ser Modificado

### `src/components/investments/TradingSimulation.tsx`

#### Mudanças:

1. **Remover lógica de steps** - Não precisa mais dos passos animados
2. **Exibir todas as corretoras** - Lista completa com bolinha verde + ícone + nome
3. **Adicionar spinner circular** - Com texto "Robô em operação"

#### Novo código:

```typescript
const EXCHANGES = [
  { name: 'Binance', color: '#F0B90B', textColor: '#000000' },
  { name: 'Coinbase', color: '#0052FF', textColor: '#FFFFFF' },
  // ... todas as 10 corretoras
];

// Componente de bolinha verde pulsante
const GreenDot = () => (
  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
);

// Logo da corretora
const ExchangeLogo = ({ name, color, textColor }) => (
  <div
    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
    style={{ backgroundColor: color, color: textColor }}
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
);

// Spinner circular animado
const Spinner = () => (
  <div className="relative w-10 h-10">
    <div className="absolute inset-0 rounded-full border-2 border-green-500/20" />
    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-500 animate-spin" />
  </div>
);

export const TradingSimulation = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="space-y-4">
      {/* Título */}
      <p className="text-sm text-gray-400 font-medium">Corretoras conectadas:</p>
      
      {/* Grid de corretoras */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {EXCHANGES.map((exchange) => (
          <div key={exchange.name} className="flex items-center gap-2">
            <GreenDot />
            <ExchangeLogo {...exchange} />
            <span className="text-xs text-gray-300">{exchange.name}</span>
          </div>
        ))}
      </div>
      
      {/* Indicador de operação */}
      <div className="flex items-center gap-3 pt-2">
        <Spinner />
        <span className="text-sm text-green-400 font-medium">Robô em operação</span>
      </div>
    </div>
  );
};
```

## Detalhes Técnicos

### Animações CSS
- **Bolinha verde**: `animate-pulse` (já existe no Tailwind)
- **Spinner**: `animate-spin` (já existe no Tailwind)

### Responsividade
- **Mobile**: 2 colunas de corretoras
- **Tablet**: 3 colunas
- **Desktop**: 5 colunas

### Acessibilidade
- Manter suporte a `prefers-reduced-motion` (remover animações se ativado)

## Resultado Final

O componente será mais simples visualmente, mostrando:
1. Todas as 10 corretoras com status "conectado" (bolinha verde)
2. Um spinner circular indicando que o robô está operando
3. Layout responsivo em grid

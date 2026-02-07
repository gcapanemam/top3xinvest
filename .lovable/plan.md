

# Plano: Animação de Simulação de Operações em Investimentos

## Resumo
Adicionar um componente de animação visual que simula operações de trading em tempo real, exibido nos cartões de investimentos ativos. A animação mostrará etapas como "Analisando o mercado...", "Conectando na Binance...", "Executando Operações...", "Finalizando...", com logos das corretoras selecionadas aleatoriamente.

## Corretoras a serem incluídas (com logos)

| Corretora | Cor da marca |
|-----------|--------------|
| Binance | #F0B90B (amarelo) |
| Coinbase | #0052FF (azul) |
| Upbit | #093687 (azul escuro) |
| OKX | #000000 (preto/branco) |
| Bybit | #F7A600 (laranja) |
| Bitget | #00F0FF (ciano) |
| Gate | #2354E6 (azul) |
| KuCoin | #24AE8F (verde) |
| MEXC | #2A54DB (azul) |
| HTX | #1C89E5 (azul) |

## Arquivos a serem criados/modificados

### 1. Novo componente: `src/components/investments/TradingSimulation.tsx`

Componente que exibe a animação de operações simuladas com as seguintes características:

- **Estados da animação (loop contínuo)**:
  1. "Analisando o mercado..." (2-3 segundos)
  2. "Conectando na [Corretora X]..." (2-3 segundos) - corretora aleatória com logo
  3. "Executando operações..." (2-3 segundos)
  4. "Finalizando..." (1-2 segundos)
  5. Reinicia o ciclo com nova corretora aleatória

- **Visual**:
  - Ícone animado de loading/spinner
  - Logo da corretora quando conectando
  - Texto com animação de "typing" ou fade
  - Barra de progresso sutil
  - Cores consistentes com o tema (green/teal para operações ativas)

### 2. Modificar: `src/pages/Investments.tsx`

- Importar e exibir o componente `TradingSimulation` dentro de cada cartão de investimento ativo
- Posicionar abaixo do botão "Histórico de Trades" ou como parte da área de status

### 3. Adicionar logos ao projeto: `public/images/exchanges/`

Criar ícones simples SVG inline ou usar texto estilizado para cada corretora (evita dependência de imagens externas).

## Fluxo Visual da Animação

```text
┌────────────────────────────────────────────────────────────┐
│  🔄 Analisando o mercado...                                │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  25%    │
└────────────────────────────────────────────────────────────┘
                          ↓ (após 2-3s)
┌────────────────────────────────────────────────────────────┐
│  [Logo Binance] Conectando na Binance...                   │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  50%    │
└────────────────────────────────────────────────────────────┘
                          ↓ (após 2-3s)
┌────────────────────────────────────────────────────────────┐
│  ⚡ Executando operações...                                │
│  ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░  75%    │
└────────────────────────────────────────────────────────────┘
                          ↓ (após 2-3s)
┌────────────────────────────────────────────────────────────┐
│  ✅ Finalizando...                                         │
│  ████████████████████████████████████████████████  100%   │
└────────────────────────────────────────────────────────────┘
                          ↓ (reinicia com nova corretora)
```

## Estrutura do Componente

```typescript
interface Exchange {
  name: string;
  color: string;
  logo: React.ReactNode; // SVG inline ou ícone estilizado
}

const EXCHANGES: Exchange[] = [
  { name: 'Binance', color: '#F0B90B', logo: <BinanceLogo /> },
  { name: 'Coinbase', color: '#0052FF', logo: <CoinbaseLogo /> },
  // ... outras corretoras
];

interface AnimationStep {
  text: string;
  duration: number;
  progress: number;
  showExchange?: boolean;
}

const ANIMATION_STEPS: AnimationStep[] = [
  { text: 'Analisando o mercado...', duration: 2500, progress: 25 },
  { text: 'Conectando na {exchange}...', duration: 3000, progress: 50, showExchange: true },
  { text: 'Executando operações...', duration: 2500, progress: 75 },
  { text: 'Finalizando...', duration: 1500, progress: 100 },
];
```

## Detalhes Técnicos

### Animações CSS necessárias (adicionar ao tailwind.config.ts)

- `animate-typing`: efeito de digitação
- `animate-progress`: barra de progresso suave

### Props do componente

```typescript
interface TradingSimulationProps {
  isActive: boolean; // Só animar se investimento ativo
  compact?: boolean; // Versão menor para mobile
}
```

### Logos das corretoras (SVG inline simplificado)

Para evitar carregar imagens externas, criar ícones simples com as iniciais e cores da marca:

```tsx
const ExchangeIcon = ({ name, color }: { name: string; color: string }) => (
  <div 
    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
    style={{ backgroundColor: color, color: color === '#000000' ? '#fff' : '#000' }}
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
);
```

## Integração na página

No cartão de investimento ativo, adicionar logo abaixo do botão de histórico:

```tsx
{isActive && investment.robot_id && (
  <div className="mt-4 pt-4 border-t border-[#1e2a3a]">
    <div className="flex items-center justify-between">
      <Button variant="outline" size="sm" ... >
        <History className="h-4 w-4 mr-2" />
        Histórico de Trades
      </Button>
      
      {/* Nova animação de trading */}
      <TradingSimulation isActive={isActive} />
    </div>
  </div>
)}
```

## Considerações

- **Performance**: A animação usa CSS e timers JavaScript leves
- **Acessibilidade**: Respeitar `prefers-reduced-motion`
- **Responsividade**: Versão compacta para mobile
- **UX**: Loop infinito enquanto investimento ativo, transmitindo sensação de trabalho contínuo


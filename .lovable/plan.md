
# Plano: Landing Page Inspirada no BWIS

## Visao Geral

Criar uma landing page profissional e moderna inspirada no site bwis.io, adaptada para a identidade visual do Invest Hub. A pagina sera a porta de entrada para visitantes nao autenticados, apresentando os robos de trading, beneficios da plataforma e chamadas para acao.

---

## Layout Visual

### Header/Navegacao
```text
+------------------------------------------------------------------+
| [Logo] INVEST HUB     HOME | ROBOS | PARCEIROS | FAQ     [ENTRAR]|
+------------------------------------------------------------------+
```

### Hero Section
```text
+------------------------------------------------------------------+
|                                                                  |
|  Smart Crypto-Bots Gerando                  +------------------+ |
|  Lucros Diarios de 0.3%-3%                  | [Cards flutuantes| |
|                                             |  com operacoes   | |
|  Mergulhe no mundo dos investimentos        |  animadas]       | |
|  com robos automatizados. Simples,          |                  | |
|  Emocionante e Lucrativo!                   | BTC 0.59% SELL   | |
|                                             | ETH 0.94% BUY    | |
|  [COMECE AGORA ->]                          | XRP 1.10% BUY    | |
|                                             +------------------+ |
+------------------------------------------------------------------+
```

### Cards de Navegacao Rapida
```text
+------------------------------------------------------------------+
| +---------------+ +---------------+ +---------------+ +---------+|
| | VIDEO         | | ROBOS         | | PARCEIROS     | | SOBRE   ||
| | APRESENTACAO  | | LUCRATIVIDADE | | PROGRAMA      | | NOS     ||
| |               | | Aumente seu   | | Ganhe com sua | | Conheca ||
| | Conheca o     | | capital em    | | rede de       | | mais    ||
| | Invest Hub    | | ate 89%/mes   | | indicados     | | detalhes||
| +---------------+ +---------------+ +---------------+ +---------+|
+------------------------------------------------------------------+
```

### Secao Sobre
```text
+------------------------------------------------------------------+
|                                                                  |
|  Conheca o Invest Hub                                            |
|  Seu caminho para investimentos de sucesso em cripto trading     |
|                                                                  |
|  [Texto descritivo sobre a plataforma...]                        |
|                                                                  |
|  +------------+ +------------+ +------------+                    |
|  | Altos      | | Pagamentos | | Estrategias|                    |
|  | Lucros     | | Pontuais   | | Precisas   |                    |
|  +------------+ +------------+ +------------+                    |
|                                                                  |
+------------------------------------------------------------------+
```

### Secao Lucros
```text
+------------------------------------------------------------------+
|                                                                  |
|  De 0.3% a 3% de lucro liquido por dia!                          |
|                                                                  |
|  Maximize seu potencial de investimento!                         |
|  Ative seu robo e veja seu portfolio crescer.                    |
|                                                                  |
|  +-----------------+  +-----------------+                        |
|  | Lucro 7 dias    |  | Lucro 30 dias   |                        |
|  | $ 560.00        |  | $ 2,115.00      |                        |
|  +-----------------+  +-----------------+                        |
|                                                                  |
+------------------------------------------------------------------+
```

### Secao Seguranca
```text
+------------------------------------------------------------------+
|                                                                  |
|  Sua seguranca e nossa prioridade                                |
|                                                                  |
|  +------------+ +------------+ +------------+ +------------+     |
|  | Criptografia| | Auditorias | | Controle   | | Protecao   |    |
|  | de Dados   | | Regulares  | | de Acesso  | | Anti-Phish |    |
|  +------------+ +------------+ +------------+ +------------+     |
|                                                                  |
+------------------------------------------------------------------+
```

### Secao 3 Passos
```text
+------------------------------------------------------------------+
|                                                                  |
|  3 Passos Simples para Gerar Lucros                              |
|                                                                  |
|  +---------------+  +---------------+  +---------------+         |
|  |      [1]      |  |      [2]      |  |      [3]      |         |
|  |               |  |               |  |               |         |
|  | Cadastre-se   |  | Escolha um    |  | Lucre!        |         |
|  |               |  | Robo          |  |               |         |
|  | Crie sua      |  | Explore nossa |  | Aproveite os  |         |
|  | conta         |  | selecao       |  | ganhos        |         |
|  +---------------+  +---------------+  +---------------+         |
|                                                                  |
+------------------------------------------------------------------+
```

### Secao Vantagens dos Robos
```text
+------------------------------------------------------------------+
|                                                                  |
|  Vantagens dos Robos de Trading                                  |
|  Confiabilidade, Velocidade e Investimentos Sem Erros            |
|                                                                  |
|  +-------------------+  +-------------------+                    |
|  | Trading Automatico|  | Eficiencia        |                    |
|  | Processos         |  | e Velocidade      |                    |
|  | totalmente        |  |                   |                    |
|  | automatizados     |  | Execucao rapida   |                    |
|  +-------------------+  +-------------------+                    |
|                                                                  |
|  +-------------------+  +-------------------+                    |
|  | Precisao e        |  | Estabilidade      |                    |
|  | Consistencia      |  | Emocional         |                    |
|  |                   |  |                   |                    |
|  | Minimiza riscos   |  | Sem medo ou       |                    |
|  |                   |  | ganancia          |                    |
|  +-------------------+  +-------------------+                    |
|                                                                  |
+------------------------------------------------------------------+
```

### Footer
```text
+------------------------------------------------------------------+
|                                                                  |
|  [Logo] INVEST HUB                                               |
|                                                                  |
|  Links Rapidos     Suporte          Redes Sociais                |
|  - Home            - FAQ            [Twitter] [Telegram]         |
|  - Robos           - Contato                                     |
|  - Parceiros                                                     |
|                                                                  |
|  (c) 2024 Invest Hub. Todos os direitos reservados.              |
|                                                                  |
+------------------------------------------------------------------+
```

---

## Elementos Animados

1. **Cards de operacoes flutuantes**: Cards com BTC, ETH, BNB mostrando percentuais e tipo (BUY/SELL) que animam verticalmente
2. **Fade-in-up**: Elementos aparecem suavemente de baixo para cima ao carregar
3. **Hover effects**: Botoes e cards com efeitos de elevacao e brilho
4. **Gradientes animados**: Fundo com gradientes sutis em movimento

---

## Secao Tecnica

### Estrutura de Arquivos

| Arquivo | Descricao |
|---------|-----------|
| src/pages/Index.tsx | Landing page principal (reescrever completamente) |
| src/components/landing/Header.tsx | Cabecalho com navegacao |
| src/components/landing/HeroSection.tsx | Secao principal com CTA |
| src/components/landing/FloatingCards.tsx | Cards animados de operacoes |
| src/components/landing/FeaturesSection.tsx | Secao sobre/caracteristicas |
| src/components/landing/ProfitSection.tsx | Secao de lucros |
| src/components/landing/SecuritySection.tsx | Secao de seguranca |
| src/components/landing/StepsSection.tsx | 3 passos para comecar |
| src/components/landing/AdvantagesSection.tsx | Vantagens dos robos |
| src/components/landing/Footer.tsx | Rodape |

### Alteracao em App.tsx

```typescript
// Mudar a rota "/" para mostrar a landing page
<Route path="/" element={<Index />} />
// Remover o redirect para /dashboard
```

### Componente FloatingCards (animacao estilo BWIS)

```typescript
const operations = [
  { symbol: 'BTC', percent: '0.59', type: 'SELL' },
  { symbol: 'ETH', percent: '0.94', type: 'BUY' },
  { symbol: 'XRP', percent: '1.10', type: 'BUY' },
  { symbol: 'BNB', percent: '0.43', type: 'SELL' },
  { symbol: 'SOL', percent: '1.25', type: 'BUY' },
];

// Animacao vertical infinita com CSS
// Cards posicionados em diferentes alturas/delays
```

### Paleta de Cores (mantendo identidade existente)

- Background principal: #0a0f14
- Cards: #111820 com bordas #1e2a3a
- Gradiente primario: teal-500 -> cyan-500
- Texto: white/gray-400
- Acentos: verde para BUY, vermelho para SELL

### Responsividade

- Mobile: Menu hamburger, secoes empilhadas verticalmente
- Tablet: Grid 2 colunas onde aplicavel
- Desktop: Layout completo conforme mockup

---

## Fluxo de Usuario

```text
Visitante acessa "/"
        |
        v
Ve a landing page com apresentacao
        |
        v
Clica em "COMECE AGORA" ou "ENTRAR"
        |
        v
Redirecionado para /auth
        |
        v
Apos login, vai para /dashboard
```

---

## Resumo de Alteracoes

1. **Reescrever src/pages/Index.tsx** - Landing page completa
2. **Criar pasta src/components/landing/** - Componentes da landing
3. **Atualizar src/App.tsx** - Remover redirect, mostrar Index em "/"
4. **Adicionar animacoes CSS** - Floating cards, fade-in, etc.

A pagina sera totalmente responsiva, mantendo a estetica premium dark do projeto e inspirada nos elementos visuais do BWIS.

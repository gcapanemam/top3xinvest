

# Apresentacao Pitch Deck N3XPRIME - Pagina Web Navegavel

## Visao Geral

Criar uma pagina web estilo pitch deck (`/presentation`) com slides navegaveis, inspirada na apresentacao BWIS anexada, mas com todas as informacoes adaptadas para a N3XPRIME. O visual seguira a identidade da marca (fundo escuro, gradientes teal/cyan, glassmorphism).

## Estrutura dos Slides (10 slides)

1. **Capa** - Logo N3XPRIME, titulo "Smart Crypto-Bots Gerando Lucros Diarios", visual impactante
2. **Quem Somos** - Descricao da empresa, o que oferecemos, produtos principais
3. **Ferramentas para o Sucesso** - Oportunidades de investimento, como funciona a plataforma, papel da empresa
4. **Nossos Robos** - Tabela com os 6 robos ativos (S-BOT, CP-Bot, CC-Bot, PT-Bot, BW-Bot, CM-Bot) com rentabilidade min/max
5. **Bot vs. Trader** - Comparativo entre trading manual e bots automatizados (processamento, velocidade, 24/7, emocoes)
6. **Por que Escolher a N3XPRIME** - Inovacao, transparencia, seguranca, flexibilidade, tabela comparativa
7. **Linha do Tempo** - Evolucao e roadmap da empresa
8. **3 Passos para Comecar** - Cadastro, deposito, ativacao do bot
9. **Depositos e Saques** - Rapido, seguro, simples, comparativo de velocidade
10. **CTA Final** - Chamada para acao, contato, link para registro

## Detalhes Tecnicos

### Novos Arquivos

**`src/pages/Presentation.tsx`**
- Componente principal com navegacao entre slides
- Estado para slide atual, navegacao por setas do teclado, clique, e swipe mobile
- Barra de progresso e indicadores de slide
- Botao de tela cheia (Fullscreen API)
- Escala responsiva: slide base 1920x1080, escalonado via `transform: scale()`

**`src/components/presentation/SlideLayout.tsx`**
- Wrapper de cada slide com fundo, header (logo + numero da pagina) e footer (contato)

**`src/components/presentation/slides/CoverSlide.tsx`**
- Slide 1: Capa com logo, titulo principal, estatisticas

**`src/components/presentation/slides/AboutSlide.tsx`**
- Slide 2: Quem somos, o que oferecemos, localizacao, produtos

**`src/components/presentation/slides/OpportunitiesSlide.tsx`**
- Slide 3: Ferramentas, papel da empresa, programa de parceria, suporte

**`src/components/presentation/slides/RobotsSlide.tsx`**
- Slide 4: Tabela com dados reais dos robos do banco de dados

**`src/components/presentation/slides/BotVsTraderSlide.tsx`**
- Slide 5: Comparativo visual bot vs trader

**`src/components/presentation/slides/WhyChooseSlide.tsx`**
- Slide 6: Vantagens e tabela comparativa

**`src/components/presentation/slides/TimelineSlide.tsx`**
- Slide 7: Evolucao da empresa

**`src/components/presentation/slides/StepsSlide.tsx`**
- Slide 8: 3 passos simples

**`src/components/presentation/slides/DepositsSlide.tsx`**
- Slide 9: Depositos e saques

**`src/components/presentation/slides/CTASlide.tsx`**
- Slide 10: Chamada final

### Alteracao em arquivo existente

**`src/App.tsx`**
- Adicionar rota publica `/presentation` apontando para o componente `Presentation`

### Navegacao

- Setas esquerda/direita do teclado
- Botoes de navegacao na tela (prev/next)
- Indicadores clicaveis na parte inferior
- Barra de progresso no topo
- Botao de fullscreen
- Suporte a swipe em mobile (touch events)

### Dados dos Robos (Slide 4)

Dados buscados do banco via Supabase no carregamento:

| Robo | Rentabilidade Min | Rentabilidade Max | Investimento Min | Lock |
|------|------------------|------------------|-----------------|------|
| S-BOT (Starter Bot) | 0.30%/dia | 3.35%/dia | $10 | 30 dias |
| CP-Bot (Crypto Pulse) | 0.30%/dia | 3.45%/dia | $100 | 45 dias |
| CC-Bot (Coin Craft) | 0.55%/dia | 3.55%/dia | $1,000 | 60 dias |
| PT-Bot (Pro Trade) | 0.75%/dia | 3.50%/dia | $2,500 | 60 dias |
| BW-Bot (Bit Wise) | 1.05%/dia | 3.95%/dia | $15,000 | 60 dias |
| CM-Bot (Crypto Master) | 1.15%/dia | 4.15%/dia | $25,000 | 50 dias |

### Estilo Visual

- Fundo escuro (#0a0f14) com gradientes teal/cyan
- Cards com glassmorphism (#111820, bordas #1e2a3a)
- Tipografia grande e bold para titulos
- Icones Lucide para ilustrar conceitos
- Animacoes de entrada (fade-in) ao trocar slides
- Header com logo N3XPRIME + numero do slide
- Footer com informacoes de contato


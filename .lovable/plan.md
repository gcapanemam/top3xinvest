
# Plano: Aplicar Animacoes de Hover nos Cards de Acoes Rapidas e Graficos

## Visao Geral

Aplicar as mesmas animacoes de hover com scale (1.02) e bordas coloridas nos cards de graficos e acoes rapidas para manter consistencia visual em todo o dashboard.

## Cards a Atualizar

### 1. Cards de Graficos
- Card do Area Chart (Fluxo Financeiro Anual)
- Card do Pie Chart (Investimentos por Robo)

### 2. Cards de Acoes Rapidas e Cotacoes
- Card container de Acoes Rapidas
- Card container de Cotacoes
- Botoes de acao individuais (Depositar, Ver Robos, etc.)

### 3. Card de Investimentos Ativos
- Card container principal
- Cards individuais de cada investimento

---

## Secao Tecnica

### Arquivo a Modificar

| Arquivo | Acao |
|---------|------|
| src/pages/Dashboard.tsx | Adicionar classes de hover em todos os cards |

### 1. Card do Area Chart (linha 304)

```tsx
// De:
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 lg:col-span-2 animate-fade-in-up">

// Para:
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 lg:col-span-2 transition-all hover:border-teal-500/50 hover:scale-[1.01] animate-fade-in-up">
```

### 2. Card do Pie Chart (linha 392)

```tsx
// De:
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>

// Para:
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-purple-500/50 hover:scale-[1.02] animate-fade-in-up" style={{ animationDelay: '150ms' }}>
```

### 3. Card de Acoes Rapidas (linha 461)

```tsx
// De:
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">

// Para:
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-teal-500/50 hover:scale-[1.02]">
```

### 4. Botoes de Acao Rapida (linhas 465-492)

Adicionar `hover:scale-105` nos botoes internos:

```tsx
// Botao Depositar (ja tem hover shadow)
className="... transition-all hover:shadow-lg hover:shadow-teal-500/25 hover:scale-105"

// Botoes Ver Robos, Meus Investimentos, Sacar
className="... transition-all hover:bg-[#1e2a3a] hover:text-white hover:scale-105"
```

### 5. Card de Cotacoes (linha 497)

```tsx
// De:
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">

// Para:
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-cyan-500/50 hover:scale-[1.02]">
```

### 6. Cards de Crypto individuais (linha 508)

```tsx
// De:
className="... transition-all duration-200 hover:border-teal-500/30 hover:bg-[#0a0f14]/50"

// Para:
className="... transition-all duration-200 hover:border-teal-500/30 hover:bg-[#0a0f14]/50 hover:scale-[1.02]"
```

### 7. Card de Investimentos Ativos (linha 542)

```tsx
// De:
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">

// Para:
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-green-500/50 hover:scale-[1.01]">
```

### 8. Cards de investimento individuais (linha 559)

```tsx
// De:
className="... transition-all duration-200 hover:border-teal-500/30"

// Para:
className="... transition-all duration-200 hover:border-teal-500/30 hover:scale-[1.02]"
```

### Resumo das Alteracoes

| Elemento | Scale | Border Color |
|----------|-------|--------------|
| Card Area Chart | 1.01 (menor por ser grande) | teal-500/50 |
| Card Pie Chart | 1.02 | purple-500/50 |
| Card Acoes Rapidas | 1.02 | teal-500/50 |
| Botoes de Acao | 1.05 (mais destaque) | - |
| Card Cotacoes | 1.02 | cyan-500/50 |
| Cards Crypto | 1.02 | - (ja tem) |
| Card Investimentos Ativos | 1.01 (menor por ser grande) | green-500/50 |
| Cards Investimento | 1.02 | - (ja tem) |

### Notas de Design

- **Cards grandes (graficos, investimentos)**: scale-[1.01] para evitar sobreposicao
- **Cards medios**: scale-[1.02] padrao
- **Botoes pequenos**: scale-105 para feedback mais visivel
- **Cores de borda**: seguem o esquema de cores ja estabelecido no projeto

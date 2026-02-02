

# Plano: Melhorar Responsividade de Todas as Paginas

## Visao Geral

Aplicar melhorias de responsividade em todas as paginas do projeto para garantir uma experiencia otima em dispositivos moveis, tablets e desktops. Foram identificados problemas em multiplas paginas onde textos, grids e espacamentos nao se adaptam corretamente em telas menores.

## Problemas Identificados

### 1. Robots.tsx (Pagina Atual)
- Titulo sem responsividade (`text-2xl` fixo)
- Grid de cards com gap fixo (`gap-6`)
- Cards sem ajustes de padding para mobile
- Dialog de investimento sem responsividade

### 2. Investments.tsx
- Titulo sem responsividade
- Grid de resumo sem breakpoint para mobile (`md:grid-cols-3` direto)
- Lista de investimentos com grid interno fixo (`grid-cols-2 gap-4 md:grid-cols-4`)

### 3. Deposits.tsx e Withdrawals.tsx
- Titulo e botao na mesma linha podem quebrar em mobile
- Botoes de acao grandes demais em mobile

### 4. MLMNetwork.tsx
- Padding fixo (`p-6`) na pagina
- Card de link de indicacao com layout horizontal fixo
- Valores de texto grandes (`text-3xl`) sem responsividade

### 5. Notifications.tsx
- Titulo e botao na mesma linha podem quebrar em mobile

---

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|-----------|
| src/pages/Robots.tsx | Titulo, grid, cards, dialog responsivos |
| src/pages/Investments.tsx | Titulo, summary cards, lista responsiva |
| src/pages/Deposits.tsx | Header, lista responsiva |
| src/pages/Withdrawals.tsx | Header, lista responsiva |
| src/pages/MLMNetwork.tsx | Padding, cards, textos responsivos |
| src/pages/Notifications.tsx | Header responsivo |

---

### 1. Robots.tsx - Melhorias de Responsividade

**Titulo (linha 225):**
```tsx
<h1 className="text-xl md:text-2xl font-bold text-white">Robôs de Investimento</h1>
```

**Grid de cards (linha 242):**
```tsx
<div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

**Cards internos - padding responsivo (linha 251):**
```tsx
<div className="p-4 md:p-6">
```

**Info grid dentro dos cards (linha 281):**
```tsx
<div className="grid grid-cols-2 gap-2 md:gap-3">
```

**Dialog content (linha 322):**
```tsx
<DialogContent className="bg-[#111820] border-[#1e2a3a] max-w-[95vw] md:max-w-md mx-auto">
```

**Dialog grid interno (linha 335):**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
```

---

### 2. Investments.tsx - Melhorias de Responsividade

**Titulo (linha 106):**
```tsx
<h1 className="text-xl md:text-2xl font-bold text-white">Meus Investimentos</h1>
```

**Summary Cards (linha 113):**
```tsx
<div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
```

**Valores nos cards (linhas 116, 121, 128):**
```tsx
<div className="text-xl md:text-2xl font-bold text-white">
```

**Grid de detalhes de investimento (linha 169):**
```tsx
<div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
```

---

### 3. Deposits.tsx - Melhorias de Responsividade

**Header container (linha 167):**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
```

**Titulo (linha 169):**
```tsx
<h1 className="text-xl md:text-2xl font-bold text-white">Depósitos</h1>
```

**Botao de novo deposito (linha 175):**
```tsx
<button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium text-sm md:text-base transition-all hover:shadow-lg hover:shadow-teal-500/25 w-full sm:w-auto">
```

**Item da lista (linha 264):**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#1e2a3a] p-4 hover:border-teal-500/30 transition-all">
```

---

### 4. Withdrawals.tsx - Melhorias de Responsividade

**Header container (linha 203):**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
```

**Titulo (linha 205):**
```tsx
<h1 className="text-xl md:text-2xl font-bold text-white">Saques</h1>
```

**Subtitulo com saldo (linha 206-208):**
```tsx
<p className="text-sm md:text-base text-gray-400">
  Saldo disponível: <span className="text-teal-400 font-semibold">{formatCurrency(profile?.balance || 0)}</span>
</p>
```

**Botao de solicitar saque (linha 213):**
```tsx
<button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium text-sm md:text-base transition-all hover:shadow-lg hover:shadow-teal-500/25 w-full sm:w-auto disabled:opacity-50">
```

**Item da lista (linha 301):**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#1e2a3a] p-4 hover:border-teal-500/30 transition-all">
```

---

### 5. MLMNetwork.tsx - Melhorias de Responsividade

**Padding da pagina (linha 267):**
```tsx
<div className="min-h-screen bg-[#0a0f14] p-4 md:p-6">
```

**Header (linha 269):**
```tsx
<div className="mb-6 md:mb-8">
```

**Titulo (linha 274):**
```tsx
<h1 className="text-xl md:text-2xl font-bold text-white">Minha Rede</h1>
```

**Card de link - layout (linha 284):**
```tsx
<div className="flex flex-col gap-4">
```

**Container do link e botoes (linha 296):**
```tsx
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
```

**Link display (linha 298):**
```tsx
<div className="flex-1 px-3 py-2 rounded-lg bg-[#0a0f14] border border-[#1e2a3a] text-gray-400 text-xs md:text-sm truncate">
```

**Stats Cards (linha 327):**
```tsx
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
```

**Valores dos stats (linhas 333, 349, 365, 381):**
```tsx
<p className="text-2xl md:text-3xl font-bold text-white mt-1">
```

**Network Tree grid (linha 393):**
```tsx
<div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
```

---

### 6. Notifications.tsx - Melhorias de Responsividade

**Header container (linha 91):**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
```

**Titulo (linha 93):**
```tsx
<h1 className="text-xl md:text-2xl font-bold text-white">Notificações</h1>
```

**Botao marcar como lida (linha 103):**
```tsx
<button onClick={markAllAsRead} className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl border border-[#1e2a3a] text-gray-300 font-medium text-sm transition-all hover:bg-[#1e2a3a] hover:text-white w-full sm:w-auto">
```

---

### Resumo das Classes Responsivas

| Elemento | Mobile | Tablet/Desktop |
|----------|--------|----------------|
| Titulos | text-xl | md:text-2xl |
| Valores grandes | text-2xl | md:text-3xl |
| Gaps | gap-3/gap-4 | md:gap-4/md:gap-6 |
| Padding | p-4 | md:p-6 |
| Grids | grid-cols-1/grid-cols-2 | md:grid-cols-2/lg:grid-cols-3/lg:grid-cols-4 |
| Headers | flex-col | sm:flex-row |
| Botoes | w-full | sm:w-auto |

### Comportamento Esperado

```text
MOBILE (< 640px):
+------------------------+
| [≡] Pagina      [🔔👤]|
+------------------------+
| Titulo da Pagina       |
| Subtitulo              |
| [Botao Full Width]     |
+------------------------+
| [Card 1]               |
| [Card 2]               |
+------------------------+

TABLET (640px - 1024px):
+------------------------+
| Titulo      [Botao]    |
+------------------------+
| [Card 1] [Card 2]      |
| [Card 3] [Card 4]      |
+------------------------+

DESKTOP (>= 1024px):
+---------+----------------------------+
| SIDEBAR | Titulo          [Botao]    |
|         +----------------------------+
|         | [Card 1][Card 2][Card 3]   |
+---------+----------------------------+
```

### Padrao de Dialogs/Modals

Para garantir que os dialogs funcionem bem em mobile:

```tsx
<DialogContent className="max-w-[95vw] md:max-w-md mx-auto">
```

Isso garante que o dialog:
- Ocupe 95% da largura em mobile
- Tenha largura maxima de 28rem (md:max-w-md) em telas maiores
- Fique centralizado


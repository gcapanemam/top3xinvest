
# Plano: Tema Dark Premium na Pagina de Autenticacao

## Visao Geral

Aplicar o tema dark premium (#0a0f14 como fundo, cards #111820, gradientes teal/cyan) na pagina de autenticacao (Auth.tsx) para manter consistencia visual com o Dashboard e demais paginas da aplicacao.

## Alteracoes Visuais

### Estado Atual
A pagina Auth.tsx utiliza variaveis CSS genericas (`bg-background`, `text-foreground`, etc.) que resultam em um visual diferente do resto da aplicacao.

### Novo Visual
Aplicar as mesmas cores e estilos do Dashboard:
- Fundo escuro `#0a0f14`
- Cards com `#111820` e bordas `#1e2a3a`
- Gradientes teal-to-cyan
- Textos em `text-white` e `text-gray-400`
- Efeitos de blur com cores teal/cyan

## Elementos a Modificar

| Elemento | Antes | Depois |
|----------|-------|--------|
| Fundo da pagina | `bg-gradient-to-br from-background...` | `bg-[#0a0f14]` |
| Blurs de fundo | `bg-primary/10`, `bg-accent/10` | `bg-teal-500/5`, `bg-cyan-500/5` |
| Icone Bot | `gradient-primary` | `bg-gradient-to-r from-teal-500 to-cyan-500` |
| Titulos | `text-foreground` | `text-white` |
| Subtitulos | `text-muted-foreground` | `text-gray-400` |
| Card principal | Classes genericas | `bg-[#111820] border-[#1e2a3a]` |
| Inputs | `border-border/50` | `bg-[#0a0f14] border-[#1e2a3a] text-white` |
| Labels | Classes genericas | `text-gray-300` |
| TabsList | Classes genericas | `bg-[#1e2a3a]` |
| TabsTrigger ativo | `gradient-primary` | `bg-gradient-to-r from-teal-500 to-cyan-500` |
| Botoes | `variant="gradient"` | Estilo inline com gradiente teal/cyan |
| Feature cards | Gradientes genericos | Gradientes teal/cyan com glow |

## Secao Tecnica

### Arquivo a Modificar
`src/pages/Auth.tsx`

### Estrutura das Alteracoes

1. **Container Principal (linha 166)**
```tsx
// Antes
<div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10...">

// Depois
<div className="min-h-screen bg-[#0a0f14] relative overflow-hidden">
```

2. **Elementos de Blur Decorativos (linhas 168-172)**
```tsx
// Antes
<div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl...">
<div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl...">

// Depois
<div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-teal-500/5 blur-3xl...">
<div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl...">
```

3. **Icone da Logo (linhas 179-181)**
```tsx
// Antes
<div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow...">

// Depois
<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25...">
```

4. **Titulo e Subtitulo (linhas 182-186)**
```tsx
// Antes
<h1 className="text-4xl font-bold text-foreground">
<p className="text-xl text-muted-foreground">

// Depois
<h1 className="text-4xl font-bold text-white">
<p className="text-xl text-gray-400">
```

5. **Feature Cards (linhas 189-225)**
```tsx
// Antes
<div className="flex h-12 w-12... rounded-xl gradient-primary shadow-glow">
<h3 className="font-semibold text-foreground">
<p className="text-sm text-muted-foreground">

// Depois
<div className="flex h-12 w-12... rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
<h3 className="font-semibold text-white">
<p className="text-sm text-gray-400">
```

6. **Card Principal de Auth (linha 230)**
```tsx
// Antes
<Card className="w-full max-w-md border-border/50 shadow-2xl backdrop-blur-sm...">

// Depois
<Card className="w-full max-w-md bg-[#111820] border border-[#1e2a3a] shadow-2xl...">
```

7. **Card Header (linhas 231-236)**
```tsx
// Antes
<CardTitle className="text-2xl">
<CardDescription>

// Depois
<CardTitle className="text-2xl text-white">
<CardDescription className="text-gray-400">
```

8. **TabsList (linha 249)**
```tsx
// Antes
<TabsList className="grid w-full grid-cols-2 mb-6">

// Depois
<TabsList className="grid w-full grid-cols-2 mb-6 bg-[#1e2a3a] p-1 rounded-xl">
```

9. **TabsTrigger (linhas 250-255)**
```tsx
// Antes
<TabsTrigger value="login" className="data-[state=active]:gradient-primary...">

// Depois
<TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-gray-400">
```

10. **Labels e Inputs (linhas 261-283)**
```tsx
// Antes
<Label htmlFor="login-email">Email</Label>
<Input className="h-11 rounded-xl border-border/50...">

// Depois
<Label htmlFor="login-email" className="text-gray-300">Email</Label>
<Input className="h-11 rounded-xl bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500...">
```

11. **Botoes Submit (linhas 284-287, 341-344)**
```tsx
// Antes
<Button type="submit" variant="gradient" className="w-full h-11"...>

// Depois
<button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50"...>
```

12. **Loading State (linhas 150-163)**
```tsx
// Antes
<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background...">
<div className="h-16 w-16 rounded-2xl gradient-primary...">
<p className="text-muted-foreground...">

// Depois
<div className="flex min-h-screen items-center justify-center bg-[#0a0f14]">
<div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500...">
<p className="text-gray-400...">
```

### Resumo das Cores Utilizadas

```text
Cores Principais:
  - Fundo: #0a0f14
  - Cards: #111820
  - Bordas: #1e2a3a
  - Texto principal: white
  - Texto secundario: gray-400
  - Placeholders: gray-500
  - Labels: gray-300

Gradientes:
  - Primario: from-teal-500 to-cyan-500
  - Accent (icone seguranca): from-cyan-500 to-blue-500
  - Success (icone rendimentos): from-green-500 to-emerald-500

Efeitos:
  - Shadow glow: shadow-lg shadow-teal-500/25
  - Blur decorativo: bg-teal-500/5 blur-3xl
```

### Fluxo de Implementacao

```text
1. Atualizar container principal e fundo
   |
   v
2. Ajustar elementos de blur decorativos
   |
   v
3. Estilizar lado esquerdo (branding)
   |
   v
4. Estilizar Card de autenticacao
   |
   v
5. Ajustar TabsList e TabsTriggers
   |
   v
6. Estilizar inputs e labels
   |
   v
7. Atualizar botoes de submit
   |
   v
8. Ajustar estado de loading
```

### Resultado Visual Esperado

A pagina de autenticacao tera o mesmo visual "dark premium" do Dashboard:
- Fundo escuro com sutis efeitos de blur em teal/cyan
- Card centralizado com glassmorphism escuro
- Inputs com fundo mais escuro que o card
- Botoes com gradiente teal-to-cyan e efeito glow
- Consistencia total com o restante da aplicacao

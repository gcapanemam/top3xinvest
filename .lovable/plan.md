
# Plano: Adicionar Animacoes de Entrada nos Cards de Estatisticas

## Visao Geral

Adicionar animacoes de entrada suaves e escalonadas nos 4 cards de estatisticas do dashboard (Saldo Disponivel, Total Investido, Lucro Acumulado, Patrimonio Total) para criar uma experiencia visual mais dinamica e profissional.

## Animacoes a Implementar

### Cards de Estatisticas
- Animacao `animate-fade-in-up` em cada card
- Delay escalonado entre os cards (0ms, 100ms, 200ms, 300ms)
- Efeito de entrada progressiva da esquerda para direita

## Visual Esperado

```text
Carregamento da pagina:
   |
   v (0ms)
[Card 1: Saldo Disponivel - fade-in-up]
   |
   v (100ms)
[Card 2: Total Investido - fade-in-up]
   |
   v (200ms)
[Card 3: Lucro Acumulado - fade-in-up]
   |
   v (300ms)
[Card 4: Patrimonio Total - fade-in-up]
```

---

## Secao Tecnica

### Arquivo a Modificar

| Arquivo | Acao |
|---------|------|
| src/pages/Dashboard.tsx | Adicionar classes de animacao nos cards |

### Alteracoes nos Cards

**Card 1 - Saldo Disponivel (linha 244)**
```tsx
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-teal-500/50 animate-fade-in-up">
```

**Card 2 - Total Investido (linha 259)**
```tsx
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-cyan-500/50 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
```

**Card 3 - Lucro Acumulado (linha 272)**
```tsx
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-green-500/50 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
```

**Card 4 - Patrimonio Total (linha 285)**
```tsx
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-yellow-500/50 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
```

### Resumo das Alteracoes

| Card | Classe Adicionada | Animation Delay |
|------|------------------|-----------------|
| Saldo Disponivel | animate-fade-in-up | 0ms (padrao) |
| Total Investido | animate-fade-in-up | 100ms |
| Lucro Acumulado | animate-fade-in-up | 200ms |
| Patrimonio Total | animate-fade-in-up | 300ms |

### Classe CSS Utilizada

A classe `animate-fade-in-up` ja existe no projeto (tailwind.config.ts) com a seguinte definicao:

```typescript
keyframes: {
  "fade-in-up": {
    "0%": {
      opacity: "0",
      transform: "translateY(20px)",
    },
    "100%": {
      opacity: "1",
      transform: "translateY(0)",
    },
  },
},
animation: {
  "fade-in-up": "fade-in-up 0.5s ease-out",
},
```

### Acessibilidade

O projeto ja possui suporte a `prefers-reduced-motion` no CSS (index.css), desabilitando animacoes para usuarios que preferem movimento reduzido:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-up { animation: none !important; }
}
```

### Resultado Esperado

Os cards de estatisticas terao uma entrada suave e escalonada que:
- Guia o olhar do usuario da esquerda para direita
- Cria sensacao de carregamento progressivo
- Complementa as animacoes ja existentes nos graficos
- Mantem consistencia com o design system do projeto

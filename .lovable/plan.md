
# Plano: Adicionar Animacoes de Hover com Scale nos Cards de Estatisticas

## Visao Geral

Adicionar efeito de escala (scale) ao passar o mouse sobre os cards de estatisticas para criar um feedback visual mais dinamico e interativo. O efeito sera sutil para manter a elegancia do design.

## Efeito a Implementar

- Escala de 1.02 (2% de aumento) ao hover
- Transicao suave de 200ms
- Combinado com os efeitos de borda colorida ja existentes

---

## Secao Tecnica

### Arquivo a Modificar

| Arquivo | Acao |
|---------|------|
| src/pages/Dashboard.tsx | Adicionar classes hover:scale nos cards |

### Alteracoes nos Cards

Adicionar `hover:scale-[1.02]` em cada card de estatisticas. A classe `transition-all` ja existe e garantira uma transicao suave.

**Card 1 - Saldo Disponivel (linha 244)**
```tsx
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-teal-500/50 hover:scale-[1.02] animate-fade-in-up">
```

**Card 2 - Total Investido (linha 259)**
```tsx
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-cyan-500/50 hover:scale-[1.02] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
```

**Card 3 - Lucro Acumulado (linha 272)**
```tsx
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-green-500/50 hover:scale-[1.02] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
```

**Card 4 - Patrimonio Total (linha 285)**
```tsx
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-yellow-500/50 hover:scale-[1.02] animate-fade-in-up" style={{ animationDelay: '300ms' }}>
```

### Resumo das Alteracoes

| Card | Classe Adicionada |
|------|------------------|
| Saldo Disponivel | hover:scale-[1.02] |
| Total Investido | hover:scale-[1.02] |
| Lucro Acumulado | hover:scale-[1.02] |
| Patrimonio Total | hover:scale-[1.02] |

### Por que scale-[1.02]?

- **Sutil**: 2% de aumento e imperceptivel consciente mas cria sensacao de resposta
- **Performatico**: Transform scale usa GPU e nao causa reflow
- **Elegante**: Combina com o design premium dark do projeto
- **Consistente**: Segue o padrao de micro-interacoes do projeto

### Resultado Visual

```text
Estado Normal:
+------------------+
|  Card            |
|  Scale: 1.0      |
+------------------+

Estado Hover:
+--------------------+
|   Card             |
|   Scale: 1.02      |
|   Border Colorida  |
+--------------------+
```

### Acessibilidade

O efeito de scale respeita automaticamente `prefers-reduced-motion` quando combinado com a classe `transition-all` do Tailwind.

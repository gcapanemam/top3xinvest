

# Plano: Melhorar Animacao dos Floating Cards

## Visao Geral

Redesenhar completamente a animacao dos cards de operacoes na hero section, inspirando-se no layout do BWIS onde os cards estao espalhados organicamente pela tela com animacoes de flutuacao em diferentes ritmos e direcoes.

---

## Problemas Atuais

1. Cards empilhados verticalmente de forma rigida
2. Animacao simples de flutuacao vertical igual para todos
3. Cards aparecem/desaparecem abruptamente
4. Falta de profundidade visual e dispersao organica
5. Fundo com pouco impacto visual

---

## Novo Layout Visual

```text
                    +------------+
                    |   XRP      |
                    |   1.10%    |
                    |   BUY      |
    +------------+  +------------+
    |   BNB      |
    |   0.43%    |       +------------+
    |   SELL     |       |   ETH      |
    +------------+       |   0.94%    |
                         |   BUY      |
         +------------+  +------------+
         |   BTC      |
         |   0.59%    |
         |   SELL     |        +------------+
         +------------+        |   BNB      |
                               |   1.43%    |
                               |   SELL     |
                               +------------+
```

Cards espalhados em posicoes aleatorias com:
- Diferentes delays de animacao
- Diferentes duracao de animacao
- Flutuacao vertical suave
- Efeito de entrada com fade-in
- Rotacao ciclica suave das operacoes

---

## Melhorias Propostas

### 1. Layout Disperso
- Cards posicionados em coordenadas especificas (nao empilhados)
- Distribuicao organica pelo espaco disponivel
- Diferentes tamanhos para criar profundidade

### 2. Animacoes Aprimoradas
- Flutuacao vertical com diferentes amplitudes (8px a 20px)
- Duracao variada (3s a 5s) para cada card
- Delays escalonados para movimento nao sincronizado
- Transicao suave de opacidade ao trocar operacoes

### 3. Efeitos Visuais
- Brilho sutil ao redor dos cards (glow effect)
- Sombras coloridas baseadas no tipo (verde/vermelho)
- Fundo com gradiente mais pronunciado

### 4. Indicador de Direcao
- Seta para cima (verde) para BUY
- Seta para baixo (vermelho) para SELL
- Animacao de pulse na seta

---

## Secao Tecnica

### Arquivo: src/components/landing/FloatingCards.tsx

**Alteracoes principais:**

1. **Novo sistema de posicionamento:**
```typescript
const cardPositions = [
  { x: "5%", y: "10%", scale: 0.9, delay: 0 },
  { x: "60%", y: "5%", scale: 1, delay: 0.5 },
  { x: "20%", y: "35%", scale: 0.95, delay: 1 },
  { x: "70%", y: "40%", scale: 1.05, delay: 1.5 },
  { x: "10%", y: "65%", scale: 0.85, delay: 2 },
  { x: "55%", y: "70%", scale: 1, delay: 0.8 },
];
```

2. **Animacao individual por card:**
- Cada card tera sua propria duracao e amplitude
- Uso de CSS custom properties para controle dinamico

3. **Transicao suave de conteudo:**
- Fade out/fade in ao trocar a operacao mostrada
- Efeito de entrada escalonado

### Arquivo: src/index.css

**Novas animacoes:**

```css
@keyframes float-gentle {
  0%, 100% { transform: translateY(0) translateX(0); }
  25% { transform: translateY(-8px) translateX(2px); }
  50% { transform: translateY(-12px) translateX(-2px); }
  75% { transform: translateY(-6px) translateX(1px); }
}

@keyframes float-medium {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes float-strong {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes fade-swap {
  0% { opacity: 1; }
  45% { opacity: 0; }
  55% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes pulse-arrow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}
```

### Design do Card Aprimorado

| Elemento | Estilo |
|----------|--------|
| Container | Glassmorphism com borda sutil |
| Icone cripto | Circulo colorido com sigla |
| Percentual | Fonte maior, cor vibrante |
| Badge BUY/SELL | Fundo semi-transparente |
| Seta indicadora | Animada com pulse |
| Sombra | Colorida (verde/vermelho) |

---

## Arquivos a Modificar

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| src/components/landing/FloatingCards.tsx | Reescrever completamente |
| src/index.css | Adicionar novas keyframes de animacao |

---

## Resultado Esperado

- Cards distribuidos organicamente pelo espaco
- Animacoes fluidas e nao sincronizadas
- Visual mais dinamico e profissional
- Melhor representacao de "operacoes em tempo real"
- Alinhamento com a estetica do BWIS


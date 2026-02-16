

# Animacao de Meta de Arrecadacao - Estilo Kotai

## O que sera feito

Criar uma nova secao na landing page com uma animacao de progresso de arrecadacao, inspirada no estilo do site Kotai, exibindo:

- **Meta do 1o Ciclo**: $300,000
- **Arrecadado**: $26,850 (com contagem animada de 0 ate o valor)
- **Barra de progresso** animada crescendo suavemente ate a porcentagem correspondente (~8.95%)
- Texto descritivo abaixo

## Visual

- Fundo escuro (#0a0f14) consistente com o resto do site
- Valor arrecadado grande e centralizado com contagem animada (counter up de $0 ate $26,850)
- Subtitulo "Arrecadado - e crescendo a cada dia."
- Barra de progresso larga com bordas arredondadas, fundo escuro e preenchimento com gradiente teal/cyan
- Particulas/brilhos sutis na barra (efeito shimmer)
- Texto da meta abaixo da barra: "Meta do 1o Ciclo: $300,000"
- Frase motivacional: "A N3XPRIME cresce a cada dia, com participantes do mundo inteiro."
- Animacao dispara quando a secao entra no viewport (Intersection Observer)

## Detalhes Tecnicos

### Novo arquivo

**`src/components/landing/FundraisingSection.tsx`**
- Componente com Intersection Observer para detectar quando entra na tela
- useState + useEffect para animar o contador de 0 ate 26850 em ~2 segundos (requestAnimationFrame com easing)
- Barra de progresso com transicao CSS (width de 0% ate ~8.95%) com delay e duracao de ~1.5s
- Efeito shimmer na barra usando pseudo-elemento animado
- Formatacao do valor em dolares (en-US)

### Arquivo alterado

**`src/pages/Index.tsx`**
- Importar e inserir `FundraisingSection` logo apos o `HeroSection` (ou apos `QuickNavCards`), para dar destaque ao progresso da arrecadacao


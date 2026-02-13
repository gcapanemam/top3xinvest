

# Melhorar Layout dos Cards de Robos

## Melhorias visuais propostas no arquivo `src/pages/Robots.tsx`

### 1. Bloco de Rentabilidade (verde)
- Aumentar o padding e espaçamento interno para respirar mais
- Usar tipografia maior e mais destacada para os valores principais
- Separador visual mais elegante entre rentabilidade diaria e do periodo
- Icone do Sparkles com animacao mais suave

### 2. Cards de Periodo Lock e Min. Investimento
- Adicionar fundo sutil (`bg-[#0a0f14]`) em vez de apenas borda, para criar mais contraste e profundidade
- Icones com cor teal para consistencia visual
- Valores com tamanho de fonte maior (`text-lg`)

### 3. Informacao de Maximo
- Integrar o valor maximo dentro do card de Min. Investimento como sublinha, em vez de texto solto abaixo
- Ou transformar em um terceiro card quando existir

### 4. Botoes de acao
- Adicionar efeito de hover mais pronunciado nos botoes
- Sombra no botao "Investir Agora" por padrao (nao so no hover)

### 5. Header do card
- Badge de criptomoeda com estilo mais refinado (borda sutil + icone)
- Icone do robo com leve animacao de hover (scale)

## Detalhes tecnicos
- Arquivo modificado: `src/pages/Robots.tsx` (linhas 293-390)
- Apenas alteracoes de classes CSS Tailwind e pequenos ajustes de estrutura HTML
- Nenhuma logica ou calculo sera alterado


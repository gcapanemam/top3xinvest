
# Plano: Botao "Detalhes" mais visivel + Dialog com informacoes completas

## Objetivo
Tornar o botao de detalhes mais visivel no card do robo e expandir o dialog de detalhes para mostrar todas as informacoes do robo em formato de tabela, similar a imagem de referencia.

## Alteracoes em src/pages/Robots.tsx

### 1. Botao "Detalhes" mais visivel
Substituir o pequeno icone ao lado do nome (linha 315-326) por um botao completo com texto "Detalhes" posicionado ao lado do botao "Investir Agora", na area inferior do card (linha 370-385). O botao sempre aparece (nao depende de ter descricao).

Layout dos botoes:
- Dois botoes lado a lado: "Detalhes" (outline) + "Investir Agora" (gradient)
- Para robos encerrados: "Detalhes" (outline) + badge "Encerrado" 

### 2. Dialog de detalhes expandido
Reformular o dialog (linha 474-515) para exibir informacoes completas em formato de tabela/lista, inspirado na imagem de referencia:

| Campo | Valor |
|-------|-------|
| Preco do Bot | Min - Max investimento |
| Periodo de Funcionamento | lock_period_days dias |
| Lucro | profit_percentage_min - profit_percentage_max% |
| Periodo de Lucro | profit_period_days dias |
| Pares de Negociacao | Badges com cada criptomoeda/USDT |
| Estrategia | Descricao do robo |

Cada linha tera label em cinza a esquerda e valor em branco/bold a direita, com separadores entre linhas.

### 3. Remover icone Info do titulo
Remover o pequeno botao de info ao lado do nome do robo no card, ja que agora tera um botao dedicado.

## Resumo
- **1 arquivo** modificado: `src/pages/Robots.tsx`
- Botao "Detalhes" visivel e claro no card
- Dialog completo com todas as specs do robo em formato tabular

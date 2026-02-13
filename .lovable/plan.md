
# Adicionar Rentabilidade do Periodo no Card do Robo

## Objetivo
A rentabilidade exibida no card (ex: 3 - 4.15%) e diaria. Adicionar tambem a rentabilidade estimada do periodo completo, calculada como: `lock_period_days x media da rentabilidade diaria`.

## Calculo
- Media diaria = (profit_percentage_min + profit_percentage_max) / 2
- Rentabilidade min do periodo = profit_percentage_min x lock_period_days
- Rentabilidade max do periodo = profit_percentage_max x lock_period_days

Sera exibido como faixa (min - max) do periodo total.

## Alteracoes em src/pages/Robots.tsx

### 1. Card - Bloco de Rentabilidade (linhas 319-331)
Adicionar uma segunda linha abaixo da rentabilidade diaria mostrando a rentabilidade do periodo:

```
Rentabilidade Diaria
3 - 4.15% / dia

Rentabilidade do Periodo
300 - 415% / 100 dias
```

O layout mantera o mesmo estilo visual (fundo verde gradient), adicionando a informacao do periodo logo abaixo com fonte um pouco menor.

### 2. Dialog de Detalhes
Adicionar uma linha extra na tabela do dialog de detalhes com "Rentabilidade do Periodo" mostrando o calculo completo.

## Resumo
- **1 arquivo** modificado: `src/pages/Robots.tsx`
- Calculo simples: min% x dias e max% x dias para exibir a faixa do periodo
- Informacao adicionada tanto no card quanto no dialog de detalhes

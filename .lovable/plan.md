
# Plano: Lucro Acumulado deve refletir todos os investimentos

## Problema

No Dashboard, a query de investimentos filtra apenas `status = 'active'` (linha 155). Quando um investimento e finalizado e muda para `completed`, ele desaparece da lista e seu lucro some do card "Lucro Acumulado".

## Solucao

### 1. Alterar a query de investimentos no Dashboard (Dashboard.tsx)

**Linha 155**: Remover o filtro `.eq('status', 'active')` e buscar investimentos com status `active` OU `completed` usando `.in('status', ['active', 'completed'])`.

Isso garante que investimentos finalizados continuem contribuindo para o calculo de lucro.

### 2. Ajustar o calculo de Total Investido

O "Total Investido" deve considerar apenas investimentos ativos (em operacao), enquanto o "Lucro Acumulado" deve somar os lucros de todos os investimentos (ativos + finalizados).

- **Total Investido**: filtrar apenas `active` no calculo
- **Lucro Acumulado**: Para investimentos `completed`, usar o `profit_accumulated` salvo no banco (ja calculado pela RPC). Para investimentos `active`, continuar calculando dinamicamente a partir das `robot_operations`.
- **Contagem de robos ativos**: filtrar apenas `active` para o texto "Em X robos ativos"

### 3. Ajustar o card Patrimonio Total

O "Patrimonio Total" (Saldo + Investimentos + Lucros) tambem refletira os lucros corretos.

## Arquivos modificados

- **src/pages/Dashboard.tsx**: Ajustar query e logica de calculo de lucro

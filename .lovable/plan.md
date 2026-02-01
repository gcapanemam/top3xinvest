
# Plano: Aplicar Layout Dark Premium em Todas as Paginas

## Visao Geral

Vou transformar TODAS as paginas da plataforma para usar o tema escuro premium, seguindo o padrao visual ja implementado em AdminUsers.tsx. Isso inclui tanto as paginas de usuario quanto as paginas administrativas.

## Paginas a Serem Atualizadas

### Paginas de Usuario (6 paginas)
1. Dashboard.tsx
2. Robots.tsx  
3. Investments.tsx
4. Deposits.tsx
5. Withdrawals.tsx
6. Notifications.tsx

### Paginas de Admin (6 paginas)
1. AdminDashboard.tsx
2. AdminDeposits.tsx
3. AdminWithdrawals.tsx
4. AdminRobots.tsx
5. AdminPrices.tsx
6. AdminNotifications.tsx

### Componentes de Layout (3 arquivos)
1. DashboardLayout.tsx - Fundo principal da aplicacao
2. Sidebar.tsx - Menu lateral
3. Header.tsx - Cabecalho

## Padrao Visual a Ser Aplicado

### Cores do Tema Dark Premium
| Elemento | Cor Hex |
|----------|---------|
| Fundo principal | #0a0f14 |
| Cards/Paineis | #111820 |
| Bordas | #1e2a3a |
| Texto principal | #ffffff |
| Texto secundario | #6b7280 |
| Teal (destaque) | #14b8a6 |
| Verde (sucesso) | #22c55e |
| Vermelho (erro) | #ef4444 |
| Amarelo (alerta) | #f59e0b |
| Cyan (valores) | #06b6d4 |

### Elementos Visuais Padrao
- Cards com bg-[#111820] e border-[#1e2a3a]
- Spinner de carregamento com cor teal
- Tabelas com linhas hover em bg-[#0a0f14]/50
- Badges coloridas para status
- Icones com cores vibrantes em fundos com opacidade

---

## Secao Tecnica

### 1. DashboardLayout.tsx
Alterar o fundo base para tema escuro:
- Remover gradientes claros
- Aplicar bg-[#0a0f14] como fundo principal
- Manter decoracoes de fundo em opacidade baixa

### 2. Sidebar.tsx
- Fundo: bg-[#0a0f14] com borda border-[#1e2a3a]
- Links ativos com destaque teal
- Hover states em bg-[#111820]
- Logo e icones com cores vibrantes

### 3. Header.tsx
- Fundo: bg-[#0a0f14]/90 com backdrop-blur
- Borda inferior em border-[#1e2a3a]
- Avatar e badges com gradientes

### 4. Dashboard.tsx (Usuario)
Cards de estatisticas:
- bg-[#111820] com border-[#1e2a3a]
- Icones coloridos (teal, verde, cyan)
- Valores de destaque em cores vibrantes
- Grid de cotacoes com estilo dark

### 5. Robots.tsx (Usuario)
Cards de robos:
- bg-[#111820] com sombras sutis
- Destaque de rentabilidade em verde
- Badges de criptomoeda em cores
- Botao de investir com gradiente

### 6. Investments.tsx (Usuario)
- Cards resumo em dark
- Lista de investimentos com status coloridos
- Icones de lock/unlock
- Lucros em verde destacado

### 7. Deposits.tsx (Usuario)
- Dialogo com fundo dark
- Lista de depositos com badges de status
- Icones com cores por tipo
- Campo de busca estilizado

### 8. Withdrawals.tsx (Usuario)
- Similar a Deposits
- Destaque do saldo disponivel
- Status badges coloridas

### 9. Notifications.tsx (Usuario)
- Cards de notificacao com fundo dark
- Badges por tipo (info, alerta, promo)
- Indicador de nao lida

### 10. AdminDashboard.tsx
- 4 cards de estatisticas (igual AdminUsers)
- Cards de acoes rapidas
- Contador de robos ativos
- Links para outras paginas admin

### 11. AdminDeposits.tsx
- Header com titulo e subtitulo
- Cards de estatisticas (pendentes, aprovados, total)
- Tabela dark com badges de status
- Modal de processamento dark

### 12. AdminWithdrawals.tsx
- Similar a AdminDeposits
- Destaque da chave PIX
- Verificacao de saldo

### 13. AdminRobots.tsx
- Grid de robos em cards dark
- Modal de criacao/edicao dark
- Badges de status e crypto
- Toggle de ativo/inativo

### 14. AdminPrices.tsx
- Tabela de criptomoedas dark
- Inputs estilizados
- Previa de preco com variacao colorida
- Botao salvar destacado

### 15. AdminNotifications.tsx
- Formulario dark
- Select de usuarios estilizado
- Switch para global
- Tipos de notificacao

### Mudancas no CSS Global (index.css)
Adicionar variaveis de suporte para o tema admin:
```css
/* Admin Dark Theme Variables */
--admin-bg: #0a0f14;
--admin-card: #111820;
--admin-border: #1e2a3a;
```

### Estrutura de Implementacao

Para cada pagina:
1. Trocar wrapper para `min-h-screen bg-[#0a0f14]`
2. Converter Cards para estilo dark
3. Atualizar cores de texto
4. Aplicar badges coloridas
5. Estilizar inputs e botoes
6. Ajustar spinners de loading

### Ordem de Implementacao

1. **Layout Base** (3 arquivos)
   - DashboardLayout.tsx
   - Sidebar.tsx  
   - Header.tsx

2. **Paginas Admin** (6 arquivos)
   - AdminDashboard.tsx
   - AdminDeposits.tsx
   - AdminWithdrawals.tsx
   - AdminRobots.tsx
   - AdminPrices.tsx
   - AdminNotifications.tsx

3. **Paginas Usuario** (6 arquivos)
   - Dashboard.tsx
   - Robots.tsx
   - Investments.tsx
   - Deposits.tsx
   - Withdrawals.tsx
   - Notifications.tsx

### Total: 15 arquivos a serem modificados

Cada arquivo sera reescrito mantendo toda a logica funcional, apenas alterando a apresentacao visual para o tema dark premium.

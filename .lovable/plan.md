

# 🚀 Invest Hub - Plataforma de Investimentos com Robôs

## Visão Geral
Uma plataforma completa de investimentos onde usuários podem "investir" em robôs de trading de criptomoedas. O sistema é totalmente controlado pelo administrador, que define os robôs, rentabilidades, cotações e aprova transações.

---

## 📱 Área do Usuário

### 1. Autenticação
- Cadastro com email e senha
- Login seguro
- Recuperação de senha
- Verificação de email

### 2. Dashboard Principal
- Visão geral do saldo total
- Gráfico de evolução do patrimônio
- Resumo dos investimentos ativos
- Notificações recentes
- Cotações de criptomoedas (controladas pelo admin)

### 3. Robôs de Investimento
- Lista de robôs disponíveis com:
  - Nome e descrição
  - Rentabilidade prometida
  - Período de lock (bloqueio)
  - Valor mínimo de investimento
- Detalhe do robô com histórico de performance
- Botão para investir no robô

### 4. Meus Investimentos
- Lista de investimentos ativos
- Status: Em operação / Período de lock / Disponível para saque
- Valor investido e lucro acumulado
- Data de liberação
- Histórico de operações do robô (simuladas)

### 5. Carteira / Saldo
- Saldo disponível para investir
- Saldo em investimentos ativos
- Lucros acumulados
- Histórico de movimentações

### 6. Depósitos
- Solicitar depósito (exibe dados para transferência)
- Histórico de depósitos
- Status: Pendente / Aprovado / Recusado

### 7. Saques
- Solicitar saque do saldo disponível
- Histórico de saques
- Status: Pendente / Aprovado / Recusado / Processando

### 8. Notificações
- Alertas sobre lucros recebidos
- Status de depósitos/saques
- Mensagens do administrador
- Novos robôs disponíveis

---

## 🔐 Área do Administrador

### 1. Dashboard Admin
- Total de usuários cadastrados
- Total em depósitos pendentes
- Total em saques pendentes
- Volume total investido na plataforma
- Gráficos de crescimento

### 2. Gerenciar Robôs
- Criar novo robô:
  - Nome e descrição
  - Criptomoeda associada
  - Rentabilidade (% por período)
  - Período de lock
  - Valor mínimo/máximo
  - Status (ativo/inativo)
- Editar robôs existentes
- Ativar/desativar robôs
- Ver usuários investindo em cada robô

### 3. Gerenciar Cotações
- Definir preços das criptomoedas manualmente
- Histórico de cotações
- Variação exibida para usuários

### 4. Gerenciar Usuários
- Lista de todos usuários
- Ver perfil, saldo e investimentos de cada um
- Bloquear/desbloquear usuários
- Ajustar saldo manualmente (se necessário)
- Ver histórico de atividades

### 5. Aprovar Depósitos
- Lista de depósitos pendentes
- Aprovar ou recusar depósitos
- Adicionar comprovante/observação
- Notificar usuário automaticamente

### 6. Aprovar Saques
- Lista de saques pendentes
- Aprovar ou recusar saques
- Marcar como processado
- Notificar usuário automaticamente

### 7. Enviar Notificações
- Enviar mensagem para usuário específico
- Enviar mensagem para todos usuários
- Tipos: Alerta, Informação, Promoção

### 8. Simular Operações dos Robôs
- Gerar "operações" que aparecem para os usuários
- Definir lucros/prejuízos simulados
- Controlar quando os rendimentos são creditados

---

## 🗄️ Backend (Supabase)

### Banco de Dados
- **users/profiles**: Dados dos usuários
- **user_roles**: Controle de permissões (admin/usuário)
- **robots**: Robôs de investimento
- **investments**: Investimentos dos usuários nos robôs
- **deposits**: Solicitações de depósito
- **withdrawals**: Solicitações de saque
- **transactions**: Histórico de movimentações
- **notifications**: Notificações para usuários
- **crypto_prices**: Cotações controladas
- **robot_operations**: Operações simuladas dos robôs

### Segurança
- Autenticação segura com Supabase Auth
- Row Level Security (RLS) em todas as tabelas
- Sistema de roles para separar admin/usuário
- Validação de dados em todas as operações

### Funcionalidades Backend
- Cálculo automático de rendimentos
- Processamento de operações dos robôs
- Sistema de notificações em tempo real
- Logs de auditoria para admin

---

## 📋 Ordem de Implementação

**Fase 1 - Base**
1. Configurar Supabase e autenticação
2. Criar estrutura do banco de dados
3. Implementar sistema de roles (admin/usuário)

**Fase 2 - Funcionalidades Core**
4. CRUD de robôs (admin)
5. Sistema de depósitos
6. Sistema de investimentos
7. Sistema de saques

**Fase 3 - Gestão**
8. Painel admin completo
9. Gerenciamento de cotações
10. Sistema de notificações

**Fase 4 - Polimento**
11. Dashboard com gráficos
12. Operações simuladas dos robôs
13. Testes e ajustes finais


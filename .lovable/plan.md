

# Transformar admin@icmead.com.br em Administrador

## Situacao Atual

O usuario **admin@icmead.com.br** ja esta cadastrado no sistema:
- **ID:** `bf99886e-7d15-47d3-8b10-92527c2c58d7`
- **Nome:** Admin
- **Role atual:** `user`
- **Saldo:** R$ 0,00

## Acao Necessaria

Atualizar o registro na tabela `user_roles` para mudar o role de `user` para `admin`.

## Funcoes do Administrador

Apos a promocao, o usuario tera acesso completo ao painel administrativo com as seguintes funcionalidades:

### 1. Dashboard Admin (`/admin`)
- Visao geral da plataforma
- Total de usuarios cadastrados
- Depositos pendentes (quantidade e valor)
- Saques pendentes (quantidade e valor)
- Total investido em robos ativos
- Numero de robos ativos
- Links rapidos para aprovar depositos e saques

### 2. Gerenciar Robos (`/admin/robots`)
- Criar novos robos de investimento
- Editar robos existentes
- Definir parametros:
  - Nome e descricao
  - Criptomoeda associada
  - Rentabilidade (% por periodo)
  - Periodo de rendimento (dias)
  - Periodo de lock/bloqueio (dias)
  - Investimento minimo e maximo
  - Status ativo/inativo
- Excluir robos

### 3. Gerenciar Usuarios (`/admin/users`)
- Listar todos os usuarios
- Buscar por nome ou ID
- Ver e editar saldo manualmente
- Bloquear/desbloquear usuarios
- Ver data de cadastro

### 4. Aprovar Depositos (`/admin/deposits`)
- Ver depositos pendentes
- Aprovar depositos (credita saldo automaticamente)
- Recusar depositos
- Adicionar observacoes
- Notificacao automatica para o usuario
- Historico de depositos processados

### 5. Aprovar Saques (`/admin/withdrawals`)
- Ver saques pendentes com chave PIX
- Verificar saldo do usuario
- Aprovar saques (debita saldo automaticamente)
- Recusar saques
- Adicionar observacoes
- Notificacao automatica para o usuario
- Historico de saques processados

### 6. Gerenciar Cotacoes (`/admin/prices`)
- Editar precos das criptomoedas
- Definir variacao de 24h (positiva ou negativa)
- Salvar historico de precos
- Previa em tempo real das alteracoes

### 7. Enviar Notificacoes (`/admin/notifications`)
- Enviar notificacao para usuario especifico
- Enviar notificacao global para todos
- Tipos: Informacao, Alerta, Promocao, Sistema
- Selecionar usuario por nome

---

## Secao Tecnica

### Migracao de Banco de Dados

Sera executado o seguinte comando SQL:

```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'bf99886e-7d15-47d3-8b10-92527c2c58d7';
```

### Verificacao de Acesso

O sistema ja possui toda a logica de verificacao de admin implementada:

1. **AuthContext** (`src/contexts/AuthContext.tsx`):
   - Funcao `checkAdminRole()` consulta a tabela `user_roles`
   - Define `isAdmin = true` quando encontra role = 'admin'

2. **Rotas Protegidas** (`src/App.tsx`):
   - Rotas `/admin/*` estao configuradas
   - Cada pagina admin verifica `isAdmin` e redireciona se nao for admin

3. **Menu Lateral** (`src/components/layout/Sidebar.tsx`):
   - Exibe opcoes admin apenas quando `isAdmin = true`
   - Links para todas as 7 areas administrativas

### Nenhuma Alteracao de Codigo Necessaria

Toda a infraestrutura de admin ja esta implementada. Apenas a atualizacao do role no banco de dados e necessaria.


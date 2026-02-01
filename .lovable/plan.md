
# Plano: Sistema de Marketing Multinivel (MLM)

## Visao Geral

Implementar um sistema completo de rede de indicacoes multinivel (MLM) com:
- Sistema de links de indicacao para usuarios
- Hierarquia de niveis (ate 4 niveis)
- Comissoes por nivel (100%, 50%, 25%, 10%)
- Visualizacao em arvore da rede
- Painel administrativo para gestao

## Funcionalidades Principais

### Para Usuarios
1. **Link de Indicacao Pessoal**: Cada usuario tera um codigo unico para compartilhar
2. **Visualizacao da Rede**: Ver seus indicados diretos e indiretos
3. **Comissoes Recebidas**: Historico de ganhos por indicacao

### Para Administradores
1. **Painel MLM Completo**: Visualizacao de toda a rede em arvore
2. **Estatisticas**: Total na rede, diretos, volume, niveis ativos
3. **Resumo por Nivel**: Volume e comissao por nivel
4. **Busca de Usuarios**: Navegar pela arvore de indicacoes

---

## Secao Tecnica

### 1. Estrutura do Banco de Dados

**Nova Tabela: `referrals`**
```text
Colunas:
- id (uuid, PK)
- user_id (uuid) - Usuario que foi indicado
- referrer_id (uuid) - Quem indicou
- referral_code (text) - Codigo usado na indicacao
- level (integer) - Nivel na hierarquia (1-4)
- created_at (timestamp)

Constraints:
- user_id UNIQUE (cada usuario so pode ter um indicador)
- referrer_id REFERENCES profiles(user_id)
```

**Alteracao na Tabela `profiles`**
```text
Nova coluna:
- referral_code (text, UNIQUE) - Codigo de indicacao pessoal
```

**Nova Tabela: `referral_commissions`**
```text
Colunas:
- id (uuid, PK)
- user_id (uuid) - Quem recebe a comissao
- from_user_id (uuid) - De quem veio o investimento
- investment_id (uuid) - Investimento de origem
- level (integer) - Nivel da comissao (1-4)
- percentage (decimal) - Percentual aplicado
- amount (decimal) - Valor da comissao
- created_at (timestamp)
```

### 2. Regras de Negocio MLM

| Nivel | Percentual | Descricao |
|-------|-----------|-----------|
| 1 | 100% | Indicados diretos |
| 2 | 50% | Indicados de indicados |
| 3 | 25% | Terceiro nivel |
| 4 | 10% | Quarto nivel |

A comissao e calculada sobre o lucro gerado pelo investimento do indicado (nao sobre o valor investido).

### 3. Novos Arquivos a Criar

#### Pagina Admin: `src/pages/admin/AdminMLM.tsx`

Layout visual seguindo a referencia:
- 4 Cards de estatisticas:
  - Total na Rede (icone amarelo)
  - Diretos (icone verde)
  - Volume Total (icone cyan)
  - Niveis Ativos (icone roxo)

- Componente Arvore de Indicacoes:
  - Usuario raiz selecionado com avatar, nome, badge de nivel
  - Expansao por nivel (1 a 4)
  - Cada nivel mostra: quantidade de membros, volume, comissao %
  - Lista de membros do nivel com avatar, nome, nivel, volume

- Card Resumo da Rede:
  - Barra de progresso por nivel
  - Volume e quantidade de membros
  - Comissao estimada total (em verde)

Componentes UI:
- Collapsible levels com animacao
- Avatars coloridos por nome
- Badges de nivel (Iniciante, Estrela 1-5)
- Barras de progresso teal

#### Pagina Usuario: `src/pages/MLMNetwork.tsx`

Versao simplificada para o usuario ver sua propria rede:
- Card com link de indicacao (copiar)
- Estatisticas pessoais
- Lista de indicados diretos
- Historico de comissoes

### 4. Alteracoes em Arquivos Existentes

#### `src/components/layout/Sidebar.tsx`
Adicionar links de navegacao:
- Usuario: "Minha Rede" -> /mlm
- Admin: "Rede MLM" -> /admin/mlm

#### `src/App.tsx`
Adicionar rotas:
- /mlm -> MLMNetwork (usuario)
- /admin/mlm -> AdminMLM (admin)

#### `src/pages/Auth.tsx`
Modificar para:
- Aceitar parametro de referral code na URL
- Salvar referencia ao criar conta

### 5. Funcoes de Banco de Dados

**Funcao: `generate_referral_code()`**
Trigger para gerar codigo unico ao criar profile.

**Funcao: `calculate_referral_chain(user_id)`**
Retorna a cadeia de indicacoes de um usuario ate 4 niveis acima.

**Funcao: `get_network_tree(user_id)`**
Retorna a arvore de indicados de um usuario.

**Funcao: `calculate_mlm_commission(investment_id)`**
Calcula e distribui comissoes quando um investimento gera lucro.

### 6. RLS Policies

**Tabela `referrals`:**
- SELECT: Usuarios veem suas proprias indicacoes + indicados
- INSERT: Sistema (trigger)
- Admin: ALL

**Tabela `referral_commissions`:**
- SELECT: Usuarios veem suas proprias comissoes
- INSERT: Sistema (funcao de calculo)
- Admin: ALL

### 7. Fluxo de Implementacao

```text
1. Migracoes de Banco
   |
   v
2. Gerar codigos para usuarios existentes
   |
   v
3. Criar pagina AdminMLM.tsx
   |
   v
4. Criar pagina MLMNetwork.tsx
   |
   v
5. Atualizar Sidebar + Rotas
   |
   v
6. Modificar Auth para capturar referral
   |
   v
7. Criar trigger de comissoes
```

### 8. Cores e Estilos (Tema Dark Premium)

```text
Fundo: #0a0f14
Cards: #111820
Bordas: #1e2a3a
Nivel badges:
  - 1o: bg-amber-500/20 + text-amber-400
  - 2o: bg-green-500/20 + text-green-400
  - 3o: bg-cyan-500/20 + text-cyan-400
  - 4o: bg-purple-500/20 + text-purple-400
Barras de progresso: teal-500 -> cyan-400
Comissao estimada: text-green-400
```

### 9. Estrutura Visual da Arvore

```text
+--------------------------------------------------+
| [Avatar] Ricardo Almeida    [Badge: Estrela 5]   |
| 234 membros na rede • R$ 458 mil volume total    |
+--------------------------------------------------+
|                                                  |
|  [1o] Nivel 1                     100% comissao  |
|       12 membros • R$ 125 mil              [v]   |
|  +----------------------------------------------+|
|  | [AC] Ana Costa        Estrela 3    R$ 25 mil ||
|  | [PL] Pedro Lima       Estrela 2    R$ 18 mil ||
|  | [MS] Maria Santos     Estrela 2    R$ 15 mil ||
|  |          Ver mais 9 membros                  ||
|  +----------------------------------------------+|
|                                                  |
|  [2o] Nivel 2                      50% comissao  |
|       45 membros • R$ 180 mil              [>]   |
|                                                  |
|  [3o] Nivel 3                      25% comissao  |
|       89 membros • R$ 98 mil               [>]   |
|                                                  |
|  [4o] Nivel 4                      10% comissao  |
|       88 membros • R$ 55 mil               [>]   |
+--------------------------------------------------+
```

### 10. Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar tabelas referrals, referral_commissions |
| Migracao SQL | Adicionar referral_code em profiles |
| src/pages/admin/AdminMLM.tsx | CRIAR (novo) |
| src/pages/MLMNetwork.tsx | CRIAR (novo) |
| src/components/layout/Sidebar.tsx | EDITAR |
| src/App.tsx | EDITAR |
| src/pages/Auth.tsx | EDITAR |

### 11. Consideracoes de Seguranca

- RLS policies rigorosas para impedir manipulacao de rede
- Codigos de referral nao previsiveis (uuid curto)
- Validacao de cadeia de indicacoes via funcao security definer
- Admin pode visualizar toda a rede, usuarios apenas sua subarvore

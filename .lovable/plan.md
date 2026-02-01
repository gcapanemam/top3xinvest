
# Plano: Implementar Layout Dark Premium do Admin Users

## Visao Geral

Vou transformar completamente a pagina de Gestao de Usuarios para replicar fielmente o layout de referencia com tema escuro premium, incluindo todas as colunas e elementos visuais.

## Mudancas Visuais Principais

### 1. Cabecalho da Pagina
- Titulo "Gestao de Usuarios" em branco
- Subtitulo "Gerencie usuarios, carteiras e redes de indicacao" em cinza

### 2. Cards de Estatisticas (4 cards)
- **Total Usuarios**: Icone verde-agua, fundo escuro com borda sutil
- **Ativos**: Icone verde, contador de usuarios ativos
- **Bloqueados**: Icone vermelho, contador de bloqueados
- **Total Investido**: Icone amarelo/dourado, soma dos investimentos

### 3. Tabela de Usuarios Expandida
Nova estrutura com 8 colunas:

| Coluna | Descricao |
|--------|-----------|
| Usuario | Avatar colorido + Nome + Email |
| Status | Badge colorida (Ativo/Bloqueado/Pendente) |
| Nivel | Badge com estrelas (Iniciante, Estrela 1-4) |
| Carteira | Saldo disponivel + Saldo bloqueado (em cyan) |
| Investido | Total investido pelo usuario |
| Rede | Quantidade de membros indicados |
| Ganhos | Lucros totais (em verde com icone trending) |
| Acoes | Menu dropdown com opcoes |

### 4. Barra de Progresso
- Barra horizontal verde-agua em cada linha representando nivel de atividade

### 5. Campo de Busca
- Posicionado no canto direito do cabecalho da tabela
- Placeholder "Buscar por nome ou email..."

---

## Secao Tecnica

### Arquivos a Modificar

#### 1. `src/pages/admin/AdminUsers.tsx`
Reescrever completamente a pagina com:

```text
- Interface UserProfile expandida com campos:
  - email (string)
  - level (string): "Iniciante", "Estrela 1", "Estrela 2", etc.
  - total_invested (number)
  - blocked_balance (number)
  - network_count (number)
  - total_earnings (number)

- Novos componentes de UI:
  - getLevelBadge(): Retorna badge com cor baseada no nivel
  - ProgressBar: Barra de progresso verde-agua
  - StatusBadge: Badge com cores para Ativo/Bloqueado/Pendente

- Tabela expandida com todas as 8 colunas
- Estilo dark premium com:
  - bg-[#0d1117] para fundo
  - bg-[#161b22] para cards
  - Bordas em border-[#30363d]
  - Texto em cores: branco, cinza, cyan, verde
```

#### 2. `src/index.css` (Opcional)
Adicionar variaveis CSS customizadas para o tema dark do admin se necessario

### Novas Funcionalidades

1. **Busca por email**: Filtro que inclui email alem do nome
2. **Indicador de nivel**: Sistema de niveis baseado em investimento/atividade
3. **Saldo bloqueado**: Exibicao de saldo que esta em investimentos ativos
4. **Contagem de rede**: Numero de usuarios indicados
5. **Total de ganhos**: Lucros acumulados do usuario

### Dados Simulados vs Reais

Como a tabela `profiles` atual nao tem todos os campos necessarios (level, blocked_balance, network_count, earnings), vou:

1. Usar os dados existentes (balance, is_blocked, full_name)
2. Calcular `total_invested` a partir da tabela `investments`
3. Mostrar campos adicionais como placeholders ou calcular a partir dos dados disponiveis
4. Manter a funcionalidade existente de bloquear/desbloquear usuarios

### Cores do Layout de Referencia

```text
- Fundo principal: #0a0f14 (azul muito escuro)
- Cards: #111820 (azul escuro)
- Bordas: #1e2a3a (azul acinzentado)
- Texto principal: #ffffff
- Texto secundario: #6b7280
- Verde/Teal (icones): #14b8a6
- Verde (sucesso): #22c55e
- Vermelho (erro): #ef4444
- Amarelo (destaque): #f59e0b
- Cyan (valores): #06b6d4
```

### Fluxo de Implementacao

1. Atualizar interface TypeScript com novos campos
2. Modificar query para buscar dados de investments
3. Recriar estrutura visual dos cards de estatisticas
4. Implementar tabela expandida com todas as colunas
5. Adicionar barras de progresso
6. Estilizar com cores do tema dark
7. Manter funcionalidades existentes (bloquear, editar saldo)

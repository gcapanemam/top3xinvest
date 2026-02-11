

# Plano: Adicionar Editar Saldo e Editar Lucro no Admin

## Situacao Atual
O dialog de edicao de usuario ja possui o campo "Saldo da carteira" (balance) na aba "Dados". Falta a opcao de editar o lucro (profit_accumulated) dos investimentos do usuario.

## Mudancas em `src/pages/admin/AdminUsers.tsx`

### 1. Buscar investimentos do usuario ao abrir o dialog
Na funcao `openEditDialog`, alem de buscar o email, buscar tambem os investimentos ativos do usuario para listar e permitir edicao do lucro de cada um.

### 2. Adicionar nova aba "Financeiro" no dialog de edicao
Criar uma nova aba no dialog com dois blocos:
- **Saldo da Carteira**: mover o campo de saldo para esta aba (ou duplicar)
- **Lucro por Investimento**: listar os investimentos ativos do usuario com o nome do robo e um campo editavel para `profit_accumulated` de cada investimento

### 3. Estado adicional
- Adicionar estado para armazenar os investimentos do usuario sendo editado
- Adicionar estado para os valores editados de `profit_accumulated` por investimento

### 4. Funcao de salvar lucro
- Ao salvar, atualizar o `profit_accumulated` de cada investimento modificado na tabela `investments`
- Registrar audit log com as alteracoes

### 5. Estrutura da aba "Financeiro"

```text
Aba Financeiro:
  [Saldo da Carteira]
  $ [input com valor]

  [Lucro por Investimento]
  Robo X - Investido: $500
    Lucro: $ [input editavel]
  Robo Y - Investido: $1000  
    Lucro: $ [input editavel]

  [Botao Salvar]
```

### Detalhes tecnicos

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/admin/AdminUsers.tsx` | Adicionar busca de investimentos no openEditDialog, nova aba "Financeiro" com campos de saldo e lucro por investimento, funcao de salvar lucros, audit log |

- A busca de investimentos usara `supabase.from('investments').select('*, robots(name)').eq('user_id', userId).eq('status', 'active')`
- A atualizacao do lucro usara `supabase.from('investments').update({ profit_accumulated: valor }).eq('id', investmentId)`
- O audit log registrara a acao como `user_edited` com detalhes das alteracoes de saldo e lucro

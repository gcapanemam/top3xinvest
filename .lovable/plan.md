
# Plano: Limpar Rede ao Excluir Usuario

## Problema
As tabelas `referrals` e `referral_commissions` nao possuem foreign keys com CASCADE para `auth.users`. Quando um admin exclui um usuario, os registros de indicacao e comissoes permanecem orfaos no banco, poluindo a rede MLM.

## Solucao
Adicionar foreign keys com `ON DELETE CASCADE` nas tabelas `referrals` e `referral_commissions` para que os registros sejam automaticamente removidos quando o usuario for excluido.

## Mudancas

### 1. Migracao SQL
Adicionar constraints de foreign key nas seguintes colunas:

**Tabela `referrals`:**
- `user_id` -> `auth.users(id) ON DELETE CASCADE` (usuario indicado)
- `referrer_id` -> `auth.users(id) ON DELETE CASCADE` (quem indicou)

**Tabela `referral_commissions`:**
- `user_id` -> `auth.users(id) ON DELETE CASCADE` (quem recebeu a comissao)
- `from_user_id` -> `auth.users(id) ON DELETE CASCADE` (de quem veio)

### 2. Limpeza de dados orfaos existentes
Antes de criar as constraints, remover registros que ja estao orfaos (referenciam usuarios que nao existem mais).

### Detalhes tecnicos

A migracao executara:

```text
1. DELETE de registros orfaos em referral_commissions
2. DELETE de registros orfaos em referrals  
3. ALTER TABLE referrals ADD CONSTRAINT ... FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
4. ALTER TABLE referrals ADD CONSTRAINT ... FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE
5. ALTER TABLE referral_commissions ADD CONSTRAINT ... FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
6. ALTER TABLE referral_commissions ADD CONSTRAINT ... FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
```

Nenhuma alteracao de codigo frontend e necessaria. A limpeza passa a ser automatica pelo banco de dados.

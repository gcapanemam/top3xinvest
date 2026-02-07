

# Plano: Mostrar Nome e Email do Usuário na Página de Depósitos

## Visao Geral

Atualizar a página de Aprovar Depósitos (AdminDeposits) para exibir o nome completo e email do usuário que fez cada depósito, em vez de mostrar apenas "Usuário".

---

## Problema Atual

A query de busca de depósitos não está fazendo JOIN com a tabela `profiles` para obter as informações do usuário:

```typescript
const { data } = await supabase
  .from('deposits')
  .select(`
    *,
    cryptocurrency:cryptocurrencies(symbol, name)
  `)
```

Por isso, `deposit.profile` está sempre `undefined`, mostrando apenas "Usuário".

---

## Solucao

### 1. Atualizar a Interface Deposit

Adicionar campo `email` na interface do profile:

```typescript
interface Deposit {
  // ... campos existentes
  profile?: { 
    full_name: string | null;
    // Observacao: email nao esta em profiles, esta em auth.users
  } | null;
}
```

**Nota importante**: O email do usuario esta na tabela `auth.users` (gerenciada pelo Supabase Auth) e nao na tabela `profiles`. Para exibir o email, temos duas opcoes:

- **Opcao A**: Adicionar coluna `email` na tabela `profiles` (sincronizada via trigger)
- **Opcao B**: Buscar o email via Edge Function usando service role

### 2. Atualizar a Query fetchDeposits

Adicionar o JOIN com a tabela profiles:

```typescript
const { data } = await supabase
  .from('deposits')
  .select(`
    *,
    cryptocurrency:cryptocurrencies(symbol, name),
    profile:profiles!deposits_user_id_fkey(full_name)
  `)
  .order('created_at', { ascending: false });
```

### 3. Atualizar o Layout dos Cards

**Antes:**
```text
+----------------------------------------------+
| [Icon]  Usuário                    R$ 100,00 |
|         02/02/26 às 11:47              [PIX] |
+----------------------------------------------+
```

**Depois:**
```text
+----------------------------------------------+
| [Icon]  João da Silva              R$ 100,00 |
|         joao@email.com                 [PIX] |
|         02/02/26 às 11:47                    |
+----------------------------------------------+
```

---

## Abordagem Recomendada para Email

Como o email não está na tabela `profiles`, a solução mais simples é:

1. Adicionar coluna `email` na tabela `profiles`
2. Criar trigger que sincroniza automaticamente o email do `auth.users` para `profiles`

Isso permitirá buscar nome e email em uma única query.

---

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| src/pages/admin/AdminDeposits.tsx | Atualizar query e layout dos cards |

### Migration SQL (adicionar email em profiles)

```sql
-- Adicionar coluna email na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Atualizar emails existentes
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id;

-- Trigger para manter sincronizado
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();
```

### Alteracoes no Componente

1. **Interface Deposit atualizada:**
```typescript
interface Deposit {
  // ... campos existentes
  profile?: { 
    full_name: string | null;
    email: string | null;
  } | null;
}
```

2. **Query atualizada:**
```typescript
const { data } = await supabase
  .from('deposits')
  .select(`
    *,
    cryptocurrency:cryptocurrencies(symbol, name),
    profile:profiles(full_name, email)
  `)
  .order('created_at', { ascending: false });
```

3. **Layout do card atualizado:**
```tsx
<div>
  <p className="font-medium text-white">
    {deposit.profile?.full_name || 'Usuário'}
  </p>
  {deposit.profile?.email && (
    <p className="text-sm text-cyan-400">
      {deposit.profile.email}
    </p>
  )}
  <p className="text-sm text-gray-400">
    {format(new Date(deposit.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
  </p>
</div>
```

---

## Aplicar Mesma Logica em AdminWithdrawals

A página de saques (`AdminWithdrawals.tsx`) também exibe "Usuário" e precisa da mesma correção para mostrar nome e email.

---

## Resumo

1. Criar migration para adicionar coluna `email` em `profiles`
2. Criar trigger para sincronizar email do `auth.users`
3. Atualizar query em `AdminDeposits.tsx` para incluir JOIN com profiles
4. Atualizar layout dos cards para mostrar nome e email
5. Aplicar mesmas alteracoes em `AdminWithdrawals.tsx`


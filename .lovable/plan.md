

# Plano: Adicionar Filtro de Usuários Inativos no Painel Admin

## Objetivo
Adicionar um filtro na página de Gestão de Usuários para mostrar apenas usuários inativos (aqueles que ainda não ativaram nenhum robô).

---

## Contexto

O sistema já possui o campo `is_active` na tabela `profiles`:
- `is_active = false`: Usuário ainda não investiu em nenhum robô
- `is_active = true`: Usuário já ativou pelo menos um robô

Atualmente, a página Admin Users não utiliza esse campo.

---

## Alterações Necessárias

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/admin/AdminUsers.tsx` | Modificar | Adicionar campo `is_active` e filtro de usuários inativos |

---

## Detalhes da Implementação

### 1. Atualizar Interface `UserWithStats`

Adicionar o campo `is_active`:

```typescript
interface UserWithStats {
  // ... campos existentes
  is_active: boolean; // Novo campo
}
```

### 2. Buscar Campo `is_active` no fetchUsersWithStats

Na função que busca os perfis, incluir o campo `is_active` no mapeamento:

```typescript
return {
  // ... campos existentes
  is_active: profile.is_active,
};
```

### 3. Adicionar Estado de Filtro

Criar estado para controlar o filtro selecionado:

```typescript
const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
```

### 4. Atualizar Lógica de Filtragem

Modificar `filteredUsers` para considerar o novo filtro:

```typescript
const filteredUsers = users.filter((user) => {
  // Filtro de busca por texto
  const matchesSearch =
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_id.includes(searchQuery);
  
  // Filtro por status
  const matchesStatus =
    statusFilter === 'all' ||
    (statusFilter === 'active' && user.is_active && !user.is_blocked) ||
    (statusFilter === 'inactive' && !user.is_active) ||
    (statusFilter === 'blocked' && user.is_blocked);
  
  return matchesSearch && matchesStatus;
});
```

### 5. Adicionar UI do Filtro

Adicionar botões/tabs de filtro junto ao campo de busca:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Lista de Usuários                                                           │
│                                                                             │
│ [Todos] [Ativos] [Inativos] [Bloqueados]        🔍 Buscar por nome...      │
└─────────────────────────────────────────────────────────────────────────────┘
```

Implementação com botões estilizados:

```typescript
<div className="flex items-center gap-2">
  <Button
    variant={statusFilter === 'all' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setStatusFilter('all')}
  >
    Todos
  </Button>
  <Button
    variant={statusFilter === 'active' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setStatusFilter('active')}
  >
    Ativos
  </Button>
  <Button
    variant={statusFilter === 'inactive' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setStatusFilter('inactive')}
    className="text-amber-400"
  >
    Inativos
  </Button>
  <Button
    variant={statusFilter === 'blocked' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setStatusFilter('blocked')}
    className="text-red-400"
  >
    Bloqueados
  </Button>
</div>
```

### 6. Atualizar Contadores de Stats

Adicionar contador de usuários inativos nos cards:

```typescript
const inactiveUsers = users.filter((u) => !u.is_active).length;
```

Adicionar novo card de estatísticas (ou substituir um existente):

```text
┌──────────────────────┐
│ ⏳ Inativos          │
│      12              │
└──────────────────────┘
```

### 7. Exibir Badge de Status na Tabela

Atualizar a coluna de Status para mostrar o estado de ativação:

```typescript
{/* Status */}
<td className="px-4 py-4">
  <div className="flex flex-col gap-1">
    {user.is_admin && (
      <Badge className="bg-purple-500/20 text-purple-400 border-0 w-fit">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    )}
    {user.is_blocked ? (
      <Badge className="bg-red-500/20 text-red-400 border-0">
        Bloqueado
      </Badge>
    ) : user.is_active ? (
      <Badge className="bg-green-500/20 text-green-400 border-0">
        Ativo
      </Badge>
    ) : (
      <Badge className="bg-amber-500/20 text-amber-400 border-0">
        Inativo
      </Badge>
    )}
  </div>
</td>
```

---

## Layout do Filtro

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Lista de Usuários                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [Todos (45)] [Ativos (30)] [Inativos (12)] [Bloqueados (3)]          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────┐                                     │
│  │ 🔍 Buscar por nome ou email...    │                                     │
│  └────────────────────────────────────┘                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Resultado Esperado

Após a implementação:

1. Admin verá botões de filtro acima da tabela de usuários
2. Ao clicar em "Inativos", verá apenas usuários que não ativaram robôs
3. A coluna Status mostrará badge amarelo "Inativo" para esses usuários
4. O contador no card de estatísticas mostrará quantos usuários inativos existem
5. Os filtros combinam com a busca por texto (pode buscar "João" entre os inativos)


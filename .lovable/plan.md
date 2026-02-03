
# Plano: Gestao Completa de Usuarios no Painel Admin

## Visao Geral

Implementar funcionalidades avancadas de gestao de usuarios no painel administrativo, incluindo: tornar usuario admin, editar dados pessoais (nome, email, telefone), redefinir senha, gerenciar wallet e opcoes para excluir/inativar usuarios.

## Funcionalidades a Implementar

### 1. Tornar Usuario Admin/Remover Admin
- Adicionar/remover role de admin na tabela `user_roles`
- Exibir badge indicando se usuario e admin

### 2. Editar Dados do Usuario
- Nome completo (tabela `profiles`)
- Telefone/contato (tabela `profiles`)
- Wallet/saldo (ja existe, melhorar)

### 3. Acoes de Conta
- Bloquear/desbloquear (ja existe - `is_blocked`)
- Enviar email para redefinir senha
- Excluir usuario permanentemente

---

## Secao Tecnica

### Estrutura de Dados Atual

| Campo | Tabela | Editavel |
|-------|--------|----------|
| full_name | profiles | Sim |
| phone | profiles | Sim |
| balance | profiles | Sim (ja implementado) |
| is_blocked | profiles | Sim (ja implementado) |
| role | user_roles | Sim (adicionar/remover admin) |
| email | auth.users | Via Admin API (Edge Function) |
| password | auth.users | Via reset password email |

### Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|-----------|
| src/pages/admin/AdminUsers.tsx | Nova interface de edicao completa |
| supabase/functions/admin-user-actions/index.ts | Edge function para acoes admin |

---

### 1. Interface de Edicao - Nova Dialog

Criar um novo dialog "Editar Usuario" com abas para diferentes secoes:

```text
+----------------------------------+
| Editar Usuario                   |
+----------------------------------+
| [Dados] [Permissoes] [Acoes]     |
+----------------------------------+
| Dados Pessoais:                  |
| - Nome: [___________________]    |
| - Telefone: [_______________]    |
|                                  |
| Carteira:                        |
| - Saldo: R$ [_______________]    |
+----------------------------------+
| [Cancelar]          [Salvar]     |
+----------------------------------+
```

### 2. Aba Permissoes

```text
+----------------------------------+
| Permissoes                       |
+----------------------------------+
| Nivel de Acesso:                 |
| (x) Usuario comum                |
| ( ) Administrador                |
+----------------------------------+
| Aviso: Administradores tem       |
| acesso total ao sistema          |
+----------------------------------+
```

### 3. Aba Acoes

```text
+----------------------------------+
| Acoes                            |
+----------------------------------+
| Status da Conta:                 |
| [Bloquear Usuario]               |
|                                  |
| Seguranca:                       |
| [Enviar Email Reset Senha]       |
|                                  |
| Zona de Perigo:                  |
| [Excluir Usuario Permanentemente]|
+----------------------------------+
```

---

### 4. Edge Function para Acoes Admin

Criar edge function `admin-user-actions` para:
- Atualizar email do usuario (Supabase Admin API)
- Enviar email de reset de senha
- Excluir usuario completamente

```typescript
// supabase/functions/admin-user-actions/index.ts

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { action, user_id, data } = await req.json();

  // Verificar se requisitante e admin
  const authHeader = req.headers.get('Authorization');
  // ... validacao

  switch (action) {
    case 'send_password_reset':
      // Enviar email de reset
      break;
    case 'delete_user':
      // Deletar usuario do auth e cascade nas tabelas
      break;
    case 'toggle_admin':
      // Adicionar/remover role admin
      break;
  }
});
```

---

### 5. Alteracoes no AdminUsers.tsx

**Novos estados:**
```typescript
// Estado para dialog de edicao completa
const [editUser, setEditUser] = useState<UserWithStats | null>(null);
const [editData, setEditData] = useState({
  full_name: '',
  phone: '',
  balance: '',
  is_admin: false,
});
const [isUpdating, setIsUpdating] = useState(false);
const [activeEditTab, setActiveEditTab] = useState<'dados' | 'permissoes' | 'acoes'>('dados');

// Estado para confirmacao de exclusao
const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserWithStats | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
```

**Interface do usuario atualizada:**
```typescript
interface UserWithStats {
  // campos existentes...
  email?: string;
  phone?: string;
  is_admin: boolean;
}
```

**Novas funcoes:**
```typescript
// Buscar se usuario e admin
const fetchUserRole = async (userId: string) => {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  return !!data;
};

// Atualizar dados do usuario
const handleUpdateUser = async () => {
  // Atualizar profiles (nome, telefone, saldo)
  await supabase
    .from('profiles')
    .update({
      full_name: editData.full_name,
      phone: editData.phone,
      balance: parseFloat(editData.balance),
    })
    .eq('id', editUser.id);
};

// Toggle admin role
const handleToggleAdmin = async (userId: string, makeAdmin: boolean) => {
  if (makeAdmin) {
    await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'admin',
    });
  } else {
    await supabase.from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');
  }
};

// Enviar reset de senha
const handleSendPasswordReset = async (email: string) => {
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
};

// Excluir usuario (via edge function)
const handleDeleteUser = async (userId: string) => {
  const response = await supabase.functions.invoke('admin-user-actions', {
    body: { action: 'delete_user', user_id: userId },
  });
};
```

---

### 6. Novo Layout do Menu de Acoes

Substituir o dropdown atual por opcoes mais completas:

```typescript
<DropdownMenuContent>
  <DropdownMenuItem onClick={() => openEditDialog(user)}>
    <Edit className="mr-2 h-4 w-4" />
    Editar Usuario
  </DropdownMenuItem>
  
  <DropdownMenuItem onClick={() => toggleAdmin(user)}>
    <Shield className="mr-2 h-4 w-4" />
    {user.is_admin ? 'Remover Admin' : 'Tornar Admin'}
  </DropdownMenuItem>
  
  <DropdownMenuSeparator />
  
  <DropdownMenuItem onClick={() => toggleUserBlock(user)}>
    {user.is_blocked ? <CheckCircle /> : <Ban />}
    {user.is_blocked ? 'Desbloquear' : 'Bloquear'}
  </DropdownMenuItem>
  
  <DropdownMenuItem onClick={() => handleViewNetwork(user)}>
    <UsersRound className="mr-2 h-4 w-4" />
    Ver Rede
  </DropdownMenuItem>
  
  <DropdownMenuSeparator />
  
  <DropdownMenuItem className="text-red-400" onClick={() => confirmDelete(user)}>
    <Trash2 className="mr-2 h-4 w-4" />
    Excluir Usuario
  </DropdownMenuItem>
</DropdownMenuContent>
```

---

### 7. Badge de Admin na Tabela

Adicionar indicador visual na coluna de status:

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
    ) : (
      <Badge className="bg-green-500/20 text-green-400 border-0">
        Ativo
      </Badge>
    )}
  </div>
</td>
```

---

### 8. Dialog de Confirmacao de Exclusao

```typescript
<Dialog open={!!deleteConfirmUser}>
  <DialogContent className="bg-[#111820] border-red-500/30">
    <DialogHeader>
      <DialogTitle className="text-red-400 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        Excluir Usuario
      </DialogTitle>
      <DialogDescription>
        Tem certeza que deseja excluir permanentemente o usuario 
        <strong>{deleteConfirmUser?.full_name}</strong>?
        Esta acao nao pode ser desfeita.
      </DialogDescription>
    </DialogHeader>
    
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 my-4">
      <p className="text-sm text-red-400">
        Todos os dados serao excluidos:
      </p>
      <ul className="text-sm text-gray-400 list-disc ml-4 mt-2">
        <li>Perfil e informacoes pessoais</li>
        <li>Investimentos ativos</li>
        <li>Historico de transacoes</li>
        <li>Rede de indicacoes</li>
      </ul>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setDeleteConfirmUser(null)}>
        Cancelar
      </Button>
      <Button 
        variant="destructive"
        onClick={() => handleDeleteUser(deleteConfirmUser.user_id)}
        disabled={isDeleting}
      >
        {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Resumo das Alteracoes

| Componente | Funcionalidade |
|------------|----------------|
| Dialog Editar | Nome, telefone, saldo em um so lugar |
| Badge Admin | Indicador visual de administradores |
| Toggle Admin | Promover/remover permissao admin |
| Reset Senha | Enviar email para redefinir |
| Excluir Usuario | Remover permanentemente com confirmacao |
| Edge Function | Acoes que requerem service role key |

### Fluxo de Edicao

```text
Clique em "..." -> "Editar Usuario"
         |
         v
+---------------------------+
| Dialog com 3 abas         |
+---------------------------+
|                           |
| [Dados] - Editar nome,    |
|   telefone e saldo        |
|                           |
| [Permissoes] - Toggle     |
|   admin on/off            |
|                           |
| [Acoes] - Bloquear,       |
|   reset senha, excluir    |
|                           |
+---------------------------+
```

### Consideracoes de Seguranca

1. **Verificacao de Admin**: Todas as acoes verificam se o usuario logado e admin
2. **RLS Policies**: Tabela `user_roles` ja tem politicas que permitem apenas admins gerenciar
3. **Edge Function**: Usa `SUPABASE_SERVICE_ROLE_KEY` para acoes privilegiadas
4. **Confirmacao**: Exclusao requer confirmacao explicita
5. **Self-Protection**: Admin nao pode remover propria permissao de admin

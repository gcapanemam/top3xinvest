
# Plano: Implementar Botoes "Editar Saldo" e "Ver Rede" na Gestao de Usuarios

## Visao Geral

Os botoes "Editar Saldo" e "Ver Rede" no dropdown de acoes da pagina de usuarios (`/admin/users`) estao presentes visualmente mas nao possuem funcionalidade. Sera implementado:

1. **Editar Saldo**: Dialog para o admin alterar o saldo de um usuario
2. **Ver Rede**: Dialog para visualizar a arvore de indicacoes do usuario

## Funcionalidades

### 1. Editar Saldo
- Dialog com input para novo saldo
- Mostra saldo atual do usuario
- Opcao de adicionar/subtrair valor ou definir valor absoluto
- Confirmacao antes de salvar
- Registro na tabela de transacoes (opcional)

### 2. Ver Rede
- Dialog exibindo a rede de indicacoes do usuario
- Reutiliza a funcao `get_network_tree` ja existente
- Mostra membros por nivel (1-4)
- Estatisticas resumidas da rede

---

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| src/pages/admin/AdminUsers.tsx | Adicionar dialogs e handlers |

### 1. Novos Estados

```typescript
// Estado para dialog de editar saldo
const [editBalanceUser, setEditBalanceUser] = useState<UserWithStats | null>(null);
const [newBalance, setNewBalance] = useState<string>('');
const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);

// Estado para dialog de ver rede
const [viewNetworkUser, setViewNetworkUser] = useState<UserWithStats | null>(null);
const [networkData, setNetworkData] = useState<NetworkMember[]>([]);
const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);
```

### 2. Interfaces Adicionais

```typescript
interface NetworkMember {
  user_id: string;
  referrer_id: string;
  level: number;
  full_name: string;
  total_invested: number;
  referral_code: string;
}

interface NetworkStats {
  total_members: number;
  direct_members: number;
  total_volume: number;
  active_levels: number;
  level_1_count: number;
  level_1_volume: number;
  level_2_count: number;
  level_2_volume: number;
  level_3_count: number;
  level_3_volume: number;
  level_4_count: number;
  level_4_volume: number;
}
```

### 3. Handler: Editar Saldo

```typescript
const handleEditBalance = async () => {
  if (!editBalanceUser || !newBalance) return;
  
  setIsUpdatingBalance(true);
  
  const balanceValue = parseFloat(newBalance.replace(',', '.'));
  
  if (isNaN(balanceValue) || balanceValue < 0) {
    toast({
      title: 'Erro',
      description: 'Valor invalido',
      variant: 'destructive',
    });
    setIsUpdatingBalance(false);
    return;
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({ balance: balanceValue })
    .eq('id', editBalanceUser.id);
  
  if (error) {
    toast({
      title: 'Erro',
      description: 'Nao foi possivel atualizar o saldo',
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Sucesso!',
      description: `Saldo atualizado para ${formatCurrency(balanceValue)}`,
    });
    fetchUsersWithStats();
    setEditBalanceUser(null);
    setNewBalance('');
  }
  
  setIsUpdatingBalance(false);
};
```

### 4. Handler: Ver Rede

```typescript
const handleViewNetwork = async (user: UserWithStats) => {
  setViewNetworkUser(user);
  setIsLoadingNetwork(true);
  
  try {
    // Buscar arvore de rede
    const { data: tree, error: treeError } = await supabase.rpc('get_network_tree', {
      root_user_id: user.user_id,
    });
    
    if (treeError) throw treeError;
    setNetworkData(tree || []);
    
    // Buscar estatisticas
    const { data: stats, error: statsError } = await supabase.rpc('get_network_stats', {
      target_user_id: user.user_id,
    });
    
    if (statsError) throw statsError;
    setNetworkStats(stats?.[0] || null);
  } catch (error) {
    toast({
      title: 'Erro',
      description: 'Nao foi possivel carregar a rede',
      variant: 'destructive',
    });
  }
  
  setIsLoadingNetwork(false);
};
```

### 5. Dialog: Editar Saldo

```tsx
<Dialog open={!!editBalanceUser} onOpenChange={() => { setEditBalanceUser(null); setNewBalance(''); }}>
  <DialogContent className="bg-[#111820] border-[#1e2a3a]">
    <DialogHeader>
      <DialogTitle className="text-white">Editar Saldo</DialogTitle>
      <DialogDescription className="text-gray-400">
        Altere o saldo do usuario {editBalanceUser?.full_name || 'Sem nome'}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3 p-3 bg-[#0a0f14] rounded-lg">
        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarGradient(editBalanceUser?.full_name)} flex items-center justify-center`}>
          <span className="text-white text-sm font-semibold">
            {getInitials(editBalanceUser?.full_name)}
          </span>
        </div>
        <div>
          <p className="text-white font-medium">{editBalanceUser?.full_name}</p>
          <p className="text-sm text-gray-500">Saldo atual: {formatCurrency(editBalanceUser?.balance || 0)}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-gray-300">Novo saldo</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
          <Input
            type="text"
            placeholder="0,00"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
            className="pl-10 bg-[#0a0f14] border-[#1e2a3a] text-white"
          />
        </div>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setEditBalanceUser(null)} className="border-[#1e2a3a] text-gray-300">
        Cancelar
      </Button>
      <button
        onClick={handleEditBalance}
        disabled={isUpdatingBalance || !newBalance}
        className="h-10 px-4 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium disabled:opacity-50"
      >
        {isUpdatingBalance ? 'Salvando...' : 'Salvar'}
      </button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 6. Dialog: Ver Rede

```tsx
<Dialog open={!!viewNetworkUser} onOpenChange={() => { setViewNetworkUser(null); setNetworkData([]); setNetworkStats(null); }}>
  <DialogContent className="bg-[#111820] border-[#1e2a3a] max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-white flex items-center gap-2">
        <UsersRound className="h-5 w-5 text-purple-400" />
        Rede de {viewNetworkUser?.full_name || 'Usuario'}
      </DialogTitle>
      <DialogDescription className="text-gray-400">
        Visualize a arvore de indicacoes deste usuario
      </DialogDescription>
    </DialogHeader>
    
    {isLoadingNetwork ? (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    ) : networkData.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12">
        <Users className="h-12 w-12 text-gray-600" />
        <p className="mt-4 text-gray-500">Este usuario nao possui indicados</p>
      </div>
    ) : (
      <div className="space-y-6 py-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a0f14] p-3 rounded-lg">
            <p className="text-xs text-gray-500">Total na Rede</p>
            <p className="text-xl font-bold text-white">{networkStats?.total_members || 0}</p>
          </div>
          <div className="bg-[#0a0f14] p-3 rounded-lg">
            <p className="text-xs text-gray-500">Diretos</p>
            <p className="text-xl font-bold text-white">{networkStats?.direct_members || 0}</p>
          </div>
          <div className="bg-[#0a0f14] p-3 rounded-lg">
            <p className="text-xs text-gray-500">Volume Total</p>
            <p className="text-xl font-bold text-cyan-400">{formatCurrency(networkStats?.total_volume || 0)}</p>
          </div>
          <div className="bg-[#0a0f14] p-3 rounded-lg">
            <p className="text-xs text-gray-500">Niveis Ativos</p>
            <p className="text-xl font-bold text-white">{networkStats?.active_levels || 0}</p>
          </div>
        </div>
        
        {/* Network Tree by Level */}
        {[1, 2, 3, 4].map((level) => {
          const levelMembers = networkData.filter(m => m.level === level);
          if (levelMembers.length === 0) return null;
          
          const levelColors = {
            1: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
            2: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
            3: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
            4: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
          };
          
          const colors = levelColors[level as keyof typeof levelColors];
          
          return (
            <div key={level}>
              <div className={`flex items-center justify-between p-3 rounded-t-lg ${colors.bg} ${colors.border} border`}>
                <span className={`font-medium ${colors.text}`}>Nivel {level}</span>
                <span className="text-sm text-gray-400">{levelMembers.length} membros</span>
              </div>
              <div className="border-x border-b border-[#1e2a3a] rounded-b-lg divide-y divide-[#1e2a3a]/50">
                {levelMembers.slice(0, 5).map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getAvatarGradient(member.full_name)} flex items-center justify-center`}>
                        <span className="text-white text-xs font-semibold">{getInitials(member.full_name)}</span>
                      </div>
                      <span className="text-white text-sm">{member.full_name || 'Sem nome'}</span>
                    </div>
                    <span className="text-cyan-400 text-sm">{formatCurrency(member.total_invested)}</span>
                  </div>
                ))}
                {levelMembers.length > 5 && (
                  <p className="text-center text-sm text-gray-500 py-2">+ {levelMembers.length - 5} membros</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </DialogContent>
</Dialog>
```

### 7. Atualizar Dropdown Menu Items

```tsx
<DropdownMenuItem
  onClick={() => {
    setEditBalanceUser(user);
    setNewBalance(user.balance.toString());
  }}
  className="cursor-pointer text-gray-300 focus:text-white focus:bg-[#1e2a3a]"
>
  <Wallet className="mr-2 h-4 w-4" />
  Editar Saldo
</DropdownMenuItem>

<DropdownMenuItem
  onClick={() => handleViewNetwork(user)}
  className="cursor-pointer text-gray-300 focus:text-white focus:bg-[#1e2a3a]"
>
  <UsersRound className="mr-2 h-4 w-4" />
  Ver Rede
</DropdownMenuItem>
```

### 8. Buscar Contagem Real da Rede

Atualizar `fetchUsersWithStats` para buscar a contagem real de indicados usando a funcao `get_network_stats`:

```typescript
// Dentro do loop de profiles, substituir o networkCount simulado por:
const { data: stats } = await supabase.rpc('get_network_stats', {
  target_user_id: profile.user_id,
});

const networkCount = stats?.[0]?.total_members || 0;
```

### 9. Imports Adicionais

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
```

### Fluxo de Implementacao

```text
1. Adicionar imports (Dialog, Label)
   |
   v
2. Adicionar interfaces NetworkMember e NetworkStats
   |
   v
3. Adicionar estados para os dialogs
   |
   v
4. Criar handler handleEditBalance
   |
   v
5. Criar handler handleViewNetwork
   |
   v
6. Atualizar onClick dos DropdownMenuItems
   |
   v
7. Adicionar Dialog de Editar Saldo
   |
   v
8. Adicionar Dialog de Ver Rede
   |
   v
9. Atualizar fetchUsersWithStats para contagem real
```

### Visual Esperado

**Dialog Editar Saldo:**
```text
+------------------------------------------+
|  Editar Saldo                       [X]  |
|                                          |
|  Altere o saldo do usuario Joao Silva    |
|                                          |
|  [Avatar] Joao Silva                     |
|           Saldo atual: R$ 1.500,00       |
|                                          |
|  Novo saldo:                             |
|  R$ [__________________]                 |
|                                          |
|  [Cancelar]  [Salvar]                    |
+------------------------------------------+
```

**Dialog Ver Rede:**
```text
+------------------------------------------+
|  Rede de Joao Silva                 [X]  |
|                                          |
|  +----------+  +----------+              |
|  | Total: 8 |  | Diretos: 3 |            |
|  +----------+  +----------+              |
|  +----------+  +----------+              |
|  | Volume   |  | Niveis: 3 |             |
|  | R$25mil  |  |          |              |
|  +----------+  +----------+              |
|                                          |
|  Nivel 1 - 3 membros                     |
|  +--------------------------------------+|
|  | [A] Ana Paula       R$ 5.000,00     ||
|  | [M] Maria Silva     R$ 3.000,00     ||
|  | [P] Pedro Santos    R$ 2.000,00     ||
|  +--------------------------------------+|
|                                          |
|  Nivel 2 - 4 membros                     |
|  +--------------------------------------+|
|  | [J] Jose Carlos     R$ 4.000,00     ||
|  | ...                                  ||
|  +--------------------------------------+|
+------------------------------------------+
```

### Seguranca

- Apenas admins podem acessar esta pagina (verificacao ja existe)
- RLS policies garantem que apenas admins podem atualizar profiles
- As funcoes `get_network_tree` e `get_network_stats` sao SECURITY DEFINER


# Plano: Deposito por Criptomoeda

## Visao Geral

Implementar um sistema de deposito por criptomoeda onde o admin pode cadastrar carteiras de deposito (moeda, rede e endereco) e os usuarios podem escolher entre depositar via PIX ou Cripto.

---

## Alteracao Visual

### Painel Admin - Nova Pagina "Carteiras de Deposito"
```text
+--------------------------------------------------+
| Carteiras de Deposito                [+ Nova]    |
+--------------------------------------------------+
|                                                  |
| +----------------------------------------------+ |
| | BTC - Bitcoin                                | |
| | Rede: Bitcoin Network                        | |
| | Endereco: bc1qxy2kgdygjrsqtzq2n0yr...        | |
| |                            [Editar] [Excluir]| |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | ETH - Ethereum                               | |
| | Rede: ERC-20                                 | |
| | Endereco: 0x742d35Cc6634C0532925a3b...       | |
| |                            [Editar] [Excluir]| |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | USDT - Tether                                | |
| | Rede: TRC-20 (Tron)                          | |
| | Endereco: TJYxzM2xvV2WnTfLvKeRh3...          | |
| |                            [Editar] [Excluir]| |
| +----------------------------------------------+ |
|                                                  |
+--------------------------------------------------+
```

### Usuario - Dialog de Deposito (Novo Layout)
```text
+--------------------------------------------------+
| Solicitar Deposito                               |
+--------------------------------------------------+
|                                                  |
| Metodo de Pagamento:                             |
| +--------------------+ +--------------------+    |
| |    [x] PIX        | |    [ ] Cripto      |    |
| +--------------------+ +--------------------+    |
|                                                  |
| [Se PIX selecionado - layout atual]              |
|                                                  |
| [Se Cripto selecionado]                          |
| Selecione a Criptomoeda:                         |
| +----------------------------------------------+ |
| |  [x] BTC - Bitcoin Network                   | |
| |  [ ] ETH - ERC-20                            | |
| |  [ ] USDT - TRC-20                           | |
| +----------------------------------------------+ |
|                                                  |
| Valor em USD:                                    |
| +----------------------------------------------+ |
| | $ 100.00                                     | |
| +----------------------------------------------+ |
|                                                  |
| Endereco para Deposito:                          |
| +----------------------------------------------+ |
| | bc1qxy2kgdygjrsqtzq2n0yr...           [Copy] | |
| +----------------------------------------------+ |
|                                                  |
| Rede: Bitcoin Network                            |
| Minimo: $50.00                                   |
|                                                  |
|                   [Cancelar] [Confirmar Deposito]|
+--------------------------------------------------+
```

---

## Secao Tecnica

### 1. Nova Tabela no Banco de Dados

```sql
-- Tabela de carteiras de deposito cripto
CREATE TABLE public.deposit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cryptocurrency_id UUID REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
  network_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS policies
ALTER TABLE deposit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active deposit wallets"
ON deposit_wallets FOR SELECT
USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage deposit wallets"
ON deposit_wallets FOR ALL
USING (is_admin());

-- Adicionar campo na tabela deposits para tipo de pagamento
ALTER TABLE deposits ADD COLUMN payment_method TEXT DEFAULT 'pix';
ALTER TABLE deposits ADD COLUMN cryptocurrency_id UUID REFERENCES cryptocurrencies(id);
ALTER TABLE deposits ADD COLUMN network_name TEXT;
ALTER TABLE deposits ADD COLUMN wallet_address TEXT;
```

### 2. Nova Pagina Admin: AdminDepositWallets.tsx

```typescript
// Estrutura principal
interface DepositWallet {
  id: string;
  cryptocurrency_id: string;
  network_name: string;
  wallet_address: string;
  is_active: boolean;
  cryptocurrency?: { symbol: string; name: string };
}

// Estados
const [wallets, setWallets] = useState<DepositWallet[]>([]);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [editingWallet, setEditingWallet] = useState<DepositWallet | null>(null);
const [formData, setFormData] = useState({
  cryptocurrency_id: '',
  network_name: '',
  wallet_address: '',
  is_active: true,
});

// Formulario de cadastro
<div className="space-y-4">
  <div>
    <Label>Criptomoeda *</Label>
    <Select value={formData.cryptocurrency_id} onValueChange={...}>
      {cryptos.map((crypto) => (
        <SelectItem key={crypto.id} value={crypto.id}>
          {crypto.symbol} - {crypto.name}
        </SelectItem>
      ))}
    </Select>
  </div>
  <div>
    <Label>Nome da Rede *</Label>
    <Input
      placeholder="Ex: ERC-20, TRC-20, BEP-20, Bitcoin Network"
      value={formData.network_name}
      onChange={...}
    />
  </div>
  <div>
    <Label>Endereco da Carteira *</Label>
    <Input
      placeholder="0x..."
      value={formData.wallet_address}
      onChange={...}
    />
  </div>
  <div className="flex items-center gap-2">
    <Switch checked={formData.is_active} onCheckedChange={...} />
    <Label>Ativo</Label>
  </div>
</div>
```

### 3. Atualizar Sidebar e Rotas

Adicionar link no menu admin:
```typescript
// Em Sidebar.tsx ou similar
{ icon: Wallet, label: 'Carteiras Cripto', href: '/admin/wallets' }

// Em App.tsx
<Route path="/admin/wallets" element={<AdminDepositWallets />} />
```

### 4. Atualizar Deposits.tsx (Usuario)

```typescript
// Novos estados
const [paymentMethod, setPaymentMethod] = useState<'pix' | 'crypto'>('pix');
const [selectedWallet, setSelectedWallet] = useState<DepositWallet | null>(null);
const [depositWallets, setDepositWallets] = useState<DepositWallet[]>([]);

// Buscar carteiras disponiveis
const fetchDepositWallets = async () => {
  const { data } = await supabase
    .from('deposit_wallets')
    .select(`
      *,
      cryptocurrency:cryptocurrencies(symbol, name, current_price)
    `)
    .eq('is_active', true);
  
  if (data) setDepositWallets(data);
};

// Novo layout do dialog com tabs
<div className="flex gap-2 mb-4">
  <button
    className={cn(
      "flex-1 px-4 py-2 rounded-lg font-medium transition-all",
      paymentMethod === 'pix' 
        ? "bg-teal-500 text-white" 
        : "bg-[#1e2a3a] text-gray-400"
    )}
    onClick={() => setPaymentMethod('pix')}
  >
    PIX
  </button>
  <button
    className={cn(
      "flex-1 px-4 py-2 rounded-lg font-medium transition-all",
      paymentMethod === 'crypto' 
        ? "bg-teal-500 text-white" 
        : "bg-[#1e2a3a] text-gray-400"
    )}
    onClick={() => setPaymentMethod('crypto')}
  >
    Criptomoeda
  </button>
</div>

{paymentMethod === 'pix' ? (
  // Layout atual do PIX
) : (
  <div className="space-y-4">
    {/* Selecao de carteira */}
    <div className="space-y-2">
      <Label>Selecione a Criptomoeda</Label>
      <div className="space-y-2">
        {depositWallets.map((wallet) => (
          <div
            key={wallet.id}
            onClick={() => setSelectedWallet(wallet)}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-all",
              selectedWallet?.id === wallet.id
                ? "border-teal-500 bg-teal-500/10"
                : "border-[#1e2a3a] hover:border-teal-500/50"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-teal-400">
                {wallet.cryptocurrency?.symbol}
              </span>
              <span className="text-gray-400">-</span>
              <span className="text-white">{wallet.network_name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    
    {/* Campo de valor em USD */}
    <div className="space-y-2">
      <Label>Valor em USD</Label>
      <Input
        type="number"
        placeholder="$ 0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min={50}
      />
      <p className="text-xs text-gray-400">Minimo: $50.00</p>
    </div>
    
    {/* Exibir endereco da carteira selecionada */}
    {selectedWallet && (
      <div className="rounded-lg border border-[#1e2a3a] p-4 space-y-3 bg-[#0a0f14]">
        <h4 className="font-medium text-white">
          Envie para este endereco
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Rede:</span>
            <span className="text-sm text-white">{selectedWallet.network_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Endereco:</span>
            <div className="flex items-center gap-2">
              <code className="text-xs text-cyan-400 truncate max-w-[180px]">
                {selectedWallet.wallet_address}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(selectedWallet.wallet_address)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
)}

// Atualizar handleDeposit para salvar metodo
const handleDeposit = async () => {
  const depositData = {
    user_id: user!.id,
    amount: numAmount,
    status: 'pending',
    payment_method: paymentMethod,
    cryptocurrency_id: paymentMethod === 'crypto' ? selectedWallet?.cryptocurrency_id : null,
    network_name: paymentMethod === 'crypto' ? selectedWallet?.network_name : null,
    wallet_address: paymentMethod === 'crypto' ? selectedWallet?.wallet_address : null,
  };
  
  const { error } = await supabase.from('deposits').insert(depositData);
  // ...
};
```

### 5. Atualizar AdminDeposits.tsx

Exibir o metodo de pagamento no historico:

```typescript
// No card de deposito pendente
<div className="flex items-center gap-2">
  {deposit.payment_method === 'crypto' ? (
    <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs">
      {deposit.cryptocurrency?.symbol} - {deposit.network_name}
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">
      PIX
    </span>
  )}
</div>
```

---

## Resumo das Alteracoes

| Arquivo | Alteracoes |
|---------|-----------|
| Migracao SQL | Criar tabela deposit_wallets + campos em deposits |
| src/pages/admin/AdminDepositWallets.tsx | Nova pagina para gerenciar carteiras |
| src/pages/Deposits.tsx | Adicionar opcao PIX/Cripto com selecao de carteira |
| src/pages/admin/AdminDeposits.tsx | Exibir metodo de pagamento |
| src/components/layout/Sidebar.tsx | Adicionar link para nova pagina |
| src/App.tsx | Adicionar rota /admin/wallets |

### Fluxo

```text
ADMIN:
Cadastra carteira de deposito
        |
        v
+----------------------------------+
| Criptomoeda: USDT                |
| Rede: TRC-20 (Tron)              |
| Endereco: TJYxzM2xvV2WnTfL...    |
+----------------------------------+

USUARIO:
Abre dialog de deposito
        |
        v
Escolhe: [PIX] ou [Cripto]
        |
        v (Se Cripto)
Seleciona carteira disponivel
        |
        v
Ve endereco + rede + copia
        |
        v
Confirma deposito
        |
        v
Deposito salvo com:
- payment_method: 'crypto'
- cryptocurrency_id: uuid
- network_name: 'TRC-20'
- wallet_address: '...'

ADMIN:
Ve deposito pendente com badge "USDT - TRC-20"
        |
        v
Aprova/Recusa normalmente
```

### Consideracoes

1. **Multiplas redes por moeda**: Uma mesma cripto (ex: USDT) pode ter varias carteiras (ERC-20, TRC-20, BEP-20)
2. **Validacao**: Valor minimo de $50.00 para depositos cripto
3. **Historico**: O deposito salva a rede e endereco usados no momento (caso admin altere depois)
4. **Audit Log**: Criar/editar/excluir carteiras gera log de auditoria
5. **Moeda em USD**: Depositos cripto sao registrados em valor USD

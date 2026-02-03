
# Plano: Permitir Múltiplas Criptomoedas por Robô

## Visão Geral

Alterar o sistema para que cada robô possa operar com múltiplas criptomoedas, permitindo que o admin selecione várias moedas ao criar/editar um robô. A seleção será feita através de checkboxes em vez de um dropdown de seleção única.

---

## Alteração Visual

### Antes (Dropdown Único)
```text
Criptomoeda
+----------------------+
| BTC - Bitcoin      v |
+----------------------+
```

### Depois (Múltipla Seleção)
```text
Criptomoedas
+----------------------------------+
| [x] BTC - Bitcoin                |
| [x] ETH - Ethereum               |
| [ ] BNB - Binance Coin           |
| [x] SOL - Solana                 |
| [ ] XRP - Ripple                 |
| [ ] ADA - Cardano                |
| [ ] DOGE - Dogecoin              |
| [ ] DOT - Polkadot               |
+----------------------------------+
```

---

## Seção Técnica

### 1. Alteração no Banco de Dados

Criar tabela de relacionamento muitos-para-muitos:

```sql
-- Tabela de relacionamento robô <-> criptomoedas
CREATE TABLE public.robot_cryptocurrencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_id UUID NOT NULL REFERENCES robots(id) ON DELETE CASCADE,
  cryptocurrency_id UUID NOT NULL REFERENCES cryptocurrencies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(robot_id, cryptocurrency_id)
);

-- RLS policies
ALTER TABLE robot_cryptocurrencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view robot cryptocurrencies"
ON robot_cryptocurrencies FOR SELECT
USING (true);

CREATE POLICY "Admins can manage robot cryptocurrencies"
ON robot_cryptocurrencies FOR ALL
USING (is_admin());

-- Migrar dados existentes (robôs com cryptocurrency_id)
INSERT INTO robot_cryptocurrencies (robot_id, cryptocurrency_id)
SELECT id, cryptocurrency_id FROM robots WHERE cryptocurrency_id IS NOT NULL;
```

### 2. Alterações no AdminRobots.tsx

**Interface Robot atualizada:**
```typescript
interface Robot {
  id: string;
  name: string;
  description: string | null;
  cryptocurrency_id: string | null; // Mantido para compatibilidade
  profit_percentage_min: number;
  profit_percentage_max: number;
  profit_period_days: number;
  lock_period_days: number;
  min_investment: number;
  max_investment: number | null;
  is_active: boolean;
  cryptocurrency?: { symbol: string; name: string } | null;
  robot_cryptocurrencies?: Array<{
    cryptocurrency_id: string;
    cryptocurrency: { symbol: string; name: string };
  }>;
}
```

**Estado do Formulário:**
```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  selected_cryptocurrencies: [] as string[], // Array de IDs
  profit_percentage_min: '',
  profit_percentage_max: '',
  profit_period_days: '30',
  lock_period_days: '7',
  min_investment: '100',
  max_investment: '',
  is_active: true,
});
```

**Novo Componente de Seleção (substituir o Select):**
```typescript
<div className="space-y-2">
  <Label className="text-gray-300">Criptomoedas</Label>
  <div className="rounded-lg border border-[#1e2a3a] bg-[#0a0f14] p-3 max-h-48 overflow-y-auto space-y-2">
    {cryptos.map((crypto) => (
      <div key={crypto.id} className="flex items-center gap-2">
        <Checkbox
          id={`crypto-${crypto.id}`}
          checked={formData.selected_cryptocurrencies.includes(crypto.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setFormData(prev => ({
                ...prev,
                selected_cryptocurrencies: [...prev.selected_cryptocurrencies, crypto.id]
              }));
            } else {
              setFormData(prev => ({
                ...prev,
                selected_cryptocurrencies: prev.selected_cryptocurrencies.filter(id => id !== crypto.id)
              }));
            }
          }}
          className="border-[#1e2a3a] data-[state=checked]:bg-teal-500"
        />
        <Label 
          htmlFor={`crypto-${crypto.id}`} 
          className="text-white cursor-pointer flex items-center gap-2"
        >
          <span className="text-teal-400 font-mono">{crypto.symbol}</span>
          <span className="text-gray-400">-</span>
          <span>{crypto.name}</span>
        </Label>
      </div>
    ))}
  </div>
  {formData.selected_cryptocurrencies.length > 0 && (
    <p className="text-xs text-teal-400">
      {formData.selected_cryptocurrencies.length} moeda(s) selecionada(s)
    </p>
  )}
</div>
```

**Função openEditDialog atualizada:**
```typescript
const openEditDialog = async (robot: Robot) => {
  setEditingRobot(robot);
  
  // Buscar criptomoedas do robô
  const { data: robotCryptos } = await supabase
    .from('robot_cryptocurrencies')
    .select('cryptocurrency_id')
    .eq('robot_id', robot.id);
  
  const selectedIds = robotCryptos?.map(rc => rc.cryptocurrency_id) || [];
  
  // Fallback para campo antigo se não tiver na nova tabela
  if (selectedIds.length === 0 && robot.cryptocurrency_id) {
    selectedIds.push(robot.cryptocurrency_id);
  }
  
  setFormData({
    name: robot.name,
    description: robot.description || '',
    selected_cryptocurrencies: selectedIds,
    profit_percentage_min: robot.profit_percentage_min.toString(),
    profit_percentage_max: robot.profit_percentage_max.toString(),
    profit_period_days: robot.profit_period_days.toString(),
    lock_period_days: robot.lock_period_days.toString(),
    min_investment: robot.min_investment.toString(),
    max_investment: robot.max_investment?.toString() || '',
    is_active: robot.is_active,
  });
  setIsDialogOpen(true);
};
```

**Função handleSubmit atualizada:**
```typescript
const handleSubmit = async () => {
  // ... validações existentes ...

  setIsSubmitting(true);

  const robotData = {
    name: formData.name,
    description: formData.description || null,
    cryptocurrency_id: formData.selected_cryptocurrencies[0] || null, // Mantém compatibilidade
    profit_percentage_min: parseFloat(formData.profit_percentage_min),
    profit_percentage_max: parseFloat(formData.profit_percentage_max),
    profit_period_days: parseInt(formData.profit_period_days),
    lock_period_days: parseInt(formData.lock_period_days),
    min_investment: parseFloat(formData.min_investment),
    max_investment: formData.max_investment ? parseFloat(formData.max_investment) : null,
    is_active: formData.is_active,
  };

  try {
    let robotId: string;
    
    if (editingRobot) {
      // Update existing robot
      const { error } = await supabase
        .from('robots')
        .update(robotData)
        .eq('id', editingRobot.id);
      if (error) throw error;
      robotId = editingRobot.id;
      
      // Remove criptomoedas antigas
      await supabase
        .from('robot_cryptocurrencies')
        .delete()
        .eq('robot_id', robotId);
    } else {
      // Create new robot
      const { data, error } = await supabase
        .from('robots')
        .insert(robotData)
        .select('id')
        .single();
      if (error) throw error;
      robotId = data.id;
    }
    
    // Inserir novas criptomoedas
    if (formData.selected_cryptocurrencies.length > 0) {
      const { error: cryptoError } = await supabase
        .from('robot_cryptocurrencies')
        .insert(
          formData.selected_cryptocurrencies.map(cryptoId => ({
            robot_id: robotId,
            cryptocurrency_id: cryptoId,
          }))
        );
      if (cryptoError) throw cryptoError;
    }

    // ... resto do código (audit log, toast, etc) ...
  } catch (error) {
    // ... tratamento de erro ...
  }
};
```

**Função fetchData atualizada:**
```typescript
const fetchData = async () => {
  const { data: robotsData } = await supabase
    .from('robots')
    .select(`
      *,
      cryptocurrency:cryptocurrencies(symbol, name),
      robot_cryptocurrencies(
        cryptocurrency_id,
        cryptocurrency:cryptocurrencies(symbol, name)
      )
    `)
    .order('created_at', { ascending: false });

  // ... resto do código ...
};
```

**Exibição no Card do Robô:**
```typescript
// Ao exibir as moedas no card
const getCryptoSymbols = (robot: Robot) => {
  if (robot.robot_cryptocurrencies && robot.robot_cryptocurrencies.length > 0) {
    return robot.robot_cryptocurrencies
      .map(rc => rc.cryptocurrency.symbol)
      .join(', ');
  }
  return robot.cryptocurrency?.symbol || '-';
};
```

### 3. Alterações no Robots.tsx (Visão do Usuário)

Atualizar a interface e exibição para mostrar múltiplas moedas:

```typescript
interface Robot {
  id: string;
  name: string;
  // ... outros campos ...
  cryptocurrency: { symbol: string; name: string } | null;
  robot_cryptocurrencies?: Array<{
    cryptocurrency: { symbol: string; name: string };
  }>;
}

// Função para exibir símbolos
const getCryptoDisplay = (robot: Robot) => {
  if (robot.robot_cryptocurrencies && robot.robot_cryptocurrencies.length > 0) {
    const symbols = robot.robot_cryptocurrencies.map(rc => rc.cryptocurrency.symbol);
    if (symbols.length <= 3) {
      return symbols.join(' / ');
    }
    return `${symbols.slice(0, 3).join(' / ')} +${symbols.length - 3}`;
  }
  return robot.cryptocurrency?.symbol || 'Multi';
};
```

---

## Resumo das Alterações

| Arquivo | Alterações |
|---------|-----------|
| Migração SQL | Criar tabela robot_cryptocurrencies e migrar dados |
| src/pages/admin/AdminRobots.tsx | Checkboxes para múltipla seleção, salvar relações |
| src/pages/Robots.tsx | Exibir múltiplas moedas no card |
| src/pages/Investments.tsx | Exibir múltiplas moedas (se aplicável) |

### Fluxo

```text
Admin edita/cria robô
        |
        v
+----------------------------------+
| Criptomoedas:                    |
| [x] BTC - Bitcoin                |
| [x] ETH - Ethereum               |
| [ ] BNB - Binance Coin           |
| [x] SOL - Solana                 |
+----------------------------------+
        |
        v
Salva na tabela robot_cryptocurrencies
(robot_id, cryptocurrency_id)
        |
        v
Usuário vê no card:
"BTC / ETH / SOL"
```

### Considerações

1. **Retrocompatibilidade**: O campo cryptocurrency_id na tabela robots é mantido (preenchido com a primeira moeda selecionada)
2. **Migração**: Dados existentes serão migrados automaticamente para a nova tabela
3. **Exibição**: Se houver mais de 3 moedas, mostra "BTC / ETH / SOL +2"
4. **RLS**: Todos podem ver as criptomoedas dos robôs, apenas admins podem gerenciar

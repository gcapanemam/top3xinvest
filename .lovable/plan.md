

# Plano: Rentabilidade com Range (Min - Max)

## Visao Geral

Alterar o campo de rentabilidade do robo de um valor unico para um intervalo com dois campos (minimo e maximo). No painel do admin serao exibidos dois campos de input, e para os usuarios sera exibido no formato "0.55 - 1.15%".

---

## Alteracao Visual

### Painel Admin (Formulario)
```text
Rentabilidade (%) *
+--------+    +--------+
|  0,55  |  - |  1,15  |
+--------+    +--------+
  Min           Max
```

### Visao do Usuario (Card do Robo)
```text
+----------------------------------+
|        Rentabilidade             |
|       0.55 - 1.15%               |
|        / 30 dias                 |
+----------------------------------+
```

---

## Secao Tecnica

### 1. Alteracao no Banco de Dados

Renomear o campo existente e adicionar novo campo:

```sql
-- Renomear campo existente para min
ALTER TABLE robots RENAME COLUMN profit_percentage TO profit_percentage_min;

-- Adicionar campo max (inicialmente igual ao min)
ALTER TABLE robots 
ADD COLUMN profit_percentage_max NUMERIC NOT NULL DEFAULT 0;

-- Atualizar valores existentes (max = min para robos existentes)
UPDATE robots SET profit_percentage_max = profit_percentage_min;
```

### 2. Alteracoes no AdminRobots.tsx

**Interface Robot:**
```typescript
interface Robot {
  id: string;
  name: string;
  description: string | null;
  cryptocurrency_id: string | null;
  profit_percentage_min: number;  // Novo
  profit_percentage_max: number;  // Novo
  profit_period_days: number;
  lock_period_days: number;
  min_investment: number;
  max_investment: number | null;
  is_active: boolean;
  cryptocurrency?: { symbol: string; name: string } | null;
}
```

**Estado do Formulario:**
```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  cryptocurrency_id: '',
  profit_percentage_min: '',  // Novo
  profit_percentage_max: '',  // Novo
  profit_period_days: '30',
  lock_period_days: '7',
  min_investment: '100',
  max_investment: '',
  is_active: true,
});
```

**Campos do Formulario (substituir o campo unico):**
```typescript
<div className="space-y-2">
  <Label className="text-gray-300">Rentabilidade (%) *</Label>
  <div className="flex items-center gap-2">
    <Input
      type="number"
      step="0.01"
      value={formData.profit_percentage_min}
      onChange={(e) => setFormData({ ...formData, profit_percentage_min: e.target.value })}
      placeholder="Min"
      className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
    />
    <span className="text-gray-400">-</span>
    <Input
      type="number"
      step="0.01"
      value={formData.profit_percentage_max}
      onChange={(e) => setFormData({ ...formData, profit_percentage_max: e.target.value })}
      placeholder="Max"
      className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
    />
  </div>
</div>
```

**Funcoes openEditDialog e handleSubmit:**
```typescript
// openEditDialog
setFormData({
  ...
  profit_percentage_min: robot.profit_percentage_min.toString(),
  profit_percentage_max: robot.profit_percentage_max.toString(),
  ...
});

// handleSubmit
const robotData = {
  ...
  profit_percentage_min: parseFloat(formData.profit_percentage_min),
  profit_percentage_max: parseFloat(formData.profit_percentage_max),
  ...
};
```

### 3. Alteracoes no Robots.tsx (Visao Usuario)

**Interface Robot:**
```typescript
interface Robot {
  id: string;
  name: string;
  description: string | null;
  profit_percentage_min: number;  // Novo
  profit_percentage_max: number;  // Novo
  profit_period_days: number;
  lock_period_days: number;
  min_investment: number;
  max_investment: number | null;
  is_active: boolean;
  cryptocurrency: {
    symbol: string;
    name: string;
  } | null;
}
```

**Exibicao no Card:**
```typescript
{/* Profitability highlight */}
<div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-4 shadow-lg shadow-green-500/25">
  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
    <TrendingUp className="h-5 w-5 text-white" />
  </div>
  <div>
    <p className="text-sm text-white/80">Rentabilidade</p>
    <p className="text-xl font-bold text-white">
      {robot.profit_percentage_min} - {robot.profit_percentage_max}% 
      <span className="text-sm font-normal"> / {robot.profit_period_days} dias</span>
    </p>
  </div>
  <Sparkles className="ml-auto h-5 w-5 text-white/60 animate-pulse" />
</div>
```

**Dialog de Investimento (exibicao):**
```typescript
<div className="bg-[#0a0f14] p-3 rounded-lg">
  <p className="text-xs text-gray-500">Rentabilidade</p>
  <p className="text-lg font-bold text-green-400">
    {selectedRobot?.profit_percentage_min} - {selectedRobot?.profit_percentage_max}% / {selectedRobot?.profit_period_days} dias
  </p>
</div>
```

---

## Resumo das Alteracoes

| Arquivo | Alteracoes |
|---------|-----------|
| Migracao SQL | Renomear campo e adicionar novo campo max |
| src/pages/admin/AdminRobots.tsx | Dois campos de input para min/max |
| src/pages/Robots.tsx | Exibir range "X - Y%" |
| src/integrations/supabase/types.ts | Atualizado automaticamente |

### Fluxo

```text
Admin cria/edita robo
        |
        v
+---------------------------+
| Rentabilidade (%):        |
| [0.55] - [1.15]           |
+---------------------------+
        |
        v
Salvo no banco com min e max
        |
        v
Usuario ve no card:
"0.55 - 1.15% / 30 dias"
```

### Consideracoes

1. **Robos existentes**: Terao min = max (valor anterior)
2. **Validacao**: Max deve ser >= Min
3. **Exibicao**: Se min == max, pode exibir apenas um valor
4. **Geracao de operacoes**: Usa o range configurado no auto-generate



# Plano: Configuracao de Percentuais de Comissao MLM

## Visao Geral

Permitir que o admin edite os percentuais de comissao de cada nivel do sistema MLM. Atualmente os valores estao fixos no codigo (100%, 50%, 25%, 10%). Com esta funcionalidade, o admin podera alterar esses valores diretamente pelo painel.

---

## Como Vai Funcionar

### Interface Visual

```text
+--------------------------------------------------+
| Rede MLM                                         |
+--------------------------------------------------+
| [Icone Engrenagem] Configurar Comissoes          |
+--------------------------------------------------+
|                                                  |
| +----------------------------------------------+ |
| | CONFIGURACOES DE COMISSAO              [X]   | |
| +----------------------------------------------+ |
| | Configure os percentuais de cada nivel:      | |
| |                                              | |
| | Nivel 1 (Indicacao Direta):                  | |
| | [====100====]  100%                          | |
| |                                              | |
| | Nivel 2:                                     | |
| | [=====50====]  50%                           | |
| |                                              | |
| | Nivel 3:                                     | |
| | [=====25====]  25%                           | |
| |                                              | |
| | Nivel 4:                                     | |
| | [=====10====]  10%                           | |
| |                                              | |
| +----------------------------------------------+ |
| | [Cancelar]            [Salvar Alteracoes]    | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

---

## Secao Tecnica

### 1. Nova Tabela: mlm_settings

Criar tabela para armazenar as configuracoes de comissao:

```sql
CREATE TABLE public.mlm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL UNIQUE CHECK (level >= 1 AND level <= 4),
  commission_percentage NUMERIC NOT NULL DEFAULT 0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Inserir valores padrao
INSERT INTO mlm_settings (level, commission_percentage) VALUES 
  (1, 100),
  (2, 50),
  (3, 25),
  (4, 10);

-- RLS: Todos podem ver, apenas admins podem editar
ALTER TABLE mlm_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view MLM settings"
ON mlm_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update MLM settings"
ON mlm_settings FOR UPDATE
USING (is_admin());
```

### 2. Atualizar Funcao de Distribuicao

Modificar a funcao `distribute_investment_profit` para ler os percentuais da tabela:

```sql
CREATE OR REPLACE FUNCTION public.distribute_investment_profit(
    p_investment_id uuid,
    p_profit_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_investor_id uuid;
    v_upline_user_id uuid;
    v_upline_level integer;
    v_commission_percentage numeric;
    v_commission_amount numeric;
BEGIN
    -- Buscar o investidor
    SELECT user_id INTO v_investor_id
    FROM public.investments
    WHERE id = p_investment_id;
    
    IF v_investor_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar o lucro acumulado do investimento
    UPDATE public.investments
    SET profit_accumulated = profit_accumulated + p_profit_amount,
        updated_at = now()
    WHERE id = p_investment_id;
    
    -- Distribuir comissoes para a upline
    FOR v_upline_user_id, v_upline_level IN 
        SELECT get_user_upline.user_id, get_user_upline.level FROM public.get_user_upline(v_investor_id)
    LOOP
        -- Buscar percentual da tabela mlm_settings
        SELECT commission_percentage INTO v_commission_percentage
        FROM public.mlm_settings
        WHERE level = v_upline_level;
        
        -- Fallback para valores padrao se nao encontrar
        IF v_commission_percentage IS NULL THEN
            v_commission_percentage := CASE v_upline_level
                WHEN 1 THEN 100
                WHEN 2 THEN 50
                WHEN 3 THEN 25
                WHEN 4 THEN 10
                ELSE 0
            END;
        END IF;
        
        -- Calcular valor da comissao
        v_commission_amount := (p_profit_amount * v_commission_percentage) / 100;
        
        IF v_commission_amount > 0 THEN
            -- Inserir registro de comissao
            INSERT INTO public.referral_commissions 
                (user_id, from_user_id, investment_id, level, percentage, amount)
            VALUES 
                (v_upline_user_id, v_investor_id, p_investment_id, 
                 v_upline_level, v_commission_percentage, v_commission_amount);
            
            -- Atualizar saldo do usuario
            UPDATE public.profiles
            SET balance = balance + v_commission_amount,
                updated_at = now()
            WHERE user_id = v_upline_user_id;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$;
```

### 3. Alteracoes no AdminMLM.tsx

**Novos estados:**

```typescript
const [showSettingsDialog, setShowSettingsDialog] = useState(false);
const [commissionSettings, setCommissionSettings] = useState<CommissionSetting[]>([]);
const [isSavingSettings, setIsSavingSettings] = useState(false);

interface CommissionSetting {
  id: string;
  level: number;
  commission_percentage: number;
}
```

**Query para buscar configuracoes:**

```typescript
const { data: mlmSettings = [], refetch: refetchSettings } = useQuery({
  queryKey: ['mlm-settings'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('mlm_settings')
      .select('*')
      .order('level');
    
    if (error) throw error;
    return data as CommissionSetting[];
  },
});

// Atualizar LEVEL_CONFIG dinamicamente
const getLevelConfig = () => {
  return [1, 2, 3, 4].map((level) => {
    const setting = mlmSettings.find((s) => s.level === level);
    const percentage = setting?.commission_percentage ?? [100, 50, 25, 10][level - 1];
    
    const colors = {
      1: { color: 'amber', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' },
      2: { color: 'green', bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/30' },
      3: { color: 'cyan', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/30' },
      4: { color: 'purple', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', borderColor: 'border-purple-500/30' },
    };
    
    return { level, percentage, ...colors[level as 1|2|3|4] };
  });
};
```

**Funcao para salvar configuracoes:**

```typescript
const handleSaveSettings = async () => {
  setIsSavingSettings(true);
  
  try {
    for (const setting of commissionSettings) {
      const { error } = await supabase
        .from('mlm_settings')
        .update({ 
          commission_percentage: setting.commission_percentage,
          updated_at: new Date().toISOString(),
        })
        .eq('level', setting.level);
      
      if (error) throw error;
    }
    
    // Registrar log de auditoria
    await createAuditLog({
      action: 'mlm_settings_updated',
      entityType: 'mlm_settings',
      details: {
        levels: commissionSettings.map(s => ({
          level: s.level,
          percentage: s.commission_percentage,
        })),
      },
    });
    
    toast({ title: 'Configuracoes salvas!' });
    refetchSettings();
    setShowSettingsDialog(false);
  } catch (error: any) {
    toast({
      title: 'Erro',
      description: error.message,
      variant: 'destructive',
    });
  } finally {
    setIsSavingSettings(false);
  }
};
```

### 4. Interface do Dialog de Configuracoes

```typescript
<Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
  <DialogContent className="bg-[#111820] border-[#1e2a3a] text-white">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-teal-400" />
        Configurar Comissoes MLM
      </DialogTitle>
      <DialogDescription className="text-gray-400">
        Defina os percentuais de comissao para cada nivel da rede
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-6 py-4">
      {commissionSettings.map((setting, index) => (
        <div key={setting.level} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-white">
              Nivel {setting.level}
              {setting.level === 1 && (
                <span className="text-gray-400 text-xs ml-2">(Indicacao Direta)</span>
              )}
            </Label>
            <span className="text-teal-400 font-bold">
              {setting.commission_percentage}%
            </span>
          </div>
          <Slider
            value={[setting.commission_percentage]}
            onValueChange={(value) => {
              const updated = [...commissionSettings];
              updated[index] = { ...setting, commission_percentage: value[0] };
              setCommissionSettings(updated);
            }}
            max={100}
            min={0}
            step={5}
            className="w-full"
          />
        </div>
      ))}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
        Cancelar
      </Button>
      <Button 
        onClick={handleSaveSettings}
        disabled={isSavingSettings}
        className="bg-gradient-to-r from-teal-500 to-cyan-500"
      >
        {isSavingSettings ? 'Salvando...' : 'Salvar Alteracoes'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 5. Botao no Header da Pagina

```typescript
<div className="flex items-center gap-3 mb-2">
  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500">
    <Network className="h-5 w-5 text-white" />
  </div>
  <h1 className="text-2xl font-bold text-white">Rede MLM</h1>
  
  {/* Botao de configuracoes */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => {
      setCommissionSettings([...mlmSettings]);
      setShowSettingsDialog(true);
    }}
    className="ml-auto border-[#1e2a3a] text-gray-400 hover:text-white"
  >
    <Settings className="h-4 w-4 mr-2" />
    Configurar Comissoes
  </Button>
</div>
```

### 6. Atualizar Tipos de Auditoria

Adicionar novo tipo de acao na lib de auditoria:

```typescript
// src/lib/auditLog.ts
type ActionType = 
  // ... acoes existentes
  | 'mlm_settings_updated';

type EntityType = 
  // ... tipos existentes
  | 'mlm_settings';
```

---

### Resumo das Alteracoes

| Arquivo | Alteracoes |
|---------|-----------|
| Migracao SQL | Criar tabela mlm_settings e atualizar funcao |
| src/pages/admin/AdminMLM.tsx | Adicionar dialog de configuracao |
| src/lib/auditLog.ts | Adicionar novos tipos de acao |

### Fluxo do Admin

```text
Pagina Rede MLM
       |
       v
Clica em [Configurar Comissoes]
       |
       v
+----------------------------------+
| Dialog de Configuracao           |
+----------------------------------+
| Nivel 1: [=====] 100%            |
| Nivel 2: [=====] 50%             |
| Nivel 3: [=====] 25%             |
| Nivel 4: [=====] 10%             |
+----------------------------------+
| [Cancelar] [Salvar Alteracoes]   |
+----------------------------------+
       |
       v
- Salva na tabela mlm_settings
- Registra log de auditoria
- Proximas distribuicoes usam novos valores
```

### Consideracoes

1. **Retroatividade**: Alteracoes afetam apenas distribuicoes futuras
2. **Historico**: Comissoes ja pagas mantem o percentual original (registrado em referral_commissions)
3. **Auditoria**: Todas alteracoes sao registradas com detalhes
4. **Fallback**: Se a tabela nao existir, usa valores padrao
5. **Validacao**: Percentuais limitados entre 0% e 100%

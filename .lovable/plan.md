

# Plano: Implementar Botao "Investir Agora"

## Visao Geral

O botao "Investir Agora" na pagina de robos atualmente nao possui nenhuma funcionalidade. Sera implementado um fluxo completo de investimento que:

1. Abre um Dialog para o usuario inserir o valor do investimento
2. Valida o valor contra os limites do robo (minimo/maximo)
3. Verifica se o usuario tem saldo suficiente
4. Cria o investimento na tabela `investments`
5. Deduz o valor do saldo do usuario em `profiles`
6. Exibe feedback de sucesso e redireciona para a pagina de investimentos

## Fluxo do Usuario

```text
Usuario clica "Investir Agora"
        |
        v
Dialog abre com informacoes do robo
        |
        v
Usuario digita valor do investimento
        |
        v
Sistema valida:
  - Valor >= investimento minimo
  - Valor <= investimento maximo (se existir)
  - Usuario tem saldo suficiente
        |
        v
Sistema cria investimento no banco:
  - Insere na tabela `investments`
  - Atualiza saldo em `profiles`
        |
        v
Exibe toast de sucesso
        |
        v
Redireciona para /investments
```

## Interface do Dialog

```text
+------------------------------------------+
|  Investir no Robo "Teste"           [X]  |
|                                          |
|  Rentabilidade: 5% / 30 dias             |
|  Periodo de Lock: 7 dias                 |
|                                          |
|  Seu saldo: R$ 1.500,00                  |
|                                          |
|  Valor do investimento:                  |
|  R$ [__________________]                 |
|                                          |
|  Min: R$ 100,00 | Max: R$ 10.000,00      |
|                                          |
|  [Cancelar]  [Confirmar Investimento]    |
+------------------------------------------+
```

---

## Secao Tecnica

### Arquivo a Modificar

| Arquivo | Acao |
|---------|------|
| src/pages/Robots.tsx | Adicionar dialog e logica de investimento |

### 1. Novos Imports

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
```

### 2. Novos Estados

```typescript
const { user } = useAuth();
const navigate = useNavigate();
const { toast } = useToast();

// Estado do dialog de investimento
const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
const [investmentAmount, setInvestmentAmount] = useState<string>('');
const [isInvesting, setIsInvesting] = useState(false);
const [userBalance, setUserBalance] = useState<number>(0);
```

### 3. Buscar Saldo do Usuario

```typescript
useEffect(() => {
  if (user) {
    fetchUserBalance();
  }
}, [user]);

const fetchUserBalance = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('balance')
    .eq('user_id', user!.id)
    .single();
  
  if (data) {
    setUserBalance(data.balance);
  }
};
```

### 4. Handler de Investimento

```typescript
const handleInvest = async () => {
  if (!selectedRobot || !user || !investmentAmount) return;
  
  setIsInvesting(true);
  
  const amount = parseFloat(investmentAmount.replace(',', '.'));
  
  // Validacoes
  if (isNaN(amount) || amount <= 0) {
    toast({
      title: 'Erro',
      description: 'Digite um valor valido',
      variant: 'destructive',
    });
    setIsInvesting(false);
    return;
  }
  
  if (amount < selectedRobot.min_investment) {
    toast({
      title: 'Erro',
      description: `O investimento minimo e ${formatCurrency(selectedRobot.min_investment)}`,
      variant: 'destructive',
    });
    setIsInvesting(false);
    return;
  }
  
  if (selectedRobot.max_investment && amount > selectedRobot.max_investment) {
    toast({
      title: 'Erro',
      description: `O investimento maximo e ${formatCurrency(selectedRobot.max_investment)}`,
      variant: 'destructive',
    });
    setIsInvesting(false);
    return;
  }
  
  if (amount > userBalance) {
    toast({
      title: 'Saldo insuficiente',
      description: 'Voce nao tem saldo suficiente para este investimento',
      variant: 'destructive',
    });
    setIsInvesting(false);
    return;
  }
  
  // Calcular data de liberacao
  const lockUntil = addDays(new Date(), selectedRobot.lock_period_days);
  
  // Criar investimento
  const { error: investError } = await supabase
    .from('investments')
    .insert({
      user_id: user.id,
      robot_id: selectedRobot.id,
      amount: amount,
      lock_until: lockUntil.toISOString(),
      status: 'active',
    });
  
  if (investError) {
    toast({
      title: 'Erro',
      description: 'Nao foi possivel criar o investimento',
      variant: 'destructive',
    });
    setIsInvesting(false);
    return;
  }
  
  // Atualizar saldo do usuario
  const { error: balanceError } = await supabase
    .from('profiles')
    .update({ balance: userBalance - amount })
    .eq('user_id', user.id);
  
  if (balanceError) {
    toast({
      title: 'Aviso',
      description: 'Investimento criado mas houve erro ao atualizar saldo',
      variant: 'destructive',
    });
    setIsInvesting(false);
    return;
  }
  
  toast({
    title: 'Investimento realizado!',
    description: `Voce investiu ${formatCurrency(amount)} no robo ${selectedRobot.name}`,
  });
  
  setSelectedRobot(null);
  setInvestmentAmount('');
  setIsInvesting(false);
  
  // Redirecionar para pagina de investimentos
  navigate('/investments');
};
```

### 5. Atualizar onClick do Botao

```tsx
<button 
  onClick={() => {
    setSelectedRobot(robot);
    setInvestmentAmount(robot.min_investment.toString());
  }}
  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500..."
>
  <Sparkles className="h-4 w-4" />
  Investir Agora
</button>
```

### 6. Dialog de Investimento

```tsx
<Dialog open={!!selectedRobot} onOpenChange={() => { setSelectedRobot(null); setInvestmentAmount(''); }}>
  <DialogContent className="bg-[#111820] border-[#1e2a3a]">
    <DialogHeader>
      <DialogTitle className="text-white flex items-center gap-2">
        <Bot className="h-5 w-5 text-teal-400" />
        Investir em {selectedRobot?.name}
      </DialogTitle>
      <DialogDescription className="text-gray-400">
        Configure o valor do seu investimento
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      {/* Info do robo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0a0f14] p-3 rounded-lg">
          <p className="text-xs text-gray-500">Rentabilidade</p>
          <p className="text-lg font-bold text-green-400">
            {selectedRobot?.profit_percentage}% / {selectedRobot?.profit_period_days} dias
          </p>
        </div>
        <div className="bg-[#0a0f14] p-3 rounded-lg">
          <p className="text-xs text-gray-500">Periodo Lock</p>
          <p className="text-lg font-bold text-white">{selectedRobot?.lock_period_days} dias</p>
        </div>
      </div>
      
      {/* Saldo do usuario */}
      <div className="flex items-center justify-between p-3 bg-[#0a0f14] rounded-lg">
        <span className="text-gray-400">Seu saldo disponivel</span>
        <span className="text-xl font-bold text-white">{formatCurrency(userBalance)}</span>
      </div>
      
      {/* Input de valor */}
      <div className="space-y-2">
        <Label className="text-gray-300">Valor do investimento</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
          <Input
            type="text"
            placeholder="0,00"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(e.target.value)}
            className="pl-10 bg-[#0a0f14] border-[#1e2a3a] text-white text-lg"
          />
        </div>
        <p className="text-xs text-gray-500">
          Min: {formatCurrency(selectedRobot?.min_investment || 0)}
          {selectedRobot?.max_investment && ` | Max: ${formatCurrency(selectedRobot.max_investment)}`}
        </p>
      </div>
    </div>
    
    <DialogFooter>
      <Button 
        variant="outline" 
        onClick={() => setSelectedRobot(null)}
        className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a]"
      >
        Cancelar
      </Button>
      <button
        onClick={handleInvest}
        disabled={isInvesting || !investmentAmount}
        className="h-10 px-6 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium flex items-center gap-2 disabled:opacity-50"
      >
        {isInvesting ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processando...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Confirmar Investimento
          </>
        )}
      </button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Validacoes Implementadas

| Validacao | Mensagem de Erro |
|-----------|------------------|
| Valor vazio ou invalido | "Digite um valor valido" |
| Valor abaixo do minimo | "O investimento minimo e R$ X" |
| Valor acima do maximo | "O investimento maximo e R$ X" |
| Saldo insuficiente | "Voce nao tem saldo suficiente" |

### Seguranca

- Verificacao de usuario autenticado antes de permitir investimento
- Validacao de valores no frontend (e RLS policies no backend)
- Atualizacao atomica de saldo (poderia usar uma transacao/RPC para maior seguranca)

### Melhorias Futuras Sugeridas

1. Criar uma RPC no banco que faca a criacao do investimento e deducao de saldo atomicamente
2. Adicionar registro na tabela `transactions` para auditoria
3. Disparar comissoes de indicacao (se existir logica de MLM)


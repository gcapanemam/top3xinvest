
# Plano: Sistema de Status Ativo/Inativo para Usuários

## Objetivo
Implementar um sistema onde usuários novos começam com status "inativo" e só podem indicar pessoas para a rede MLM após ativar pelo menos um robô de investimento.

---

## Regras de Negócio

1. **Cadastro**: Usuário é criado com status `is_active = false`
2. **Ativação**: Ao investir em qualquer robô pela primeira vez, status muda para `is_active = true`
3. **Indicação**: Apenas usuários ativos podem ter seu código de referral válido para indicar novos membros

---

## Alterações Necessárias

### 1. Banco de Dados

| Ação | Descrição |
|------|-----------|
| Adicionar coluna | `is_active BOOLEAN DEFAULT false` na tabela `profiles` |
| Criar trigger | Atualizar `is_active = true` quando usuário criar primeiro investimento |
| Modificar função | `process_referral` para validar se o referrer está ativo |

**SQL Migration:**
```sql
-- Adicionar coluna is_active
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- Atualizar usuários existentes com investimentos para ativo
UPDATE public.profiles SET is_active = true 
WHERE user_id IN (SELECT DISTINCT user_id FROM public.investments);

-- Trigger para ativar usuário no primeiro investimento
CREATE OR REPLACE FUNCTION public.activate_user_on_investment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET is_active = true, updated_at = now()
  WHERE user_id = NEW.user_id AND is_active = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_activate_user_on_investment
AFTER INSERT ON public.investments
FOR EACH ROW EXECUTE FUNCTION public.activate_user_on_investment();

-- Atualizar process_referral para validar referrer ativo
CREATE OR REPLACE FUNCTION public.process_referral(
    new_user_id UUID,
    referrer_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    referrer_user_id UUID;
    referrer_is_active BOOLEAN;
BEGIN
    -- Encontrar o usuário que fez a indicação e verificar se está ativo
    SELECT user_id, is_active INTO referrer_user_id, referrer_is_active
    FROM public.profiles 
    WHERE referral_code = upper(referrer_code);
    
    IF referrer_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se o referrer está ativo
    IF referrer_is_active IS NOT TRUE THEN
        RETURN FALSE;
    END IF;
    
    -- Evitar auto-indicação
    IF referrer_user_id = new_user_id THEN
        RETURN FALSE;
    END IF;
    
    -- Inserir a indicação
    INSERT INTO public.referrals (user_id, referrer_id, referral_code, level)
    VALUES (new_user_id, referrer_user_id, upper(referrer_code), 1);
    
    RETURN TRUE;
EXCEPTION
    WHEN unique_violation THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

### 2. Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/Dashboard.tsx` | Modificar | Ocultar/desabilitar link de indicação se usuário inativo |
| `src/pages/MLMNetwork.tsx` | Modificar | Mostrar aviso para usuários inativos |

---

## Interface do Usuário

### Dashboard - Usuário Inativo
O card de link de indicação mostrará um aviso em vez do link:

```text
┌───────────────────────────────────────────────────────┐
│ 🔒 Ative sua conta para indicar                       │
│                                                       │
│ Para compartilhar seu link de indicação e começar     │
│ a ganhar comissões, ative pelo menos um robô.         │
│                                                       │
│                           [Ver Robôs]                 │
└───────────────────────────────────────────────────────┘
```

### Dashboard - Usuário Ativo
Continua igual (mostra o link de indicação normalmente)

### Página Minha Rede - Usuário Inativo
Mostra banner de aviso no topo:

```text
┌───────────────────────────────────────────────────────┐
│ ⚠️ Conta Inativa                                      │
│                                                       │
│ Seu link de indicação ainda não está ativo. Para      │
│ começar a indicar pessoas, invista em pelo menos      │
│ um robô.                                [Ver Robôs]   │
└───────────────────────────────────────────────────────┘
```

---

## Fluxo do Sistema

```text
1. Usuário se cadastra
       |
       v
2. Profile criado com is_active = false
       |
       v
3. Usuário tenta compartilhar link?
       |
       ├── Sim, mas inativo → Mostra aviso "Ative um robô"
       |
       v
4. Usuário investe em robô
       |
       v
5. Trigger ativa is_active = true
       |
       v
6. Link de indicação liberado!
       |
       v
7. Novos usuários podem usar o código
```

---

## Detalhes Técnicos

### Dashboard.tsx
- Buscar campo `is_active` junto com o profile
- Renderizar card diferente baseado no status:
  - Se `is_active = true`: mostra link de indicação
  - Se `is_active = false`: mostra card com aviso e botão para robôs

### MLMNetwork.tsx
- Verificar `is_active` do profile
- Se inativo, mostrar banner de alerta no topo da página
- Desabilitar botões de copiar/compartilhar link

### Auth.tsx (indicação)
- A validação já acontece no banco via `process_referral`
- Se o referrer estiver inativo, a indicação simplesmente não é processada
- Não precisa mostrar erro ao novo usuário (ele apenas não será vinculado)

---

## Segurança

- A validação principal ocorre no **banco de dados** via função `process_referral`
- Mesmo que o frontend seja manipulado, a indicação não será processada
- O trigger garante que a ativação aconteça automaticamente
- Apenas admins podem alterar o status diretamente

---

## Resultado Esperado

1. Novos usuários começam com status inativo
2. O link de indicação aparece bloqueado no dashboard e página de rede
3. Ao investir pela primeira vez, usuário é ativado automaticamente
4. Após ativação, pode indicar normalmente
5. Usuários existentes com investimentos são migrados como ativos

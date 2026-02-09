

# Plano: Botao Ocultar Robo no Admin

## Resumo
Adicionar um botao "Ocultar" na lista de robos do admin que seta `is_active = false`. Na pagina de usuarios (Robots.tsx), o robo oculto so aparece se o usuario ja tem investimento ativo nele.

## Mudancas

### 1. `src/pages/admin/AdminRobots.tsx`
- Adicionar icone `EyeOff` / `Eye` dos imports do lucide-react
- Adicionar funcao `toggleRobotVisibility(robot)` que faz toggle de `is_active` no banco e registra audit log
- Adicionar botao de olho entre os botoes de acao de cada robo (ao lado do Edit), com icone `Eye` quando ativo e `EyeOff` quando oculto
- Cor amarela/laranja para indicar estado oculto

### 2. `src/pages/Robots.tsx`
- Alterar a query para buscar tambem robos inativos (`is_active = false`)
- Buscar investimentos ativos do usuario para saber em quais robos ele ja tem investimento
- Filtrar: mostrar robos ativos normalmente + robos inativos somente se o usuario tiver investimento ativo neles
- No card do robo oculto (com investimento), esconder o botao "Investir Agora" e mostrar badge "Encerrado para novos aportes"

## Detalhes Tecnicos

### toggleRobotVisibility (AdminRobots.tsx)
```typescript
const toggleRobotVisibility = async (robot: Robot) => {
  const newStatus = !robot.is_active;
  const { error } = await supabase
    .from('robots')
    .update({ is_active: newStatus })
    .eq('id', robot.id);
  
  if (!error) {
    await createAuditLog({
      action: newStatus ? 'robot_activated' : 'robot_hidden',
      entityType: 'robot',
      entityId: robot.id,
      details: { robot_name: robot.name },
    });
    fetchData();
  }
};
```

### Filtro no Robots.tsx (usuario)
```typescript
// Buscar todos os robos (ativos e inativos)
const { data: robotsData } = await supabase
  .from('robots')
  .select('*, ...')
  .order('profit_percentage_max', { ascending: false });

// Buscar investimentos ativos do usuario
const { data: userInvestments } = await supabase
  .from('investments')
  .select('robot_id')
  .eq('user_id', user.id)
  .eq('status', 'active');

const activeRobotIds = new Set(userInvestments?.map(i => i.robot_id));

// Filtrar: ativos + inativos com investimento
const filtered = robotsData.filter(r => 
  r.is_active || activeRobotIds.has(r.id)
);
```

### Arquivos modificados
| Arquivo | Mudanca |
|---------|---------|
| `src/pages/admin/AdminRobots.tsx` | Botao toggle visibilidade |
| `src/pages/Robots.tsx` | Filtro de robos ocultos com investimentos |


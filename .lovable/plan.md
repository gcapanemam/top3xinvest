

# Plano: Usar percentuais de comissao configurados pelo admin na pagina de Rede

## Problema
A pagina "Minha Rede" (`src/pages/MLMNetwork.tsx`) usa percentuais de comissao hardcoded no `LEVEL_CONFIG` (100%, 50%, 25%, 10%). Esses valores nao correspondem aos percentuais reais configurados pelo admin na tabela `mlm_settings` (10%, 5%, 3%, 2%).

## Solucao

### Mudancas em `src/pages/MLMNetwork.tsx`

1. **Adicionar query para buscar `mlm_settings`**
   - Buscar os 4 niveis da tabela `mlm_settings` ordenados por `level`
   - Extrair o campo `commission_percentage` de cada nivel

2. **Tornar `LEVEL_CONFIG` dinamico**
   - Manter as cores e estilos no array estatico, mas remover o campo `percentage`
   - Onde o percentual e exibido (linha 507: `{config.percentage}% comissao`), usar o valor vindo de `mlm_settings`

## Detalhes tecnicos

| Mudanca | Descricao |
|---------|-----------|
| Nova query | `useQuery` para buscar `mlm_settings` com `select('level, commission_percentage')` ordenado por `level` |
| Remover percentages hardcoded | Remover campo `percentage` do `LEVEL_CONFIG` |
| Exibir percentual dinamico | Usar dados de `mlm_settings` para mostrar o percentual correto por nivel |

### Query

```typescript
const { data: mlmSettings } = useQuery({
  queryKey: ['mlm-settings'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('mlm_settings')
      .select('level, commission_percentage')
      .order('level');
    if (error) throw error;
    return data;
  },
});
```

### Uso no template

Substituir `config.percentage` por uma funcao que busca o percentual do nivel correspondente nos dados de `mlm_settings`.


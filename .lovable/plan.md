
# Plano: Substituir Sliders por Campos de Input Numérico

## Visão Geral

Alterar o dialog de configuração de comissões MLM para usar campos de input numérico em vez de sliders. Isso permite que o admin digite valores precisos de 0 a 100 para cada nível de comissão.

---

## Alteração Visual

### Antes (Slider)
```text
Nível 1 (Indicação Direta):         100%
[====================|==========]
```

### Depois (Input Numérico)
```text
Nível 1 (Indicação Direta):
+-------+
|  100  | %
+-------+
```

---

## Seção Técnica

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| src/pages/admin/AdminMLM.tsx | Substituir Slider por Input numérico |

### Código Atual (linhas 672-699)

```typescript
<div className="space-y-6 py-4">
  {commissionSettings.map((setting, index) => (
    <div key={setting.level} className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-white">
          Nível {setting.level}
          {setting.level === 1 && (
            <span className="text-gray-400 text-xs ml-2">(Indicação Direta)</span>
          )}
        </Label>
        <span className="text-teal-400 font-bold text-lg">
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
```

### Código Novo

```typescript
<div className="space-y-4 py-4">
  {commissionSettings.map((setting, index) => (
    <div key={setting.level} className="flex items-center justify-between p-4 rounded-lg bg-[#0a0f14] border border-[#1e2a3a]">
      <div>
        <Label className="text-white font-medium">
          Nível {setting.level}
        </Label>
        {setting.level === 1 && (
          <p className="text-gray-400 text-xs mt-0.5">Indicação Direta</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          value={setting.commission_percentage}
          onChange={(e) => {
            let value = parseFloat(e.target.value) || 0;
            // Limitar entre 0 e 100
            value = Math.min(100, Math.max(0, value));
            const updated = [...commissionSettings];
            updated[index] = { ...setting, commission_percentage: value };
            setCommissionSettings(updated);
          }}
          className="w-20 text-center bg-[#111820] border-[#1e2a3a] text-white font-bold"
        />
        <span className="text-teal-400 font-bold">%</span>
      </div>
    </div>
  ))}
</div>
```

### Melhorias Incluídas

1. **Input numérico**: Permite digitar valores de 0 a 100
2. **Validação**: Limita automaticamente os valores entre 0 e 100
3. **Visual melhorado**: Cada nível em um card separado
4. **Feedback visual**: Símbolo de % ao lado do campo

### Resultado Final

```text
+--------------------------------------------------+
| Configurar Comissões MLM                   [X]   |
+--------------------------------------------------+
| Defina os percentuais de comissão                |
+--------------------------------------------------+
|                                                  |
| +----------------------------------------------+ |
| | Nível 1                          [100] %     | |
| | Indicação Direta                             | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | Nível 2                          [ 50] %     | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | Nível 3                          [ 25] %     | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | Nível 4                          [ 10] %     | |
| +----------------------------------------------+ |
|                                                  |
| [Cancelar]              [Salvar Alterações]      |
+--------------------------------------------------+
```

### Considerações

1. O import do `Slider` pode ser removido se não for mais usado
2. O `Input` já está importado no arquivo
3. A validação impede valores fora do range 0-100
4. Aceita valores decimais (ex: 12.5%)

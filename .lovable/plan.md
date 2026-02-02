
# Plano: Adicionar Animacoes de Entrada nos Graficos

## Visao Geral

Adicionar animacoes suaves de entrada nos graficos do dashboard para melhorar a experiencia visual do usuario. O recharts ja possui suporte nativo para animacoes, entao vamos habilitar e configurar essas animacoes.

## Animacoes a Implementar

### 1. Grafico de Area (Fluxo Financeiro Anual)
- Animacao de desenho progressivo das areas
- Duracao de 1.5 segundos
- Easing suave (easeInOutCubic)
- Delay escalonado entre as linhas

### 2. Grafico de Rosca (Investimentos por Robo)
- Animacao de crescimento radial do centro para fora
- Duracao de 1 segundo
- Efeito de "desenrolar" dos segmentos

### 3. Containers dos Graficos
- Animacao fade-in-up nos cards
- Delay escalonado entre os dois graficos
- Classes CSS ja disponiveis no projeto (animate-fade-in-up)

---

## Secao Tecnica

### Arquivo a Modificar

| Arquivo | Acao |
|---------|------|
| src/pages/Dashboard.tsx | Adicionar props de animacao nos graficos |

### 1. Animacao no AreaChart

Adicionar propriedades `isAnimationActive`, `animationDuration`, `animationEasing` e `animationBegin` em cada componente Area:

```tsx
<Area 
  type="monotone" 
  dataKey="investido" 
  name="Investido"
  stroke="#14b8a6" 
  fillOpacity={1}
  fill="url(#colorInvestido)"
  isAnimationActive={true}
  animationDuration={1500}
  animationEasing="ease-in-out"
  animationBegin={0}
/>
<Area 
  type="monotone" 
  dataKey="retornos" 
  name="Retornos"
  stroke="#22c55e" 
  fillOpacity={1}
  fill="url(#colorRetornos)"
  isAnimationActive={true}
  animationDuration={1500}
  animationEasing="ease-in-out"
  animationBegin={200}
/>
<Area 
  type="monotone" 
  dataKey="saques" 
  name="Saques"
  stroke="#f59e0b" 
  fillOpacity={1}
  fill="url(#colorSaques)"
  isAnimationActive={true}
  animationDuration={1500}
  animationEasing="ease-in-out"
  animationBegin={400}
/>
```

### 2. Animacao no PieChart

Adicionar propriedades de animacao no componente Pie:

```tsx
<Pie
  data={robotDistribution}
  cx="50%"
  cy="50%"
  innerRadius={60}
  outerRadius={80}
  paddingAngle={2}
  dataKey="value"
  isAnimationActive={true}
  animationDuration={1000}
  animationEasing="ease-out"
  animationBegin={300}
>
```

### 3. Animacao nos Containers (CSS)

Adicionar classes de animacao nos divs containers dos graficos:

```tsx
{/* Area Chart Container */}
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 lg:col-span-2 animate-fade-in-up">

{/* Pie Chart Container */}
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
```

### 4. Animacao na Legenda do Pie (Lista de Robos)

Adicionar animacao escalonada nos items da legenda:

```tsx
{robotDistribution.map((robot, index) => {
  const total = robotDistribution.reduce((sum, r) => sum + r.value, 0);
  const percentage = total > 0 ? ((robot.value / total) * 100).toFixed(0) : 0;
  return (
    <div 
      key={index} 
      className="flex items-center justify-between animate-fade-in-up"
      style={{ animationDelay: `${(index + 1) * 100}ms` }}
    >
      ...
    </div>
  );
})}
```

### Resumo das Propriedades de Animacao do Recharts

| Propriedade | Descricao | Valor |
|-------------|-----------|-------|
| isAnimationActive | Habilita animacao | true |
| animationDuration | Duracao em ms | 1000-1500 |
| animationEasing | Tipo de easing | "ease-in-out", "ease-out" |
| animationBegin | Delay inicial em ms | 0, 200, 400... |

### Visual Esperado

```text
Carregamento da pagina:
   |
   v (0ms)
[Card Area Chart aparece com fade-in-up]
   |
   v (0-1500ms)
[Linhas do grafico desenham progressivamente]
   - Investido: desenha primeiro (0-1500ms)
   - Retornos: desenha com delay (200-1700ms)
   - Saques: desenha por ultimo (400-1900ms)
   |
   v (150ms)
[Card Pie Chart aparece com fade-in-up]
   |
   v (300-1300ms)
[Segmentos do donut "crescem" do centro]
   |
   v (escalonado)
[Itens da legenda aparecem um a um]
```

### Resultado

Os graficos terao uma entrada suave e profissional que:
- Guia a atencao do usuario
- Cria sensacao de dinamismo
- Melhora a percepcao de performance
- Segue o design system ja existente

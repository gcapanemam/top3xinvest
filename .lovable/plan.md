
# Plano: Melhorar Responsividade do Dashboard

## Visao Geral

Implementar melhorias de responsividade no dashboard para garantir uma experiencia otima em dispositivos moveis, tablets e desktops. Atualmente a sidebar fixa ocupa espaco em telas menores e alguns elementos nao se adaptam bem.

## Problemas Identificados

### 1. Sidebar Fixa em Mobile
- A sidebar usa `fixed left-0` com largura fixa (w-64 ou w-16)
- O conteudo principal tem `pl-64` fixo, causando problemas em mobile
- Nao ha menu hamburger para dispositivos moveis

### 2. Layout do Dashboard
- Cards de estatisticas: grid responsivo ja existe (`md:grid-cols-2 lg:grid-cols-4`)
- Graficos: grid responsivo ja existe (`lg:grid-cols-3`)
- Textos e valores podem ser muito grandes em mobile

### 3. DashboardLayout
- Padding lateral fixo (pl-64) nao considera mobile
- Sem suporte para sidebar colapsavel em mobile

---

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| src/components/layout/DashboardLayout.tsx | Adicionar responsividade ao layout principal |
| src/components/layout/Sidebar.tsx | Transformar em drawer em mobile |
| src/components/layout/Header.tsx | Adicionar botao de menu hamburger |
| src/pages/Dashboard.tsx | Ajustes de tamanho de fonte e espacamento |

---

### 1. DashboardLayout.tsx - Layout Responsivo

Usar o hook `useIsMobile` para detectar dispositivos moveis e ajustar o padding:

```tsx
import { useIsMobile } from '@/hooks/use-mobile';

export const DashboardLayout = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ... resto do codigo

  return (
    <div className="min-h-screen bg-[#0a0f14]">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Overlay para mobile quando sidebar aberta */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className={cn(
        "transition-all duration-300",
        isMobile ? "pl-0" : "pl-64"
      )}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

---

### 2. Sidebar.tsx - Drawer Mobile

Transformar a sidebar em um drawer deslizante em dispositivos moveis:

```tsx
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const isMobile = useIsMobile();
  
  // Em mobile: sidebar comeca fechada e desliza da esquerda
  // Em desktop: sidebar sempre visivel

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#1e2a3a] bg-[#0a0f14] transition-all duration-300',
        // Desktop
        !isMobile && (isCollapsed ? 'w-16' : 'w-64'),
        // Mobile - drawer behavior
        isMobile && 'w-64',
        isMobile && !isOpen && '-translate-x-full'
      )}
    >
      {/* Botao de fechar em mobile */}
      {isMobile && (
        <button 
          onClick={onClose}
          className="absolute right-2 top-4 p-2 text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      
      {/* ... resto do conteudo */}
    </aside>
  );
};
```

---

### 3. Header.tsx - Menu Hamburger

Adicionar botao de menu para dispositivos moveis:

```tsx
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b border-[#1e2a3a] bg-[#0a0f14]/90 px-4 md:px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Menu hamburger em mobile */}
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onMenuClick}
            className="hover:bg-[#111820] text-gray-400"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <h1 className="text-base md:text-lg font-semibold text-white">
          {isAdmin ? 'Painel Admin' : 'Minha Conta'}
        </h1>
      </div>
      
      {/* ... resto do header */}
    </header>
  );
};
```

---

### 4. Dashboard.tsx - Ajustes de Tamanho

Ajustar tamanhos de fonte e espacamento para melhor leitura em mobile:

**Titulo de boas-vindas (linha 234):**
```tsx
<h1 className="text-xl md:text-2xl font-bold text-white">
  Olá, {profile?.full_name || ...}! 👋
</h1>
```

**Cards de estatisticas (linhas 243-298):**
```tsx
{/* Grid responsivo - ja existe, mas melhorar espacamento */}
<div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  
  {/* Dentro de cada card */}
  <div className="text-xl md:text-2xl font-bold text-teal-400">
    {formatCurrency(profile?.balance || 0)}
  </div>
</div>
```

**Secao de graficos (linha 302):**
```tsx
<div className="grid gap-4 md:gap-6 lg:grid-cols-3">
```

**Altura do grafico de area (linha 306):**
```tsx
<div className="h-60 md:h-80">
```

**Acoes rapidas e cotacoes (linha 459):**
```tsx
<div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
```

**Grid de botoes de acao (linha 464):**
```tsx
<div className="grid gap-2 md:gap-3 grid-cols-2">
```

---

### Resumo das Alteracoes

| Componente | Alteracao | Impacto |
|------------|-----------|---------|
| DashboardLayout | Padding responsivo (pl-0 em mobile) | Layout adapta sem sidebar fixa |
| Sidebar | Drawer deslizante em mobile | Mais espaco para conteudo |
| Header | Menu hamburger + altura menor | Navegacao acessivel em mobile |
| Dashboard | Fontes e espacamentos responsivos | Melhor legibilidade |

### Breakpoints Utilizados

| Breakpoint | Largura | Uso |
|------------|---------|-----|
| Default | < 640px | Mobile - sidebar drawer, fontes menores |
| sm | >= 640px | Cards 2 colunas |
| md | >= 768px | Fontes maiores, espacamentos normais |
| lg | >= 1024px | Sidebar fixa, grids completos |

### Comportamento Esperado

```text
MOBILE (< 768px):
+------------------------+
| [≡] Minha Conta  [🔔👤]|
+------------------------+
| [Card 1]               |
| [Card 2]               |
| [Card 3]               |
| [Card 4]               |
+------------------------+
| [Grafico Area]         |
+------------------------+
| [Grafico Pizza]        |
+------------------------+

Ao clicar no menu hamburger:
+--------+---------------+
| SIDEBAR |  (overlay)   |
| ....    |              |
| ....    |              |
+--------+---------------+


TABLET (768px - 1024px):
+------------------------+
| [≡] Minha Conta  [🔔👤]|
+------------------------+
| [Card 1] [Card 2]      |
| [Card 3] [Card 4]      |
+------------------------+
| [Grafico Area]         |
| [Grafico Pizza]        |
+------------------------+


DESKTOP (>= 1024px):
+---------+----------------------------+
| SIDEBAR | Header                     |
|         +----------------------------+
|         | [Card 1][Card 2][Card 3][4]|
|         +----------------------------+
|         | [Grafico Area] [Pizza]     |
+---------+----------------------------+
```

### Acessibilidade

- Menu hamburger tera `aria-label="Abrir menu"`
- Overlay de sidebar tera `aria-hidden="true"`
- Focus trap quando sidebar aberta em mobile
- Botao de fechar com `aria-label="Fechar menu"`

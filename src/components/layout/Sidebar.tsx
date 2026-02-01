import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bot,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  Users,
  Coins,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const userNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Robôs', href: '/robots', icon: Bot },
  { label: 'Meus Investimentos', href: '/investments', icon: Wallet },
  { label: 'Depósitos', href: '/deposits', icon: ArrowDownCircle },
  { label: 'Saques', href: '/withdrawals', icon: ArrowUpCircle },
  { label: 'Notificações', href: '/notifications', icon: Bell },
];

const adminNavItems: NavItem[] = [
  { label: 'Painel Admin', href: '/admin', icon: LayoutDashboard, adminOnly: true },
  { label: 'Gerenciar Robôs', href: '/admin/robots', icon: Bot, adminOnly: true },
  { label: 'Usuários', href: '/admin/users', icon: Users, adminOnly: true },
  { label: 'Depósitos', href: '/admin/deposits', icon: ArrowDownCircle, adminOnly: true },
  { label: 'Saques', href: '/admin/withdrawals', icon: ArrowUpCircle, adminOnly: true },
  { label: 'Cotações', href: '/admin/prices', icon: Coins, adminOnly: true },
  { label: 'Notificações', href: '/admin/notifications', icon: Bell, adminOnly: true },
];

export const Sidebar = () => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-gradient-to-b from-sidebar to-sidebar/95 backdrop-blur-xl transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow animate-pulse-soft">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-sidebar-foreground">Invest Hub</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Bot className="h-5 w-5 text-white" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn('shrink-0 hover:bg-sidebar-accent', isCollapsed && 'absolute right-2 top-4')}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {isAdmin && !isCollapsed && (
          <div className="mb-3 rounded-lg bg-primary/10 px-3 py-2">
            <span className="text-xs font-medium text-primary">👤 Área do Usuário</span>
          </div>
        )}

        {userNavItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.label : undefined}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Icon className={cn(
                'h-5 w-5 shrink-0 transition-transform duration-200',
                isActive ? 'scale-110' : 'group-hover:scale-110'
              )} />
              {!isCollapsed && <span>{item.label}</span>}
              {isActive && !isCollapsed && (
                <div className="ml-auto h-2 w-2 rounded-full bg-white animate-glow-pulse" />
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            {!isCollapsed && (
              <div className="mb-3 mt-6 rounded-lg bg-accent/10 px-3 py-2">
                <span className="text-xs font-medium text-accent">🔐 Administrador</span>
              </div>
            )}
            {isCollapsed && <div className="my-4 border-t border-sidebar-border" />}

            {adminNavItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                  title={isCollapsed ? item.label : undefined}
                  style={{ animationDelay: `${(index + userNavItems.length) * 50}ms` }}
                >
                  <Icon className={cn(
                    'h-5 w-5 shrink-0 transition-transform duration-200',
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  )} />
                  {!isCollapsed && <span>{item.label}</span>}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-white animate-glow-pulse" />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 p-4 mb-3">
            <p className="text-xs font-medium text-sidebar-foreground">
              {isAdmin ? '🛡️ Modo Admin' : '📈 Invista com segurança'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAdmin ? 'Gerencie a plataforma' : 'Robôs operando 24/7'}
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            'w-full justify-start gap-3 text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl',
            isCollapsed && 'justify-center px-2'
          )}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
};

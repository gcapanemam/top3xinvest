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
  Settings,
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

  const navItems = isAdmin ? [...userNavItems, ...adminNavItems] : userNavItems;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Invest Hub</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn('shrink-0', isCollapsed && 'mx-auto')}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {isAdmin && !isCollapsed && (
          <div className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
            Usuário
          </div>
        )}

        {userNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            {!isCollapsed && (
              <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase text-muted-foreground">
                Administrador
              </div>
            )}
            {isCollapsed && <div className="my-4 border-t border-border" />}

            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            'w-full justify-start gap-3 text-muted-foreground hover:text-destructive',
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

import { useAuth } from '@/contexts/AuthContext';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

export const Header = () => {
  const { user, isAdmin, signOut } = useAuth();

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#1e2a3a] bg-[#0a0f14]/90 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">
          {isAdmin ? 'Painel Administrativo' : 'Minha Conta'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="relative hover:bg-[#111820] text-gray-400">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-[10px] font-medium text-white shadow-lg shadow-teal-500/25 animate-pulse">
              3
            </span>
          </Button>
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-teal-500/50 transition-all">
              <Avatar className="h-10 w-10 border-2 border-teal-500/30">
                <AvatarFallback className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 border-[#1e2a3a] bg-[#111820] text-white" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">
                  {user?.user_metadata?.full_name || 'Usuário'}
                </p>
                <p className="text-xs leading-none text-gray-400">
                  {user?.email}
                </p>
                {isAdmin && (
                  <span className="mt-2 inline-flex w-fit rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-2 py-0.5 text-xs font-medium text-white">
                    Administrador
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#1e2a3a]" />
            <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-[#1e2a3a] cursor-pointer">
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-[#1e2a3a] cursor-pointer">
              <Link to="/settings">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#1e2a3a]" />
            <DropdownMenuItem
              className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

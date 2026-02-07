import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

export const ImpersonationBanner = () => {
  const { impersonatedUser, stopImpersonation } = useAuth();

  if (!impersonatedUser) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 px-4 py-2">
      <div className="flex items-center justify-center gap-3 max-w-7xl mx-auto">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <span className="font-medium text-sm sm:text-base">
          Visualizando como: <strong>{impersonatedUser.fullName || 'Usuário'}</strong>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={stopImpersonation}
          className="ml-2 bg-yellow-600 hover:bg-yellow-700 text-yellow-950 font-semibold h-7 px-3"
        >
          <X className="h-4 w-4 mr-1" />
          Sair do Modo
        </Button>
      </div>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, AlertTriangle, Info, Gift, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  is_global: boolean;
  created_at: string;
}

const Notifications = () => {
  const { user, effectiveUserId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (effectiveUserId) {
      fetchNotifications();
    }
  }, [effectiveUserId]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${effectiveUserId},is_global.eq.true`)
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data);
    }
    setIsLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

    if (unreadIds.length === 0) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'promo':
        return <Gift className="h-5 w-5 text-green-400" />;
      case 'system':
        return <Bell className="h-5 w-5 text-blue-400" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Notificações</h1>
          <p className="text-sm md:text-base text-gray-400">
            {unreadCount > 0
              ? `${unreadCount} notificação(ões) não lida(s)`
              : 'Todas as notificações lidas'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead} 
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl border border-[#1e2a3a] text-gray-300 font-medium text-sm transition-all hover:bg-[#1e2a3a] hover:text-white w-full sm:w-auto"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-12 text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-white">Nenhuma notificação</h3>
          <p className="text-gray-400">
            Você será notificado sobre atividades importantes
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`cursor-pointer rounded-xl bg-[#111820] border transition-all hover:border-teal-500/30 ${
                !notification.is_read ? 'border-teal-500/50 bg-teal-500/5' : 'border-[#1e2a3a]'
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e2a3a]">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{notification.title}</h3>
                    {!notification.is_read && (
                      <span className="h-2 w-2 rounded-full bg-teal-400" />
                    )}
                    {notification.is_global && (
                      <span className="px-2 py-0.5 rounded-full bg-[#1e2a3a] text-gray-400 text-xs">
                        Global
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {format(new Date(notification.created_at), "dd 'de' MMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

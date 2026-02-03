import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Send, Users } from 'lucide-react';
import { createAuditLog } from '@/lib/auditLog';

interface UserProfile {
  user_id: string;
  full_name: string | null;
}

const AdminNotifications = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    isGlobal: false,
    userId: '',
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .order('full_name');

    if (data) {
      setUsers(data);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: 'Erro',
        description: 'Preencha o título e a mensagem',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.isGlobal && !formData.userId) {
      toast({
        title: 'Erro',
        description: 'Selecione um usuário ou marque como global',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    if (formData.isGlobal) {
      // Create global notification
      const { error } = await supabase.from('notifications').insert([{
        title: formData.title,
        message: formData.message,
        type: formData.type as 'info' | 'alert' | 'promo' | 'system',
        is_global: true,
      }]);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao enviar notificação',
          variant: 'destructive',
        });
      } else {
        // Create audit log
        await createAuditLog({
          action: 'notification_sent',
          entityType: 'notification',
          details: {
            title: formData.title,
            type: formData.type,
            is_global: true,
          },
        });

        toast({
          title: 'Sucesso',
          description: 'Notificação global enviada para todos os usuários!',
        });
      }
    } else {
      // Create individual notification
      const { error } = await supabase.from('notifications').insert([{
        title: formData.title,
        message: formData.message,
        type: formData.type as 'info' | 'alert' | 'promo' | 'system',
        is_global: false,
        user_id: formData.userId,
      }]);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao enviar notificação',
          variant: 'destructive',
        });
      } else {
        // Create audit log
        await createAuditLog({
          action: 'notification_sent',
          entityType: 'notification',
          details: {
            title: formData.title,
            type: formData.type,
            is_global: false,
            target_user_id: formData.userId,
          },
        });

        toast({
          title: 'Sucesso',
          description: 'Notificação enviada!',
        });
      }
    }

    setFormData({
      title: '',
      message: '',
      type: 'info',
      isGlobal: false,
      userId: '',
    });

    setIsSubmitting(false);
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Enviar Notificações</h1>
        <p className="text-gray-400">
          Envie mensagens para usuários específicos ou para todos
        </p>
      </div>

      <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
        <div className="p-6 border-b border-[#1e2a3a]">
          <h2 className="text-lg font-semibold text-white">Nova Notificação</h2>
          <p className="text-sm text-gray-400">Preencha os campos abaixo para enviar uma notificação</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isGlobal}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isGlobal: checked, userId: '' })
                }
              />
              <Label className="flex items-center gap-2 text-gray-300">
                <Users className="h-4 w-4" />
                Enviar para todos os usuários
              </Label>
            </div>
          </div>

          {!formData.isGlobal && (
            <div className="space-y-2">
              <Label className="text-gray-300">Selecionar Usuário</Label>
              <Select
                value={formData.userId}
                onValueChange={(v) => setFormData({ ...formData, userId: v })}
              >
                <SelectTrigger className="bg-[#0a0f14] border-[#1e2a3a] text-white">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent className="bg-[#111820] border-[#1e2a3a]">
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id} className="text-white hover:bg-[#1e2a3a]">
                      {user.full_name || 'Sem nome'} ({user.user_id.slice(0, 8)}...)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título da notificação"
                className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger className="bg-[#0a0f14] border-[#1e2a3a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111820] border-[#1e2a3a]">
                  <SelectItem value="info" className="text-white hover:bg-[#1e2a3a]">Informação</SelectItem>
                  <SelectItem value="alert" className="text-white hover:bg-[#1e2a3a]">Alerta</SelectItem>
                  <SelectItem value="promo" className="text-white hover:bg-[#1e2a3a]">Promoção</SelectItem>
                  <SelectItem value="system" className="text-white hover:bg-[#1e2a3a]">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-gray-300">Mensagem</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Digite a mensagem..."
              rows={4}
              className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
            />
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Enviando...' : 'Enviar Notificação'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;

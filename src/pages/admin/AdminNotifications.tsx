import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Bell, Send, Users } from 'lucide-react';

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enviar Notificações</h1>
        <p className="text-muted-foreground">
          Envie mensagens para usuários específicos ou para todos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Notificação</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para enviar uma notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isGlobal}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isGlobal: checked, userId: '' })
                }
              />
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Enviar para todos os usuários
              </Label>
            </div>
          </div>

          {!formData.isGlobal && (
            <div className="space-y-2">
              <Label>Selecionar Usuário</Label>
              <Select
                value={formData.userId}
                onValueChange={(v) => setFormData({ ...formData, userId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.full_name || 'Sem nome'} ({user.user_id.slice(0, 8)}...)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título da notificação"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="alert">Alerta</SelectItem>
                  <SelectItem value="promo">Promoção</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Digite a mensagem..."
              rows={4}
            />
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Enviando...' : 'Enviar Notificação'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;

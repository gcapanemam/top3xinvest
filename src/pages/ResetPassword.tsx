import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Bot, Lock, ArrowRight, CheckCircle } from 'lucide-react';

const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword, user, isLoading } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirecionar se não houver sessão de recuperação
  useEffect(() => {
    // Se o usuário não está logado após o carregamento, significa que o token é inválido
    if (!isLoading && !user) {
      toast({
        title: 'Link inválido',
        description: 'O link de recuperação expirou ou é inválido. Solicite um novo.',
        variant: 'destructive',
      });
      navigate('/auth');
    }
  }, [user, isLoading, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      passwordSchema.parse(password);

      if (password !== confirmPassword) {
        toast({
          title: 'Erro',
          description: 'As senhas não coincidem',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await updatePassword(password);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar a senha. Tente novamente.',
          variant: 'destructive',
        });
      } else {
        setIsSuccess(true);
        toast({
          title: 'Sucesso!',
          description: 'Sua senha foi atualizada com sucesso',
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Erro de validação',
          description: err.errors[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f14]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25 animate-pulse">
              <Bot className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-gray-400 animate-pulse">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f14]">
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          <div className="h-20 w-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Senha atualizada!</h2>
          <p className="text-gray-400">Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f14] relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-teal-500/5 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-[#111820] border border-[#1e2a3a] shadow-2xl animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Redefinir senha</CardTitle>
          <CardDescription className="text-gray-400">
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Nova senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-300">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11 rounded-xl bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <button 
              type="submit" 
              className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;

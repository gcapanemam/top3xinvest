import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Bot, TrendingUp, Shield, ArrowRight, Sparkles, Gift, Mail } from 'lucide-react';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres');

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, resetPassword, isLoading } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  
  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Capturar código de indicação da URL
  const referralCode = searchParams.get('ref') || '';
  const [activeTab, setActiveTab] = useState(referralCode ? 'register' : 'login');

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);

      const { error } = await signIn(loginEmail, loginPassword);

      if (error) {
        let message = 'Erro ao fazer login';
        if (error.message.includes('Invalid login credentials')) {
          message = 'Email ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Por favor, confirme seu email antes de fazer login';
        }
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Bem-vindo!',
          description: 'Login realizado com sucesso',
        });
        navigate('/dashboard');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      nameSchema.parse(registerName);
      emailSchema.parse(registerEmail);
      passwordSchema.parse(registerPassword);

      if (registerPassword !== registerConfirmPassword) {
        toast({
          title: 'Erro',
          description: 'As senhas não coincidem',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const { error, data } = await signUp(registerEmail, registerPassword, registerName);

      if (error) {
        let message = 'Erro ao criar conta';
        
        if (error.message.includes('User already registered')) {
          message = 'Este email já está cadastrado';
        } else if (error.message.includes('rate limit')) {
          message = 'Muitas tentativas. Aguarde alguns minutos e tente novamente';
        } else if (error.message.includes('Signup disabled')) {
          message = 'Cadastros estão temporariamente desativados';
        } else if (error.message.includes('invalid email')) {
          message = 'Formato de email inválido';
        } else if (error.message.includes('Password')) {
          message = 'Senha inválida. Use pelo menos 6 caracteres';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          message = 'Falha de conexão. Verifique sua internet e tente novamente';
        }
        
        console.error('Signup error:', error.message);
        
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        });
      } else {
        // Processar indicação se houver código de referral
        if (referralCode && data?.user?.id) {
          try {
            await supabase.rpc('process_referral', {
              new_user_id: data.user.id,
              referrer_code: referralCode,
            });
          } catch (refError) {
            console.error('Erro ao processar indicação:', refError);
          }
        }

        toast({
          title: 'Conta criada!',
          description: 'Verifique seu email para confirmar o cadastro',
        });
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingReset(true);

    try {
      emailSchema.parse(forgotPasswordEmail);

      const { error } = await resetPassword(forgotPasswordEmail);

      if (error) {
        console.error('Reset password error:', error);
        
        let message = 'Não foi possível enviar o email de recuperação. Tente novamente.';
        
        if (error.message.includes('rate limit') || error.message.includes('For security purposes')) {
          message = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
        } else if (error.message.includes('User not found')) {
          message = 'Email não encontrado no sistema.';
        }
        
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada (e spam) para redefinir sua senha.',
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
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
      setIsSendingReset(false);
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
          <p className="text-gray-400 animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f14] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-teal-500/5 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="container mx-auto flex min-h-screen flex-col lg:flex-row">
        {/* Left side - Branding */}
        <div className="flex flex-1 flex-col justify-center p-8 lg:p-16">
          <div className="mb-8 animate-fade-in-up">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Invest Hub</h1>
            </div>
            <p className="text-xl text-gray-400">
              Plataforma inteligente de investimentos com robôs automatizados
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Robôs Automatizados</h3>
                <p className="text-sm text-gray-400">
                  Invista em robôs de trading que operam 24/7 no mercado de criptomoedas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Segurança Total</h3>
                <p className="text-sm text-gray-400">
                  Seus investimentos protegidos com a mais alta tecnologia de segurança
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/25">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Rendimentos Diários</h3>
                <p className="text-sm text-gray-400">
                  Acompanhe seus lucros em tempo real e faça saques quando quiser
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="flex flex-1 items-center justify-center p-8">
          <Card className="w-full max-w-md bg-[#111820] border border-[#1e2a3a] shadow-2xl animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Acesse sua conta</CardTitle>
              <CardDescription className="text-gray-400">
                Entre ou crie uma conta para começar a investir
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralCode && (
                <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-teal-400" />
                    <span className="text-sm text-teal-400">
                      Você foi indicado! Código: <span className="font-mono font-bold">{referralCode}</span>
                    </span>
                  </div>
                </div>
              )}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#1e2a3a] p-1 rounded-xl">
                  <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-gray-400">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-gray-400">
                    Cadastrar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="animate-fade-in-up">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="h-11 rounded-xl bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-gray-300">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="h-11 rounded-xl bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                    <button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50" disabled={isSubmitting}>
                      {isSubmitting ? 'Entrando...' : 'Entrar'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="w-full text-center text-sm text-teal-400 hover:text-teal-300 transition-colors mt-2"
                    >
                      Esqueci minha senha
                    </button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="animate-fade-in-up">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-gray-300">Nome completo</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Seu nome"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        required
                        className="h-11 rounded-xl bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-gray-300">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        className="h-11 rounded-xl bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-gray-300">Senha</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        className="h-11 rounded-xl bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password" className="text-gray-300">Confirmar senha</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        required
                        className="h-11 rounded-xl bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                    <button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50" disabled={isSubmitting}>
                      {isSubmitting ? 'Criando conta...' : 'Criar conta'}
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="bg-[#111820] border-[#1e2a3a] sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-center text-white">Recuperar senha</DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Digite seu email para receber o link de recuperação
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-gray-300">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                className="h-11 rounded-xl bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <button 
              type="submit" 
              className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50" 
              disabled={isSendingReset}
            >
              {isSendingReset ? 'Enviando...' : 'Enviar link de recuperação'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;

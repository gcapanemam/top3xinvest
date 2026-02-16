import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, Target } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: string;
  label: string | null;
}

const AdminSettings = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate('/dashboard');
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchSettings();
  }, [isAdmin]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('platform_settings')
      .select('*')
      .order('key');
    if (data) setSettings(data);
  };

  const updateValue = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const s of settings) {
        await supabase
          .from('platform_settings')
          .update({ value: s.value, updated_at: new Date().toISOString() })
          .eq('key', s.key);
      }
      toast.success('Configurações salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  const goalSetting = settings.find(s => s.key === 'fundraising_goal');
  const raisedSetting = settings.find(s => s.key === 'fundraising_raised');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações da Plataforma</h1>
        <p className="text-gray-400">Ajuste os valores exibidos na landing page</p>
      </div>

      <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
            <Target className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Meta de Arrecadação</h2>
            <p className="text-sm text-gray-400">Valores exibidos na seção de progresso da landing page</p>
          </div>
        </div>

        {goalSetting && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{goalSetting.label}</label>
            <Input
              type="number"
              value={goalSetting.value}
              onChange={e => updateValue('fundraising_goal', e.target.value)}
              className="bg-[#0a0f14] border-[#1e2a3a] text-white"
            />
          </div>
        )}

        {raisedSetting && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">{raisedSetting.label}</label>
            <Input
              type="number"
              value={raisedSetting.value}
              onChange={e => updateValue('fundraising_raised', e.target.value)}
              className="bg-[#0a0f14] border-[#1e2a3a] text-white"
            />
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;

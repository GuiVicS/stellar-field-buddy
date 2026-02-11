import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, MessageSquare, Mail } from 'lucide-react';

const SETTINGS_KEYS = [
  'evolution_api_url',
  'evolution_api_key',
  'evolution_instance',
  'feedback_whatsapp_enabled',
  'feedback_email_enabled',
] as const;

type SettingsMap = Record<string, string>;

const SettingsPage = () => {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [...SETTINGS_KEYS]);
      const map: SettingsMap = {};
      (data || []).forEach((s) => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    };
    load();
  }, []);

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const key of SETTINGS_KEYS) {
        const value = settings[key] ?? '';
        const { error } = await supabase
          .from('system_settings')
          .upsert({ key, value }, { onConflict: 'key' });
        if (error) throw error;
      }
      toast({ title: 'Configurações salvas com sucesso!' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie as integrações e preferências do sistema.</p>
      </div>

      {/* Evolution API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
            Evolution API (WhatsApp)
          </CardTitle>
          <CardDescription>Configure a integração com a Evolution API para envio de mensagens via WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evolution_api_url">URL da API</Label>
            <Input
              id="evolution_api_url"
              placeholder="https://api.evolution.example.com"
              value={settings.evolution_api_url ?? ''}
              onChange={(e) => update('evolution_api_url', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evolution_api_key">API Key</Label>
            <Input
              id="evolution_api_key"
              type="password"
              placeholder="Sua chave de API"
              value={settings.evolution_api_key ?? ''}
              onChange={(e) => update('evolution_api_key', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evolution_instance">Nome da Instância</Label>
            <Input
              id="evolution_instance"
              placeholder="minha-instancia"
              value={settings.evolution_instance ?? ''}
              onChange={(e) => update('evolution_instance', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Canais de Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-primary" />
            Canais de Feedback
          </CardTitle>
          <CardDescription>Escolha por quais canais o link de pesquisa de satisfação será enviado ao cliente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">WhatsApp</p>
              <p className="text-xs text-muted-foreground">Enviar link via Evolution API</p>
            </div>
            <Switch
              checked={settings.feedback_whatsapp_enabled === 'true'}
              onCheckedChange={(v) => update('feedback_whatsapp_enabled', v ? 'true' : 'false')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">E-mail</p>
              <p className="text-xs text-muted-foreground">Enviar link por e-mail automático</p>
            </div>
            <Switch
              checked={settings.feedback_email_enabled === 'true'}
              onCheckedChange={(v) => update('feedback_email_enabled', v ? 'true' : 'false')}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Configurações
      </Button>
    </div>
  );
};

export default SettingsPage;

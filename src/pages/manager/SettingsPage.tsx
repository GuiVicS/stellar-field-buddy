import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, MessageSquare, Mail, QrCode, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [qrLoading, setQrLoading] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

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

  const handleGenerateQrCode = async () => {
    const url = settings.evolution_api_url;
    const key = settings.evolution_api_key;
    const instance = settings.evolution_instance;

    if (!url || !key || !instance) {
      toast({ title: 'Preencha URL, API Key e Instância antes de gerar o QR Code.', variant: 'destructive' });
      return;
    }

    setQrLoading(true);
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/instance/connect/${instance}`, {
        method: 'GET',
        headers: { apikey: key },
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Erro ${res.status}: ${errBody}`);
      }
      const data = await res.json();
      const base64 = data?.base64;
      if (!base64) throw new Error('QR Code não retornado pela API.');
      setQrData(base64);
      setQrDialogOpen(true);
    } catch (e: any) {
      toast({ title: 'Erro ao gerar QR Code', description: e.message, variant: 'destructive' });
    } finally {
      setQrLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    const url = settings.evolution_api_url;
    const key = settings.evolution_api_key;
    const instance = settings.evolution_instance;

    if (!url || !key || !instance) {
      toast({ title: 'Preencha URL, API Key e Instância antes de verificar.', variant: 'destructive' });
      return;
    }

    setStatusLoading(true);
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/instance/connectionState/${instance}`, {
        method: 'GET',
        headers: { apikey: key },
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Erro ${res.status}: ${errBody}`);
      }
      const data = await res.json();
      const state = data?.instance?.state || data?.state || 'unknown';
      setConnectionStatus(state);
      toast({ title: state === 'open' ? 'Instância conectada!' : `Status: ${state}` });
    } catch (e: any) {
      setConnectionStatus('error');
      toast({ title: 'Erro ao verificar status', description: e.message, variant: 'destructive' });
    } finally {
      setStatusLoading(false);
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
          <div className="pt-2 flex gap-2">
            <Button
              variant="outline"
              onClick={handleGenerateQrCode}
              disabled={qrLoading}
              className="flex-1"
            >
              {qrLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
              Gerar QR Code
            </Button>
            <Button
              variant="outline"
              onClick={handleCheckStatus}
              disabled={statusLoading}
              className="flex-1"
            >
              {statusLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
              Verificar Status
            </Button>
          </div>
          {connectionStatus && (
            <div className="pt-2 flex items-center gap-2">
              {connectionStatus === 'open' ? (
                <Badge className="bg-green-600 text-white"><Wifi className="w-3 h-3 mr-1" /> Conectado</Badge>
              ) : connectionStatus === 'error' ? (
                <Badge variant="destructive"><WifiOff className="w-3 h-3 mr-1" /> Erro</Badge>
              ) : (
                <Badge variant="secondary"><WifiOff className="w-3 h-3 mr-1" /> {connectionStatus}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrData && (
              <img src={qrData} alt="QR Code" className="w-64 h-64 rounded-lg border" />
            )}
            <p className="text-xs text-muted-foreground text-center">
              Escaneie o QR Code com o WhatsApp para conectar a instância.
            </p>
          </div>
        </DialogContent>
      </Dialog>
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

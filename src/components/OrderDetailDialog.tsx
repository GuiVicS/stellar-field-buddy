import React, { useState, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, OS_TYPE_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, MapPin, Phone, Printer, User, FileText, Calendar, Wrench, Camera, Mic, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any | null;
}

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <span className="text-muted-foreground text-xs">{label}</span>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
};

const OrderDetailDialog = ({ open, onOpenChange, order }: OrderDetailDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: evidences = [] } = useQuery({
    queryKey: ['evidences', order?.id],
    queryFn: async () => {
      if (!order?.id) return [];
      const { data, error } = await supabase
        .from('evidences')
        .select('*')
        .eq('os_id', order.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!order?.id && open,
  });

  const handleFileUpload = async (file: File, kind: 'photo' | 'audio') => {
    if (!order?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${order.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('evidences')
        .getPublicUrl(path);

      const { error: insertError } = await supabase
        .from('evidences')
        .insert({
          os_id: order.id,
          kind,
          file_url: urlData.publicUrl,
          created_by: user?.user_id || null,
        });
      if (insertError) throw insertError;

      qc.invalidateQueries({ queryKey: ['evidences', order.id] });
      toast({ title: kind === 'photo' ? '📷 Foto anexada!' : '🎙️ Áudio anexado!' });
    } catch (e: any) {
      toast({ title: 'Erro ao enviar arquivo', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (!order) return null;

  const scheduledStart = new Date(order.scheduled_start);
  const time = scheduledStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const date = scheduledStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const endTime = order.scheduled_end
    ? new Date(order.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const addressStr = order.address
    ? [order.address.street, order.address.number, order.address.city, order.address.state].filter(Boolean).join(', ')
    : null;

  const photos = evidences.filter((e: any) => e.kind === 'photo');
  const audios = evidences.filter((e: any) => e.kind === 'audio');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold text-accent">{order.code}</span>
            <span className={cn("status-badge", OS_STATUS_COLORS[order.status])}>
              {OS_STATUS_LABELS[order.status]}
            </span>
            <span className={cn("status-badge", PRIORITY_COLORS[order.priority])}>
              {PRIORITY_LABELS[order.priority]}
            </span>
          </div>
          <DialogTitle className="text-lg mt-1">
            {order.customer?.name || 'Cliente'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Info principal */}
          <div className="space-y-3">
            <InfoRow icon={Wrench} label="Tipo de serviço" value={OS_TYPE_LABELS[order.type]} />
            <InfoRow icon={Calendar} label="Data" value={date} />
            <InfoRow icon={Clock} label="Período" value={endTime ? `${time} – ${endTime}` : time} />
            {order.estimated_duration_min && (
              <InfoRow icon={Clock} label="Duração estimada" value={`${order.estimated_duration_min} minutos`} />
            )}
          </div>

          <Separator />

          {/* Cliente */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</h3>
            <InfoRow icon={User} label="Contato" value={order.customer?.main_contact_name || order.customer?.name} />
            <InfoRow icon={Phone} label="Telefone" value={order.customer?.phone} />
            <InfoRow icon={MapPin} label="Endereço" value={addressStr} />
          </div>

          {/* Equipamento */}
          {order.machine && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipamento</h3>
                <InfoRow icon={Printer} label="Modelo" value={order.machine.model} />
                <InfoRow icon={FileText} label="Nº de série" value={order.machine.serial_number} />
              </div>
            </>
          )}

          {/* Técnico */}
          {order.technician && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Técnico</h3>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {order.technician.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{order.technician.name}</p>
                    {order.technician.phone && (
                      <p className="text-xs text-muted-foreground">{order.technician.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Descrição do problema */}
          {order.problem_description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição do Problema</h3>
                <p className="text-sm leading-relaxed text-foreground bg-muted/50 rounded-lg p-3">
                  {order.problem_description}
                </p>
              </div>
            </>
          )}

          {/* Diagnóstico */}
          {order.diagnosis && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diagnóstico</h3>
              <p className="text-sm leading-relaxed text-foreground bg-muted/50 rounded-lg p-3">
                {order.diagnosis}
              </p>
            </div>
          )}

          {/* Resolução */}
          {order.resolution && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolução</h3>
              <p className="text-sm leading-relaxed text-foreground bg-muted/50 rounded-lg p-3">
                {order.resolution}
              </p>
            </div>
          )}

          {/* Timestamps */}
          {(order.arrived_at || order.started_at || order.finished_at) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico</h3>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {order.arrived_at && (
                    <p>📍 Chegou às {new Date(order.arrived_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                  {order.started_at && (
                    <p>🔧 Iniciou às {new Date(order.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                  {order.finished_at && (
                    <p>✅ Finalizou às {new Date(order.finished_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Anexos */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Anexos</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs"
                >
                  {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Camera className="w-3 h-3 mr-1" />}
                  Foto
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs"
                >
                  {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Mic className="w-3 h-3 mr-1" />}
                  Áudio
                </Button>
              </div>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'photo');
                e.target.value = '';
              }}
            />
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'audio');
                e.target.value = '';
              }}
            />

            {/* Photos grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((ev: any) => (
                  <a key={ev.id} href={ev.file_url} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                      <img src={ev.file_url} alt="Evidência" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Audios list */}
            {audios.length > 0 && (
              <div className="space-y-2">
                {audios.map((ev: any) => (
                  <div key={ev.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
                    <Mic className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <audio controls className="flex-1 h-8" src={ev.file_url} />
                  </div>
                ))}
              </div>
            )}

            {photos.length === 0 && audios.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">
                Nenhum anexo adicionado
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailDialog;

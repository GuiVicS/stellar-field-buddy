import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceOrders, useUpdateServiceOrder } from '@/hooks/useServiceOrders';
import { useChecklist, useToggleChecklistItem } from '@/hooks/useChecklist';
import { useTimeline } from '@/hooks/useTimeline';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, type OSStatus } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, MapPin, Phone, Clock, Printer, User, Camera, Plus,
  CheckCircle2, FileText, Package, PenTool, ChevronRight, ChevronLeft,
  Trash2, Loader2, MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const steps = [
  { id: 1, label: 'Resumo', icon: FileText },
  { id: 2, label: 'Diagnóstico', icon: FileText },
  { id: 3, label: 'Checklist', icon: CheckCircle2 },
  { id: 4, label: 'Evidências', icon: Camera },
  { id: 5, label: 'Peças', icon: Package },
  { id: 6, label: 'Assinatura', icon: PenTool },
];

const ServiceOrderWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: allOrders = [], isLoading } = useServiceOrders();
  const os = allOrders.find(o => o.id === id);
  const { data: checklist = [] } = useChecklist(id);
  const { data: timeline = [] } = useTimeline(id);
  const toggleItem = useToggleChecklistItem();
  const updateOrder = useUpdateServiceOrder();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [diagnosis, setDiagnosis] = useState('');
  const [resolution, setResolution] = useState('');
  const [uploading, setUploading] = useState(false);
  const [partName, setPartName] = useState('');
  const [partCost, setPartCost] = useState('');

  const { data: evidences = [] } = useQuery({
    queryKey: ['evidences', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase.from('evidences').select('*').eq('os_id', id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: parts = [] } = useQuery({
    queryKey: ['parts', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase.from('parts_used').select('*').eq('os_id', id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  React.useEffect(() => {
    if (os) {
      setDiagnosis(os.diagnosis || '');
      setResolution(os.resolution || '');
    }
  }, [os]);

  if (isLoading) {
    return <div className="p-5 space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!os) return <div className="p-5">OS não encontrada</div>;

  const canGoNext = currentStep < steps.length;
  const canGoPrev = currentStep > 1;

  const handleFinish = () => {
    updateOrder.mutate({
      id: os.id,
      status: 'concluido' as any,
      diagnosis,
      resolution,
      finished_at: new Date().toISOString(),
    }, {
      onSuccess: () => {
        toast({ title: '✅ OS finalizada com sucesso!' });
        navigate(-1);
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `${id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('evidences').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('evidences').getPublicUrl(path);
        const kind = file.type.startsWith('image/') ? 'photo' : file.type.startsWith('audio/') ? 'audio' : 'file';
        const { error: insertError } = await supabase.from('evidences').insert({
          os_id: id,
          file_url: urlData.publicUrl,
          kind,
          created_by: user?.user_id || null,
        });
        if (insertError) throw insertError;
      }
      qc.invalidateQueries({ queryKey: ['evidences', id] });
      toast({ title: '📎 Evidência adicionada!' });
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteEvidence = async (evId: string) => {
    await supabase.from('evidences').delete().eq('id', evId);
    qc.invalidateQueries({ queryKey: ['evidences', id] });
  };

  const handleAddPart = async () => {
    if (!partName.trim() || !id) return;
    const costValue = partCost ? parseFloat(partCost.replace(',', '.')) : null;
    const { error } = await supabase.from('parts_used').insert({
      os_id: id,
      part_name: partName.trim(),
      cost: costValue,
    } as any);
    if (error) {
      toast({ title: 'Erro ao adicionar peça', description: error.message, variant: 'destructive' });
      return;
    }
    setPartName('');
    setPartCost('');
    qc.invalidateQueries({ queryKey: ['parts', id] });
    toast({ title: '✅ Peça adicionada!' });
  };

  const handleDeletePart = async (partId: string) => {
    await supabase.from('parts_used').delete().eq('id', partId);
    qc.invalidateQueries({ queryKey: ['parts', id] });
  };

  return (
    <div className="animate-fade-in">
      <div className="brand-gradient px-5 pt-4 pb-5 text-primary-foreground">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs opacity-70">{os.code}</span>
              <h1 className="text-lg font-bold">{os.customer?.name}</h1>
            </div>
          </div>
          {os.customer?.phone && (
            <a
              href={`https://wa.me/${os.customer.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(142,70%,40%)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Select
            value={os.status}
            onValueChange={(value: string) => {
              updateOrder.mutate({ id: os.id, status: value as any }, {
                onSuccess: () => toast({ title: '✅ Status atualizado!' }),
              });
            }}
          >
            <SelectTrigger className="h-7 w-auto gap-1.5 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground text-xs font-medium px-2.5 [&>svg]:text-primary-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(OS_STATUS_LABELS) as [OSStatus, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", OS_STATUS_COLORS[key].split(' ')[0])} />
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {os.machine && <span className="flex items-center gap-1"><Printer className="w-3 h-3" />{os.machine.model}</span>}
        </div>
      </div>

      <div className="px-5 py-3 flex gap-1 overflow-x-auto scrollbar-hide">
        {steps.map(step => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              currentStep === step.id
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <step.icon className="w-3.5 h-3.5" />
            {step.label}
          </button>
        ))}
      </div>

      <div className="px-5 pb-32">
        {/* Step 1: Summary */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <Card className="p-4 shadow-card border-border/50">
              <h3 className="text-sm font-semibold mb-3">Informações do Cliente</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{os.customer?.main_contact_name || os.customer?.name}</span>
                </div>
                {os.customer?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${os.customer.phone}`} className="text-accent">{os.customer.phone}</a>
                  </div>
                )}
                {os.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{os.address.street}, {os.address.number} — {os.address.city}/{os.address.state}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(os.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {os.scheduled_end && ` – ${new Date(os.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                    {os.estimated_duration_min && ` (${os.estimated_duration_min}min)`}
                  </span>
                </div>
              </div>
            </Card>
            <Card className="p-4 shadow-card border-border/50">
              <h3 className="text-sm font-semibold mb-2">Descrição do Problema</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{os.problem_description}</p>
            </Card>
            {timeline.length > 0 && (
              <Card className="p-4 shadow-card border-border/50">
                <h3 className="text-sm font-semibold mb-3">Histórico</h3>
                <div className="space-y-3">
                  {timeline.map(item => (
                    <div key={item.id} className="flex gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      <div>
                        <p className={cn(item.kind === 'system' ? 'text-muted-foreground' : 'text-foreground')}>
                          {item.message}
                        </p>
                        <span className="text-muted-foreground/60">
                          {new Date(item.created_at!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Diagnosis */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <Card className="p-4 shadow-card border-border/50">
              <h3 className="text-sm font-semibold mb-3">Diagnóstico</h3>
              <Textarea
                placeholder="Descreva o diagnóstico do problema..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="min-h-[120px] text-sm"
              />
            </Card>
            <Card className="p-4 shadow-card border-border/50">
              <h3 className="text-sm font-semibold mb-3">Solução / Resolução</h3>
              <Textarea
                placeholder="Descreva a solução aplicada..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="min-h-[120px] text-sm"
              />
            </Card>
          </div>
        )}

        {/* Step 3: Checklist */}
        {currentStep === 3 && (
          <div className="space-y-3 animate-fade-in">
            <h3 className="text-sm font-semibold">Checklist de Verificação</h3>
            {checklist.length === 0 && (
              <Card className="p-6 text-center text-muted-foreground text-sm">
                Nenhum item no checklist
              </Card>
            )}
            {checklist.map(item => (
              <Card key={item.id} className="p-3 shadow-card border-border/50">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.checked || false}
                    onCheckedChange={() => {
                      toggleItem.mutate({ id: item.id, checked: !item.checked });
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm", item.checked && "line-through text-muted-foreground")}>
                        {item.label}
                      </span>
                      {item.required && (
                        <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-semibold">
                          Obrigatório
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Step 4: Evidences — real upload */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-semibold">Evidências</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*,.pdf"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              className="w-full h-12 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                <><Camera className="w-4 h-4 mr-2" /> Adicionar foto ou arquivo</>
              )}
            </Button>

            {evidences.length === 0 && !uploading && (
              <Card className="p-6 shadow-card border-border/50 flex flex-col items-center justify-center text-muted-foreground">
                <Camera className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma evidência adicionada</p>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-2">
              {evidences.map(ev => (
                <div key={ev.id} className="relative group rounded-lg overflow-hidden border border-border/50">
                  {ev.kind === 'photo' ? (
                    <img src={ev.file_url} alt="" className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      {ev.kind === 'audio' ? '🎵 Áudio' : '📎 Arquivo'}
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteEvidence(ev.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Parts — simple name + cost form */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-semibold">Peças Utilizadas</h3>

            <Card className="p-4 shadow-card border-border/50 space-y-3">
              <Input
                placeholder="Nome da peça"
                value={partName}
                onChange={e => setPartName(e.target.value)}
                className="h-10 text-sm"
              />
              <Input
                placeholder="Custo (R$)"
                value={partCost}
                onChange={e => setPartCost(e.target.value)}
                type="text"
                inputMode="decimal"
                className="h-10 text-sm"
              />
              <Button
                onClick={handleAddPart}
                disabled={!partName.trim()}
                className="w-full h-10"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Adicionar Peça
              </Button>
            </Card>

            {parts.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Nenhuma peça registrada ainda
              </div>
            )}

            {parts.map((p) => (
              <Card key={p.id} className="p-3 shadow-card border-border/50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{p.part_name}</div>
                  {(p as any).cost != null && (
                    <div className="text-xs text-muted-foreground">
                      R$ {Number((p as any).cost).toFixed(2).replace('.', ',')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeletePart(p.id)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Card>
            ))}
          </div>
        )}

        {/* Step 6: Signature */}
        {currentStep === 6 && (
          <div className="space-y-4 animate-fade-in">
            <Card className="p-4 shadow-card border-border/50">
              <h3 className="text-sm font-semibold mb-3">Assinatura do Cliente</h3>
              <div className="space-y-3">
                <Input placeholder="Nome do responsável" className="h-10 text-sm" />
                <Input placeholder="CPF / Documento (opcional)" className="h-10 text-sm" />
                <div className="border-2 border-dashed border-border rounded-xl h-40 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PenTool className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Toque para assinar</p>
                  </div>
                </div>
              </div>
            </Card>
            <Button
              onClick={handleFinish}
              disabled={updateOrder.isPending}
              className="w-full h-12 brand-gradient text-primary-foreground font-semibold text-base"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {updateOrder.isPending ? 'Finalizando...' : 'Finalizar OS'}
            </Button>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 inset-x-0 px-5 py-3 bg-background/80 backdrop-blur-md border-t border-border flex gap-3 z-40">
        <Button variant="outline" disabled={!canGoPrev} onClick={() => setCurrentStep(s => s - 1)} className="flex-1 h-11">
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        <Button disabled={!canGoNext} onClick={() => setCurrentStep(s => s + 1)} className="flex-1 h-11 brand-gradient text-primary-foreground">
          Próximo <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default ServiceOrderWizard;

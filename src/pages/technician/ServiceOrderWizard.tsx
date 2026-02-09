import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServiceOrders, useUpdateServiceOrder } from '@/hooks/useServiceOrders';
import { useChecklist, useToggleChecklistItem } from '@/hooks/useChecklist';
import { useTimeline } from '@/hooks/useTimeline';
import { OS_STATUS_LABELS, OS_STATUS_COLORS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, MapPin, Phone, Clock, Printer, User, Camera, Mic, Plus,
  CheckCircle2, FileText, Package, PenTool, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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
  const { data: allOrders = [], isLoading } = useServiceOrders();
  const os = allOrders.find(o => o.id === id);
  const { data: checklist = [] } = useChecklist(id);
  const { data: timeline = [] } = useTimeline(id);
  const toggleItem = useToggleChecklistItem();
  const updateOrder = useUpdateServiceOrder();

  const [currentStep, setCurrentStep] = useState(1);
  const [diagnosis, setDiagnosis] = useState('');
  const [resolution, setResolution] = useState('');

  // Set initial values when OS loads
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

  return (
    <div className="animate-fade-in">
      <div className="brand-gradient px-5 pt-4 pb-5 text-primary-foreground">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs opacity-70">{os.code}</span>
            <h1 className="text-lg font-bold">{os.customer?.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs opacity-80">
          <span className="status-badge bg-primary-foreground/20 text-primary-foreground">
            {OS_STATUS_LABELS[os.status]}
          </span>
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

        {currentStep === 3 && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Checklist de Verificação</h3>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Item
              </Button>
            </div>
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

        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-semibold">Evidências</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="mobile-action-btn bg-accent/10 text-accent border border-accent/20 rounded-xl">
                <Camera className="w-6 h-6" />
                <span>Tirar Foto</span>
              </button>
              <button className="mobile-action-btn bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
                <Mic className="w-6 h-6" />
                <span>Gravar Áudio</span>
              </button>
            </div>
            <Card className="p-8 shadow-card border-border/50 flex flex-col items-center justify-center text-muted-foreground">
              <Camera className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Nenhuma evidência adicionada</p>
              <p className="text-xs opacity-60">Capture fotos ou grave áudios</p>
            </Card>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Peças Utilizadas</h3>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Peça
              </Button>
            </div>
            <Card className="p-8 shadow-card border-border/50 flex flex-col items-center justify-center text-muted-foreground">
              <Package className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Nenhuma peça registrada</p>
            </Card>
          </div>
        )}

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

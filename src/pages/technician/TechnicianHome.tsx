import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceOrders, useUpdateServiceOrder } from '@/hooks/useServiceOrders';
import { useOSAnalytics } from '@/hooks/useOSAnalytics';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, type OSStatus } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock, MapPin, Navigation, CheckCircle2, Play, Printer,
  ChevronRight, ChevronLeft, AlertTriangle, ExternalLink, ClipboardList, Zap, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import AvatarUpload from '@/components/AvatarUpload';
import { useToast } from '@/hooks/use-toast';

const STATUS_FLOW: OSStatus[] = ['a_fazer', 'em_deslocamento', 'em_atendimento', 'aguardando_peca', 'concluido'];

const TechnicianHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: allOrders = [], isLoading } = useServiceOrders();
  const updateOrder = useUpdateServiceOrder();
  const { toast } = useToast();
  const orders = allOrders.filter(o => o.technician_id === user?.user_id);
  const analytics = useOSAnalytics(orders as any);
  const done = orders.filter(o => o.status === 'concluido').length;
  const firstName = user?.name?.split(' ')[0] || 'Técnico';

  if (isLoading) {
    return (
      <div className="p-5 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="brand-gradient px-5 pt-6 pb-8 text-primary-foreground">
        <div className="flex items-center gap-3 mb-3">
          <AvatarUpload currentUrl={user?.avatar_url} userId={user?.user_id || ''} name={user?.name} size="md" editable={false} />
          <div>
            <p className="text-sm opacity-80">Bom dia,</p>
            <h1 className="text-2xl font-bold">{firstName} 👋</h1>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-4 py-2.5 flex-1 text-center">
            <div className="text-xl font-bold">{orders.length}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">Visitas</div>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-4 py-2.5 flex-1 text-center">
            <div className="text-xl font-bold">{done}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">Concluídas</div>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-4 py-2.5 flex-1 text-center">
            <div className="text-xl font-bold">{orders.length - done}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">Pendentes</div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-3">
        <Card className="p-3 shadow-elevated border-border/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">Progresso do dia</span>
            <span className="text-xs font-bold text-accent">
              {orders.length > 0 ? Math.round((done / orders.length) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${orders.length > 0 ? (done / orders.length) * 100 : 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Insights */}
      {analytics.problemPatterns.length > 0 && (
        <div className="px-5 mt-5">
          <Card className="p-4 shadow-card border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-priority-urgent" /> Problemas frequentes
            </h3>
            <div className="flex flex-wrap gap-2">
              {analytics.problemPatterns.slice(0, 5).map(p => (
                <span key={p.keyword} className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium capitalize">
                  {p.keyword} ({p.count})
                </span>
              ))}
            </div>
            {analytics.avgResolutionHours && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" />
                Tempo médio de resolução: <span className="font-semibold text-foreground">{analytics.avgResolutionHours}h</span>
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="px-5 mt-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Checklist do dia
        </h2>
        {orders.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma OS atribuída a você</p>
          </Card>
        )}
        {orders.map((os, i) => {
          const time = new Date(os.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const endTime = os.scheduled_end ? new Date(os.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
          const isDone = os.status === 'concluido';
          const isUrgent = os.priority === 'urgente';
          return (
            <Card
              key={os.id}
              className={cn(
                "p-4 shadow-card border-border/50 transition-all active:scale-[0.98]",
                isDone && "opacity-60",
                isUrgent && "border-l-4 border-l-priority-urgent"
              )}
              onClick={() => navigate(`/tech/os/${os.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
                  isDone ? "bg-status-done text-status-done-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-mono font-semibold text-accent">{os.code}</span>
                    </div>
                    {/* ClickUp-style status with prev/next */}
                    {(() => {
                      const idx = STATUS_FLOW.indexOf(os.status as OSStatus);
                      const prev = idx > 0 ? STATUS_FLOW[idx - 1] : null;
                      const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
                      const isFinal = os.status === 'concluido' || os.status === 'cancelado';
                      const handleChange = (newStatus: OSStatus, e: React.MouseEvent) => {
                        e.stopPropagation();
                        const extras: any = { id: os.id, status: newStatus };
                        if (newStatus === 'em_deslocamento') extras.actual_departure_at = new Date().toISOString();
                        if (newStatus === 'em_atendimento') extras.arrived_at = new Date().toISOString();
                        if (newStatus === 'concluido') extras.finished_at = new Date().toISOString();
                        updateOrder.mutate(extras, {
                          onSuccess: () => toast({ title: `✅ ${OS_STATUS_LABELS[newStatus]}` }),
                        });
                      };
                      return (
                        <div className="flex items-center rounded-md overflow-hidden h-6">
                          {prev && !isFinal && (
                            <button
                              onClick={(e) => handleChange(prev, e)}
                              className="px-1 h-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                            >
                              <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                            </button>
                          )}
                          <span className={cn("px-2 h-full flex items-center text-[10px] font-bold uppercase whitespace-nowrap", OS_STATUS_COLORS[os.status as OSStatus])}>
                            {OS_STATUS_LABELS[os.status as OSStatus]}
                          </span>
                          {next && !isFinal && (
                            <button
                              onClick={(e) => handleChange(next, e)}
                              className={cn("px-1 h-full hover:opacity-80 transition-opacity", OS_STATUS_COLORS[next]?.split(' ')[0] || 'bg-primary')}
                            >
                              <ChevronRight className="w-3 h-3 text-white" />
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-sm font-semibold truncate">{os.customer?.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">
                      {os.address?.street && `${os.address.street}, ${os.address.number} — `}{os.address?.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {time}{endTime && ` – ${endTime}`}
                    </div>
                    {os.machine && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Printer className="w-3 h-3" />
                        {os.machine.model}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TechnicianHome;

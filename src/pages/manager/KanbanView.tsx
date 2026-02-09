import React from 'react';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, OS_TYPE_LABELS } from '@/types';
import type { OSStatus } from '@/types';
import { Card } from '@/components/ui/card';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const columns: { status: OSStatus; label: string; color: string }[] = [
  { status: 'a_fazer', label: 'A Fazer', color: 'border-t-status-pending' },
  { status: 'em_deslocamento', label: 'Em Deslocamento', color: 'border-t-status-transit' },
  { status: 'em_atendimento', label: 'Em Atendimento', color: 'border-t-status-active' },
  { status: 'aguardando_peca', label: 'Aguardando Peça', color: 'border-t-status-waiting' },
  { status: 'concluido', label: 'Concluído', color: 'border-t-status-done' },
];

const KanbanView = () => {
  const { data: allOrders = [], isLoading } = useServiceOrders();

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-64 w-72" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Kanban — Execução ao Vivo</h1>
        <p className="text-sm text-muted-foreground">Acompanhe o status das ordens de serviço em tempo real</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {columns.map(col => {
          const orders = allOrders.filter(o => o.status === col.status);
          return (
            <div key={col.status} className="flex-shrink-0 w-72 lg:w-80">
              <div className={cn("rounded-xl border border-border/50 bg-muted/30 overflow-hidden border-t-4", col.color)}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground">
                    {orders.length}
                  </span>
                </div>
                <div className="px-3 pb-3 space-y-2 min-h-[200px]">
                  {orders.map(os => {
                    const time = new Date(os.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <Card key={os.id} className="p-3 shadow-card border-border/50 hover:shadow-elevated transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono font-semibold text-accent">{os.code}</span>
                          <span className={cn("status-badge text-[10px]", PRIORITY_COLORS[os.priority])}>
                            {PRIORITY_LABELS[os.priority]}
                          </span>
                        </div>
                        <div className="text-sm font-medium mb-1 truncate">{os.customer?.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{os.machine?.model}</div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {time}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {os.address?.city}
                          </div>
                        </div>
                        {os.technician && (
                          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                            <div className="w-5 h-5 rounded-full brand-gradient flex items-center justify-center text-[8px] font-bold text-primary-foreground">
                              {os.technician.name.charAt(0)}
                            </div>
                            {os.technician.name}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                  {orders.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                      Nenhuma OS
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanView;

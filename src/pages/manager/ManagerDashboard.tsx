import React from 'react';
import { mockServiceOrders, mockUsers } from '@/data/mockData';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, OS_TYPE_LABELS } from '@/types';
import type { ServiceOrder } from '@/types';
import { Card } from '@/components/ui/card';
import { ClipboardList, Users, CheckCircle2, Clock, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const stats = [
  {
    label: 'Total OS Hoje',
    value: mockServiceOrders.length,
    icon: ClipboardList,
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    label: 'Concluídas',
    value: mockServiceOrders.filter(o => o.status === 'concluido').length,
    icon: CheckCircle2,
    color: 'text-status-done',
    bg: 'bg-status-done/10',
  },
  {
    label: 'Em Andamento',
    value: mockServiceOrders.filter(o => ['em_deslocamento', 'em_atendimento'].includes(o.status)).length,
    icon: TrendingUp,
    color: 'text-status-active',
    bg: 'bg-status-active/10',
  },
  {
    label: 'Urgentes',
    value: mockServiceOrders.filter(o => o.priority === 'urgente').length,
    icon: AlertTriangle,
    color: 'text-priority-urgent',
    bg: 'bg-priority-urgent/10',
  },
];

const technicians = mockUsers.filter(u => u.role === 'tecnico');

const ManagerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral das operações de hoje</p>
        </div>
        <Button onClick={() => navigate('/manager/orders')} className="brand-gradient text-primary-foreground">
          Nova OS
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="p-4 shadow-card border-border/50">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ordens de Serviço — Hoje</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/manager/kanban')} className="text-accent text-xs">
              Ver Kanban <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {mockServiceOrders.map(os => (
              <OSCard key={os.id} os={os} />
            ))}
          </div>
        </div>

        {/* Technicians */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Técnicos</h2>
          <div className="space-y-2">
            {technicians.map(tech => {
              const techOrders = mockServiceOrders.filter(o => o.technician_id === tech.id);
              const done = techOrders.filter(o => o.status === 'concluido').length;
              return (
                <Card key={tech.id} className="p-4 shadow-card border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {tech.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{tech.name}</div>
                      <div className="text-xs text-muted-foreground">{techOrders.length} OS • {done} concluída(s)</div>
                    </div>
                    <div className="flex gap-1">
                      {techOrders.some(o => ['em_deslocamento', 'em_atendimento'].includes(o.status)) && (
                        <span className="w-2 h-2 rounded-full bg-status-active animate-pulse-dot" />
                      )}
                    </div>
                  </div>
                  {/* Mini progress */}
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-status-done rounded-full transition-all"
                      style={{ width: `${techOrders.length > 0 ? (done / techOrders.length) * 100 : 0}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const OSCard: React.FC<{ os: ServiceOrder }> = ({ os }) => {
  const time = new Date(os.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(os.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="p-4 shadow-card border-border/50 hover:shadow-elevated transition-shadow cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-accent">{os.code}</span>
            <span className={cn("status-badge", OS_STATUS_COLORS[os.status])}>
              {OS_STATUS_LABELS[os.status]}
            </span>
            <span className={cn("status-badge", PRIORITY_COLORS[os.priority])}>
              {PRIORITY_LABELS[os.priority]}
            </span>
          </div>
          <div className="text-sm font-medium truncate">{os.customer?.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {os.address?.city}, {os.address?.state} • {os.machine?.model}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {time} – {endTime}
          </div>
          {os.technician && (
            <div className="text-xs text-muted-foreground mt-1">
              {os.technician.name}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ManagerDashboard;

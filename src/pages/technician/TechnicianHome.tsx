import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTechnicianOrders } from '@/data/mockData';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, OS_TYPE_LABELS } from '@/types';
import type { ServiceOrder } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock, MapPin, Navigation, CheckCircle2, Play, Printer, Phone,
  ChevronRight, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const TechnicianHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const orders = getTechnicianOrders(user?.id || '');
  const done = orders.filter(o => o.status === 'concluido').length;
  const firstName = user?.name?.split(' ')[0] || 'Técnico';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="brand-gradient px-5 pt-6 pb-8 text-primary-foreground">
        <p className="text-sm opacity-80">Bom dia,</p>
        <h1 className="text-2xl font-bold">{firstName} 👋</h1>
        <div className="flex gap-4 mt-4">
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-4 py-2.5 flex-1 text-center">
            <div className="text-xl font-bold">{orders.length}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">Visitas hoje</div>
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

      {/* Progress */}
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

      {/* Orders list */}
      <div className="px-5 mt-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Checklist do dia
        </h2>
        {orders.map((os, i) => (
          <TechOSCard key={os.id} os={os} index={i + 1} onOpen={() => navigate(`/tech/os/${os.id}`)} />
        ))}
      </div>
    </div>
  );
};

const TechOSCard: React.FC<{ os: ServiceOrder; index: number; onOpen: () => void }> = ({ os, index, onOpen }) => {
  const time = new Date(os.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(os.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const isDone = os.status === 'concluido';
  const isUrgent = os.priority === 'urgente';

  return (
    <Card
      className={cn(
        "p-4 shadow-card border-border/50 transition-all active:scale-[0.98]",
        isDone && "opacity-60",
        isUrgent && "border-l-4 border-l-priority-urgent"
      )}
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        {/* Index / Status icon */}
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
          isDone ? "bg-status-done text-status-done-foreground" : "bg-muted text-muted-foreground"
        )}>
          {isDone ? <CheckCircle2 className="w-5 h-5" /> : index}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-semibold text-accent">{os.code}</span>
            <span className={cn("status-badge text-[10px]", OS_STATUS_COLORS[os.status])}>
              {OS_STATUS_LABELS[os.status]}
            </span>
          </div>
          <div className="text-sm font-semibold truncate">{os.customer?.name}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{os.address?.street}, {os.address?.number} — {os.address?.city}</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {time} – {endTime}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Printer className="w-3 h-3" />
              {os.machine?.model}
            </div>
          </div>

          {/* Quick actions */}
          {!isDone && (
            <div className="flex gap-2 mt-3">
              {os.status === 'a_fazer' && (
                <Button size="sm" className="h-8 text-xs bg-status-transit text-status-transit-foreground">
                  <Navigation className="w-3 h-3 mr-1" /> Deslocamento
                </Button>
              )}
              {os.status === 'em_deslocamento' && (
                <Button size="sm" className="h-8 text-xs bg-status-active text-status-active-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Cheguei
                </Button>
              )}
              {['em_deslocamento', 'a_fazer'].includes(os.status) && (
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); }}>
                  <ExternalLink className="w-3 h-3 mr-1" /> Maps
                </Button>
              )}
              {os.status === 'em_atendimento' && (
                <Button size="sm" className="h-8 text-xs brand-gradient text-primary-foreground">
                  <Play className="w-3 h-3 mr-1" /> Abrir OS
                </Button>
              )}
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </Card>
  );
};

export default TechnicianHome;

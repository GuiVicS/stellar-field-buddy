import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTechnicianOrders } from '@/data/mockData';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, OS_TYPE_LABELS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const TechnicianAgenda = () => {
  const { user } = useAuth();
  const orders = getTechnicianOrders(user?.id || '');
  const today = new Date();

  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold">Agenda</h1>
        <div className="flex items-center gap-2 mt-2">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium capitalize">
            {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-5 space-y-2 pb-6">
        {orders.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma visita agendada</p>
          </Card>
        ) : (
          orders.map(os => {
            const time = new Date(os.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(os.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return (
              <Card key={os.id} className="p-4 shadow-card border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold text-accent">{os.code}</span>
                  <span className={cn("status-badge text-[10px]", OS_STATUS_COLORS[os.status])}>
                    {OS_STATUS_LABELS[os.status]}
                  </span>
                </div>
                <div className="text-sm font-semibold">{os.customer?.name}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{time} – {endTime}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{os.address?.city}</span>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TechnicianAgenda;

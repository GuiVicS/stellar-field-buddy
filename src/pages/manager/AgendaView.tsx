import React from 'react';
import { mockServiceOrders } from '@/data/mockData';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, OS_TYPE_LABELS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7:00 - 18:00

const AgendaView = () => {
  const [date] = React.useState(new Date());
  const dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground capitalize">{dayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm">Hoje</Button>
          <Button variant="outline" size="icon"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-card">
        <div className="grid grid-cols-[60px_1fr] divide-x divide-border">
          {hours.map(hour => {
            const ordersAtHour = mockServiceOrders.filter(os => {
              const h = new Date(os.scheduled_start).getHours();
              return h === hour;
            });

            return (
              <React.Fragment key={hour}>
                <div className="p-2 text-xs text-muted-foreground text-right border-b border-border bg-muted/30 font-mono">
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div className="p-2 border-b border-border min-h-[60px]">
                  <div className="flex gap-2 flex-wrap">
                    {ordersAtHour.map(os => (
                      <div
                        key={os.id}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs cursor-pointer transition-all hover:scale-[1.02]",
                          OS_STATUS_COLORS[os.status]
                        )}
                      >
                        <div className="font-semibold">{os.code}</div>
                        <div className="opacity-80 truncate max-w-[200px]">{os.customer?.name}</div>
                        <div className="opacity-60 mt-0.5">{os.technician?.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgendaView;

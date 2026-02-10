import React, { useCallback, useMemo } from 'react';
import { useServiceOrders, useUpdateServiceOrder } from '@/hooks/useServiceOrders';
import { OS_STATUS_COLORS, PRIORITY_COLORS } from '@/types';
import type { OSStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import OrderDetailDialog from '@/components/OrderDetailDialog';
import NewOrderDialog from '@/components/NewOrderDialog';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'day' | 'week' | 'month';

const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 6;
const END_HOUR = 20;
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

const VIEW_LABELS: Record<ViewMode, string> = { day: 'Dia', week: 'Semana', month: 'Mês' };

/* ── helpers ── */
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getWeekDays = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(start);
    dd.setDate(start.getDate() + i);
    return dd;
  });
};

const getMonthDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const days: Date[] = [];
  // fill previous month
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push(d);
  }
  // current month
  for (let i = 1; i <= last.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  // fill next month to complete grid
  while (days.length % 7 !== 0) {
    const d = new Date(year, month + 1, days.length - last.getDate() - startDay + 1);
    days.push(d);
  }
  return days;
};

const formatTime = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/* ── Event card for time grid ── */
const TimeEvent: React.FC<{
  os: any;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  style: React.CSSProperties;
}> = ({ os, onClick, onDragStart, style }) => {
  const start = new Date(os.scheduled_start);
  const end = os.scheduled_end ? new Date(os.scheduled_end) : new Date(start.getTime() + (os.estimated_duration_min || 60) * 60000);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={style}
      className={cn(
        "absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg z-10 border border-primary/20",
        OS_STATUS_COLORS[os.status as OSStatus]
      )}
    >
      <div className="text-[10px] font-semibold opacity-80">{formatTime(start)} – {formatTime(end)}</div>
      <div className="text-xs font-bold truncate">{os.customer?.name || os.code}</div>
      {os.technician && <div className="text-[10px] opacity-70 truncate">{os.technician.name}</div>}
    </div>
  );
};

/* ── Day Column (shared between Day and Week view) ── */
const DayColumn: React.FC<{
  date: Date;
  orders: any[];
  showHeader: boolean;
  onSelectOrder: (os: any) => void;
  onDragStart: (e: React.DragEvent, osId: string) => void;
  onDrop: (e: React.DragEvent, hour: number) => void;
  dragOverHour: number | null;
  setDragOverHour: (h: number | null) => void;
}> = ({ date, orders, showHeader, onSelectOrder, onDragStart, onDrop, dragOverHour, setDragOverHour }) => {
  const dayOrders = orders.filter(os => {
    const osDate = new Date(os.scheduled_start);
    return isSameDay(osDate, date);
  });

  const isToday = isSameDay(date, new Date());

  return (
    <div className="flex-1 min-w-0 relative">
      {showHeader && (
        <div className={cn(
          "text-center py-2 border-b border-border sticky top-0 bg-card z-20",
          isToday && "bg-primary/5"
        )}>
          <div className="text-[10px] text-muted-foreground uppercase">
            {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
          </div>
          <div className={cn(
            "text-lg font-bold",
            isToday && "w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto"
          )}>
            {date.getDate()}
          </div>
        </div>
      )}
      <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
        {/* Hour grid lines */}
        {hours.map((hour, i) => (
          <div
            key={hour}
            className={cn(
              "absolute left-0 right-0 border-t border-border/40",
              dragOverHour === hour && "bg-accent/10"
            )}
            style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            onDragOver={(e) => { e.preventDefault(); setDragOverHour(hour); }}
            onDragLeave={() => setDragOverHour(null)}
            onDrop={(e) => onDrop(e, hour)}
          />
        ))}
        {/* Events positioned absolutely */}
        {dayOrders.map(os => {
          const start = new Date(os.scheduled_start);
          const end = os.scheduled_end
            ? new Date(os.scheduled_end)
            : new Date(start.getTime() + (os.estimated_duration_min || 60) * 60000);

          const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
          const endMinutes = (end.getHours() - START_HOUR) * 60 + end.getMinutes();
          const top = (startMinutes / 60) * HOUR_HEIGHT;
          const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24);

          if (startMinutes < 0) return null;

          return (
            <TimeEvent
              key={os.id}
              os={os}
              onClick={() => onSelectOrder(os)}
              onDragStart={(e) => onDragStart(e, os.id)}
              style={{ top, height, minHeight: 24 }}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ── Time Gutter ── */
const TimeGutter = () => (
  <div className="w-14 flex-shrink-0 relative" style={{ height: hours.length * HOUR_HEIGHT }}>
    {hours.map((hour, i) => (
      <div
        key={hour}
        className="absolute left-0 right-0 text-[11px] text-muted-foreground text-right pr-2 font-mono"
        style={{ top: i * HOUR_HEIGHT - 7 }}
      >
        {String(hour).padStart(2, '0')}:00
      </div>
    ))}
  </div>
);

/* ── Month View ── */
const MonthView: React.FC<{
  date: Date;
  orders: any[];
  onSelectOrder: (os: any) => void;
}> = ({ date, orders, onSelectOrder }) => {
  const days = getMonthDays(date);
  const today = new Date();

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground font-semibold border-b border-border">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === date.getMonth();
          const isToday = isSameDay(day, today);
          const dayOrders = orders.filter(os => isSameDay(new Date(os.scheduled_start), day));

          return (
            <div
              key={i}
              className={cn(
                "min-h-[90px] border-b border-r border-border/40 p-1",
                !isCurrentMonth && "bg-muted/20 opacity-50"
              )}
            >
              <div className={cn(
                "text-xs font-medium mb-1",
                isToday && "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
              )}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayOrders.slice(0, 3).map(os => {
                  const time = formatTime(new Date(os.scheduled_start));
                  return (
                    <div
                      key={os.id}
                      onClick={() => onSelectOrder(os)}
                      className={cn(
                        "text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
                        OS_STATUS_COLORS[os.status as OSStatus]
                      )}
                    >
                      {time} {os.customer?.name || os.code}
                    </div>
                  );
                })}
                {dayOrders.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{dayOrders.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main Agenda ── */
const AgendaView = () => {
  const [date, setDate] = React.useState(new Date());
  const [view, setView] = React.useState<ViewMode>('week');
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
  const [newOrderOpen, setNewOrderOpen] = React.useState(false);
  const [dragOverHour, setDragOverHour] = React.useState<number | null>(null);
  const { data: allOrders = [], isLoading } = useServiceOrders();
  const updateOrder = useUpdateServiceOrder();
  const { toast } = useToast();

  const navigate = useCallback((dir: -1 | 0 | 1) => {
    if (dir === 0) { setDate(new Date()); return; }
    setDate(prev => {
      const d = new Date(prev);
      if (view === 'day') d.setDate(d.getDate() + dir);
      else if (view === 'week') d.setDate(d.getDate() + dir * 7);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  }, [view]);

  const headerLabel = useMemo(() => {
    if (view === 'day') return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (view === 'week') {
      const days = getWeekDays(date);
      const s = days[0];
      const e = days[6];
      if (s.getMonth() === e.getMonth()) {
        return `${s.getDate()} – ${e.getDate()} de ${s.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
      }
      return `${s.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [date, view]);

  const isToday = isSameDay(date, new Date());

  const handleDragStart = useCallback((e: React.DragEvent, osId: string) => {
    e.dataTransfer.setData('text/plain', osId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetHour: number) => {
    e.preventDefault();
    setDragOverHour(null);
    const osId = e.dataTransfer.getData('text/plain');
    if (!osId) return;
    const os = allOrders.find(o => o.id === osId);
    if (!os) return;

    const oldStart = new Date(os.scheduled_start);
    const oldHour = oldStart.getHours();
    if (oldHour === targetHour) return;

    const diffMs = (targetHour - oldHour) * 60 * 60 * 1000;
    const newStart = new Date(oldStart.getTime() + diffMs);
    const newEnd = os.scheduled_end ? new Date(new Date(os.scheduled_end).getTime() + diffMs) : null;

    updateOrder.mutate({
      id: osId,
      scheduled_start: newStart.toISOString(),
      ...(newEnd ? { scheduled_end: newEnd.toISOString() } : {}),
    }, {
      onSuccess: () => toast({ title: `⏰ OS movida para ${String(targetHour).padStart(2, '0')}:00` }),
      onError: (err) => toast({ title: 'Erro ao mover OS', description: String(err), variant: 'destructive' }),
    });
  }, [allOrders, updateOrder, toast]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(0)} disabled={view === 'day' && isToday}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold capitalize">{headerLabel}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['day', 'week', 'month'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  view === v ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted text-muted-foreground"
                )}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
          <Button className="brand-gradient text-primary-foreground" size="sm" onClick={() => setNewOrderOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Nova OS
          </Button>
        </div>
      </div>

      {/* Content */}
      {view === 'month' ? (
        <MonthView date={date} orders={allOrders} onSelectOrder={setSelectedOrder} />
      ) : (
        <div className="flex-1 overflow-auto border border-border rounded-xl bg-card">
          <div className="flex min-w-0">
            {/* Time gutter */}
            <div className="flex-shrink-0 border-r border-border">
              {(view === 'week') && <div className="h-[52px] border-b border-border" />}
              {(view === 'day') && <div className="h-0" />}
              <TimeGutter />
            </div>

            {/* Day columns */}
            {view === 'day' ? (
              <DayColumn
                date={date}
                orders={allOrders}
                showHeader={false}
                onSelectOrder={setSelectedOrder}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                dragOverHour={dragOverHour}
                setDragOverHour={setDragOverHour}
              />
            ) : (
              getWeekDays(date).map(d => (
                <DayColumn
                  key={d.toISOString()}
                  date={d}
                  orders={allOrders}
                  showHeader
                  onSelectOrder={setSelectedOrder}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  dragOverHour={dragOverHour}
                  setDragOverHour={setDragOverHour}
                />
              ))
            )}
          </div>
        </div>
      )}

      {allOrders.filter(os => {
        if (view === 'day') return isSameDay(new Date(os.scheduled_start), date);
        return true;
      }).length === 0 && view === 'day' && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma OS agendada para este dia
        </div>
      )}

      <OrderDetailDialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)} order={selectedOrder} />
      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} />
    </div>
  );
};

export default AgendaView;

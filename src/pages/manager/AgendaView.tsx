import React from 'react';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { OS_STATUS_COLORS, OS_TYPE_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import OrderDetailDialog from '@/components/OrderDetailDialog';
import NewOrderDialog from '@/components/NewOrderDialog';

const hours = Array.from({ length: 12 }, (_, i) => i + 7);

const AgendaView = () => {
  const [date, setDate] = React.useState(new Date());
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
  const [newOrderOpen, setNewOrderOpen] = React.useState(false);
  const { data: allOrders = [], isLoading } = useServiceOrders();

  const dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Filter orders for selected date
  const orders = allOrders.filter(os => {
    const osDate = new Date(os.scheduled_start);
    return (
      osDate.getFullYear() === date.getFullYear() &&
      osDate.getMonth() === date.getMonth() &&
      osDate.getDate() === date.getDate()
    );
  });

  const goToday = () => setDate(new Date());
  const goPrev = () => setDate(prev => {
    const d = new Date(prev);
    d.setDate(d.getDate() - 1);
    return d;
  });
  const goNext = () => setDate(prev => {
    const d = new Date(prev);
    d.setDate(d.getDate() + 1);
    return d;
  });

  const isToday =
    date.toDateString() === new Date().toDateString();

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground capitalize">{dayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} disabled={isToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={goNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button className="brand-gradient text-primary-foreground ml-2" onClick={() => setNewOrderOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nova OS
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-card">
        <div className="grid grid-cols-[60px_1fr] divide-x divide-border">
          {hours.map(hour => {
            const ordersAtHour = orders.filter(os => {
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
                        onClick={() => setSelectedOrder(os)}
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

      {orders.length === 0 && (
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

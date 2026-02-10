import React from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import AvatarUpload from '@/components/AvatarUpload';

const TechniciansPage = () => {
  const { data: profiles = [], isLoading: loadingProfiles } = useProfiles();
  const { data: orders = [], isLoading: loadingOrders } = useServiceOrders();

  const isLoading = loadingProfiles || loadingOrders;

  // All profiles that have been assigned to at least one order, or just show all profiles
  const technicians = profiles.filter(p => p.active);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold">Técnicos</h1>
      {technicians.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p>Nenhum técnico cadastrado</p>
        </Card>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.map(tech => {
          const techOrders = orders.filter(o => o.technician_id === tech.user_id);
          const done = techOrders.filter(o => o.status === 'concluido').length;
          const active = techOrders.some(o => ['em_deslocamento', 'em_atendimento'].includes(o.status));
          return (
            <Card key={tech.id} className="p-5 shadow-card border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <AvatarUpload
                  currentUrl={tech.avatar_url}
                  userId={tech.user_id}
                  name={tech.name}
                  size="md"
                />
                <div>
                  <div className="font-semibold">{tech.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {active && <span className="w-2 h-2 rounded-full bg-status-active animate-pulse-dot" />}
                    {active ? 'Em atendimento' : 'Disponível'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded-lg p-2">
                  <div className="text-lg font-bold">{techOrders.length}</div>
                  <div className="text-[10px] text-muted-foreground">Total</div>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <div className="text-lg font-bold text-status-done">{done}</div>
                  <div className="text-[10px] text-muted-foreground">Feitas</div>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <div className="text-lg font-bold">{techOrders.length - done}</div>
                  <div className="text-[10px] text-muted-foreground">Pendentes</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TechniciansPage;

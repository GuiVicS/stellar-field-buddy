import React from 'react';
import { mockUsers, mockServiceOrders } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const technicians = mockUsers.filter(u => u.role === 'tecnico');

const TechniciansPage = () => {
  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold">Técnicos</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.map(tech => {
          const orders = mockServiceOrders.filter(o => o.technician_id === tech.id);
          const done = orders.filter(o => o.status === 'concluido').length;
          const active = orders.some(o => ['em_deslocamento', 'em_atendimento'].includes(o.status));
          return (
            <Card key={tech.id} className="p-5 shadow-card border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full brand-gradient flex items-center justify-center text-lg font-bold text-primary-foreground">
                  {tech.name.charAt(0)}
                </div>
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
                  <div className="text-lg font-bold">{orders.length}</div>
                  <div className="text-[10px] text-muted-foreground">Total</div>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <div className="text-lg font-bold text-status-done">{done}</div>
                  <div className="text-[10px] text-muted-foreground">Feitas</div>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <div className="text-lg font-bold">{orders.length - done}</div>
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

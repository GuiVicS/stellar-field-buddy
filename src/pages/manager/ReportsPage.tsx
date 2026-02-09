import React from 'react';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, TrendingUp, Clock, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfiles } from '@/hooks/useProfiles';

const ReportsPage = () => {
  const { data: orders = [], isLoading } = useServiceOrders();
  const { data: profiles = [] } = useProfiles();

  const total = orders.length;
  const done = orders.filter(o => o.status === 'concluido').length;

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  // Group orders by technician
  const techStats = profiles
    .map(tech => {
      const techOrders = orders.filter(o => o.technician_id === tech.user_id);
      const techDone = techOrders.filter(o => o.status === 'concluido').length;
      return {
        name: tech.name,
        total: techOrders.length,
        done: techDone,
        pct: techOrders.length > 0 ? Math.round((techDone / techOrders.length) * 100) : 0,
      };
    })
    .filter(t => t.total > 0)
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Métricas e indicadores de desempenho</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" /> Exportar
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total OS', value: total, icon: BarChart3, color: 'text-accent' },
          { label: 'Taxa de Conclusão', value: total > 0 ? `${Math.round((done / total) * 100)}%` : '0%', icon: TrendingUp, color: 'text-status-done' },
          { label: 'Em Andamento', value: orders.filter(o => ['em_deslocamento', 'em_atendimento'].includes(o.status)).length, icon: Clock, color: 'text-status-transit' },
          { label: 'Aguardando', value: orders.filter(o => o.status === 'aguardando_peca').length, icon: RotateCcw, color: 'text-status-waiting' },
        ].map(stat => (
          <Card key={stat.label} className="p-5 shadow-card border-border/50">
            <stat.icon className={`w-8 h-8 ${stat.color} mb-3`} />
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6 shadow-card border-border/50">
        <h3 className="text-lg font-semibold mb-4">Desempenho por Técnico</h3>
        {techStats.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
        )}
        <div className="space-y-4">
          {techStats.map(tech => (
            <div key={tech.name} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center text-sm font-bold text-primary-foreground">
                {tech.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{tech.name}</div>
                <div className="h-2 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${tech.pct}%` }} />
                </div>
              </div>
              <span className="text-sm font-semibold text-accent">{tech.pct}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;

import React from 'react';
import { mockServiceOrders } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, TrendingUp, Clock, RotateCcw } from 'lucide-react';

const ReportsPage = () => {
  const total = mockServiceOrders.length;
  const done = mockServiceOrders.filter(o => o.status === 'concluido').length;

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
          { label: 'OS Hoje', value: total, icon: BarChart3, color: 'text-accent' },
          { label: 'Taxa de Conclusão', value: `${Math.round((done / total) * 100)}%`, icon: TrendingUp, color: 'text-status-done' },
          { label: 'Tempo Médio', value: '52min', icon: Clock, color: 'text-status-transit' },
          { label: 'Taxa de Retorno', value: '4%', icon: RotateCcw, color: 'text-status-waiting' },
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
        <div className="space-y-4">
          {['Rafael Costa', 'Lucas Ferreira', 'Ana Souza'].map((name, i) => (
            <div key={name} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center text-sm font-bold text-primary-foreground">
                {name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{name}</div>
                <div className="h-2 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${[75, 90, 60][i]}%` }} />
                </div>
              </div>
              <span className="text-sm font-semibold text-accent">{[75, 90, 60][i]}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;

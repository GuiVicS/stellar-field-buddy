import React from 'react';
import { mockServiceOrders } from '@/data/mockData';
import { OS_STATUS_LABELS, OS_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, OS_TYPE_LABELS } from '@/types';
import type { ServiceOrder } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const OrdersListPage = () => {
  const [search, setSearch] = React.useState('');
  const filtered = mockServiceOrders.filter(os =>
    os.code.toLowerCase().includes(search.toLowerCase()) ||
    os.customer?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Button className="brand-gradient text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Nova OS
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Código</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Prioridade</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Técnico</th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(os => (
                <tr key={os.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-mono font-semibold text-accent text-xs">{os.code}</td>
                  <td className="px-4 py-3">{os.customer?.name}</td>
                  <td className="px-4 py-3 text-xs">{OS_TYPE_LABELS[os.type]}</td>
                  <td className="px-4 py-3">
                    <span className={cn("status-badge", PRIORITY_COLORS[os.priority])}>{PRIORITY_LABELS[os.priority]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("status-badge", OS_STATUS_COLORS[os.status])}>{OS_STATUS_LABELS[os.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{os.technician?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {new Date(os.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersListPage;

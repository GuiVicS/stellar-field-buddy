import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, User, Wrench, AlertTriangle, Calendar, MessageSquare } from 'lucide-react';
import { mockCustomers, mockUsers, mockServiceOrders } from '@/data/mockData';
import { OS_TYPE_LABELS } from '@/types';
import type { OSType, Priority } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpTip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help inline ml-1" />
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[220px] text-xs">
      {text}
    </TooltipContent>
  </Tooltip>
);

const NewOrderDialog = ({ open, onOpenChange }: NewOrderDialogProps) => {
  const { toast } = useToast();
  const technicians = mockUsers.filter(u => u.role === 'tecnico' && u.active);

  const [form, setForm] = useState({
    customer_id: '',
    technician_id: '',
    type: '' as OSType | '',
    priority: 'media' as Priority,
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '08:00',
    problem_description: '',
  });

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const canSubmit =
    form.customer_id && form.type && form.problem_description.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const nextCode = `OS-2026-${String(mockServiceOrders.length + 1).padStart(4, '0')}`;

    toast({
      title: '✅ OS criada com sucesso!',
      description: `Código: ${nextCode}`,
    });

    setForm({
      customer_id: '',
      technician_id: '',
      type: '',
      priority: 'media',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '08:00',
      problem_description: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Wrench className="w-5 h-5 text-primary" />
            Nova Ordem de Serviço
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar uma nova OS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Cliente */}
          <div className="space-y-1.5">
            <Label className="flex items-center text-sm font-medium">
              <User className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Cliente
              <HelpTip text="Selecione o cliente que solicitou o serviço." />
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Select value={form.customer_id} onValueChange={v => update('customer_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o cliente" />
              </SelectTrigger>
              <SelectContent>
                {mockCustomers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Serviço */}
          <div className="space-y-1.5">
            <Label className="flex items-center text-sm font-medium">
              <Wrench className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Tipo de Serviço
              <HelpTip text="Instalação: equipamento novo. Corretiva: consertar defeito. Preventiva: manutenção programada. Treinamento: capacitação." />
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Select value={form.type} onValueChange={v => update('type', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Qual o tipo?" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(OS_TYPE_LABELS) as [OSType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-1.5">
            <Label className="flex items-center text-sm font-medium">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Prioridade
              <HelpTip text="Urgente: produção parada. Alta: problema grave. Média: situação normal. Baixa: sem pressa." />
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { value: 'baixa', label: 'Baixa', color: 'border-green-400 bg-green-50 text-green-700' },
                { value: 'media', label: 'Média', color: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
                { value: 'alta', label: 'Alta', color: 'border-orange-400 bg-orange-50 text-orange-700' },
                { value: 'urgente', label: 'Urgente', color: 'border-red-400 bg-red-50 text-red-700' },
              ] as const).map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => update('priority', p.value)}
                  className={`rounded-lg border-2 py-1.5 text-xs font-semibold transition-all ${
                    form.priority === p.value
                      ? `${p.color} ring-2 ring-offset-1 ring-primary/30 scale-105`
                      : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center text-sm font-medium">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Data
                <HelpTip text="Quando o serviço deve ser realizado." />
              </Label>
              <Input
                type="date"
                value={form.scheduled_date}
                onChange={e => update('scheduled_date', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center text-sm font-medium">
                Horário
                <HelpTip text="Hora prevista para início do atendimento." />
              </Label>
              <Input
                type="time"
                value={form.scheduled_time}
                onChange={e => update('scheduled_time', e.target.value)}
              />
            </div>
          </div>

          {/* Técnico (opcional) */}
          <div className="space-y-1.5">
            <Label className="flex items-center text-sm font-medium">
              <User className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Técnico
              <HelpTip text="Opcional. Você pode atribuir um técnico depois." />
            </Label>
            <Select value={form.technician_id} onValueChange={v => update('technician_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Atribuir depois (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição do Problema */}
          <div className="space-y-1.5">
            <Label className="flex items-center text-sm font-medium">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Descrição do Problema
              <HelpTip text="Descreva o que está acontecendo para o técnico entender." />
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Textarea
              placeholder="Ex: Impressora travando papel na bandeja 2..."
              value={form.problem_description}
              onChange={e => update('problem_description', e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="brand-gradient text-primary-foreground"
          >
            Criar OS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewOrderDialog;

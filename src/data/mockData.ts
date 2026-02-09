import type { User, Customer, CustomerAddress, Machine, ServiceOrder, ChecklistItem, TimelineComment } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Carlos Mendes',
    email: 'carlos@stellarprint.com.br',
    phone: '(11) 99876-5432',
    role: 'gerente',
    active: true,
    avatar: '',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'u2',
    name: 'Rafael Costa',
    email: 'rafael@stellarprint.com.br',
    phone: '(11) 98765-4321',
    role: 'tecnico',
    active: true,
    avatar: '',
    created_at: '2024-02-01T10:00:00Z',
  },
  {
    id: 'u3',
    name: 'Lucas Ferreira',
    email: 'lucas@stellarprint.com.br',
    phone: '(11) 97654-3210',
    role: 'tecnico',
    active: true,
    avatar: '',
    created_at: '2024-02-10T10:00:00Z',
  },
  {
    id: 'u4',
    name: 'Ana Souza',
    email: 'ana@stellarprint.com.br',
    phone: '(11) 96543-2109',
    role: 'tecnico',
    active: true,
    avatar: '',
    created_at: '2024-03-01T10:00:00Z',
  },
];

export const mockCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Gráfica Express Ltda',
    cpf_cnpj: '12.345.678/0001-99',
    main_contact_name: 'Marcos Silva',
    phone: '(11) 3456-7890',
    email: 'marcos@graficaexpress.com.br',
    created_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'c2',
    name: 'Print House SA',
    cpf_cnpj: '98.765.432/0001-11',
    main_contact_name: 'Juliana Rocha',
    phone: '(21) 2345-6789',
    email: 'juliana@printhouse.com.br',
    created_at: '2024-02-15T10:00:00Z',
  },
  {
    id: 'c3',
    name: 'Digital Copy Center',
    cpf_cnpj: '45.678.901/0001-55',
    main_contact_name: 'Roberto Alves',
    phone: '(11) 4567-8901',
    email: 'roberto@digitalcopy.com.br',
    created_at: '2024-03-10T10:00:00Z',
  },
];

export const mockAddresses: CustomerAddress[] = [
  {
    id: 'a1', customer_id: 'c1', label: 'Sede', street: 'Rua Augusta', number: '1200',
    city: 'São Paulo', state: 'SP', zip: '01304-001', lat: -23.5558, lng: -46.6622, is_default: true,
  },
  {
    id: 'a2', customer_id: 'c2', label: 'Filial Centro', street: 'Av. Rio Branco', number: '156',
    city: 'Rio de Janeiro', state: 'RJ', zip: '20040-003', lat: -22.9035, lng: -43.1824, is_default: true,
  },
  {
    id: 'a3', customer_id: 'c3', label: 'Loja', street: 'Rua Oscar Freire', number: '800',
    city: 'São Paulo', state: 'SP', zip: '01426-001', lat: -23.5632, lng: -46.6717, is_default: true,
  },
];

export const mockMachines: Machine[] = [
  { id: 'm1', customer_id: 'c1', model: 'HP Indigo 7900', serial_number: 'HP-IND-2024-001', purchase_date: '2024-01-15', warranty_until: '2025-01-15', notes: 'Impressora digital' },
  { id: 'm2', customer_id: 'c2', model: 'Xerox Versant 280', serial_number: 'XR-VER-2023-042', purchase_date: '2023-06-20', warranty_until: '2024-06-20' },
  { id: 'm3', customer_id: 'c3', model: 'Konica Minolta C4050i', serial_number: 'KM-C40-2024-015', purchase_date: '2024-04-10', warranty_until: '2025-04-10' },
  { id: 'm4', customer_id: 'c1', model: 'Epson SureColor P9570', serial_number: 'EP-SC-2024-008', purchase_date: '2024-03-01', warranty_until: '2025-03-01' },
];

const today = new Date();
const fmt = (h: number, m: number) => {
  const d = new Date(today);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const mockServiceOrders: ServiceOrder[] = [
  {
    id: 'os1', code: 'OS-2026-0001', customer_id: 'c1', address_id: 'a1', machine_id: 'm1', technician_id: 'u2',
    type: 'corretiva', priority: 'alta', status: 'a_fazer',
    scheduled_start: fmt(8, 0), scheduled_end: fmt(9, 30), estimated_duration_min: 90,
    problem_description: 'Impressora apresentando falhas na alimentação de papel e manchas nas impressões. Cliente relata que o problema começou há 2 dias.',
    created_by: 'u1', created_at: '2026-02-07T14:00:00Z', updated_at: '2026-02-07T14:00:00Z',
    customer: mockCustomers[0], address: mockAddresses[0], machine: mockMachines[0], technician: mockUsers[1],
  },
  {
    id: 'os2', code: 'OS-2026-0002', customer_id: 'c2', address_id: 'a2', machine_id: 'm2', technician_id: 'u2',
    type: 'preventiva', priority: 'media', status: 'em_deslocamento',
    scheduled_start: fmt(10, 0), scheduled_end: fmt(11, 0), estimated_duration_min: 60,
    actual_departure_at: fmt(9, 50),
    problem_description: 'Manutenção preventiva trimestral. Verificar fusores, rolos e calibração de cores.',
    created_by: 'u1', created_at: '2026-02-06T10:00:00Z', updated_at: '2026-02-09T09:50:00Z',
    customer: mockCustomers[1], address: mockAddresses[1], machine: mockMachines[1], technician: mockUsers[1],
  },
  {
    id: 'os3', code: 'OS-2026-0003', customer_id: 'c3', address_id: 'a3', machine_id: 'm3', technician_id: 'u3',
    type: 'instalacao', priority: 'media', status: 'a_fazer',
    scheduled_start: fmt(9, 0), scheduled_end: fmt(12, 0), estimated_duration_min: 180,
    problem_description: 'Instalação de nova impressora multifuncional. Incluir configuração de rede e treinamento básico.',
    created_by: 'u1', created_at: '2026-02-05T16:00:00Z', updated_at: '2026-02-05T16:00:00Z',
    customer: mockCustomers[2], address: mockAddresses[2], machine: mockMachines[2], technician: mockUsers[2],
  },
  {
    id: 'os4', code: 'OS-2026-0004', customer_id: 'c1', address_id: 'a1', machine_id: 'm4', technician_id: 'u3',
    type: 'corretiva', priority: 'urgente', status: 'em_atendimento',
    scheduled_start: fmt(13, 0), scheduled_end: fmt(15, 0), estimated_duration_min: 120,
    actual_departure_at: fmt(12, 45), arrived_at: fmt(13, 10), started_at: fmt(13, 15),
    problem_description: 'Impressora parou completamente. Erro no cabeçote de impressão. Cliente com produção parada.',
    diagnosis: 'Cabeçote de impressão com entupimento severo. Necessário limpeza profunda e possível substituição.',
    created_by: 'u1', created_at: '2026-02-09T08:00:00Z', updated_at: '2026-02-09T13:15:00Z',
    customer: mockCustomers[0], address: mockAddresses[0], machine: mockMachines[3], technician: mockUsers[2],
  },
  {
    id: 'os5', code: 'OS-2026-0005', customer_id: 'c2', address_id: 'a2', machine_id: 'm2', technician_id: 'u4',
    type: 'treinamento', priority: 'baixa', status: 'concluido',
    scheduled_start: fmt(8, 0), scheduled_end: fmt(10, 0), estimated_duration_min: 120,
    actual_departure_at: fmt(7, 30), arrived_at: fmt(7, 55), started_at: fmt(8, 5), finished_at: fmt(9, 45),
    problem_description: 'Treinamento para nova equipe sobre operação e manutenção básica da Versant 280.',
    resolution: 'Treinamento concluído com sucesso. 4 operadores treinados.',
    created_by: 'u1', created_at: '2026-02-08T10:00:00Z', updated_at: '2026-02-09T09:45:00Z',
    customer: mockCustomers[1], address: mockAddresses[1], machine: mockMachines[1], technician: mockUsers[3],
  },
  {
    id: 'os6', code: 'OS-2026-0006', customer_id: 'c3', address_id: 'a3', machine_id: 'm3', technician_id: 'u4',
    type: 'corretiva', priority: 'alta', status: 'aguardando_peca',
    scheduled_start: fmt(14, 0), scheduled_end: fmt(16, 0), estimated_duration_min: 120,
    actual_departure_at: fmt(13, 40), arrived_at: fmt(14, 5), started_at: fmt(14, 10),
    problem_description: 'Bandeja de papel 2 não funciona. Sensor de papel pode estar com defeito.',
    diagnosis: 'Sensor de papel da bandeja 2 queimado. Necessário peça de reposição.',
    created_by: 'u1', created_at: '2026-02-08T12:00:00Z', updated_at: '2026-02-09T14:10:00Z',
    customer: mockCustomers[2], address: mockAddresses[2], machine: mockMachines[2], technician: mockUsers[3],
  },
];

export const mockChecklist: ChecklistItem[] = [
  { id: 'cl1', os_id: 'os4', label: 'Verificar alimentação elétrica', checked: true, checked_at: fmt(13, 20), required: true },
  { id: 'cl2', os_id: 'os4', label: 'Inspecionar cabeçote de impressão', checked: true, checked_at: fmt(13, 25), required: true },
  { id: 'cl3', os_id: 'os4', label: 'Verificar nível de tintas', checked: false, required: true },
  { id: 'cl4', os_id: 'os4', label: 'Teste de alinhamento', checked: false, required: true },
  { id: 'cl5', os_id: 'os4', label: 'Limpeza geral do equipamento', checked: false, required: false },
  { id: 'cl6', os_id: 'os4', label: 'Teste de impressão final', checked: false, required: true },
];

export const mockTimeline: TimelineComment[] = [
  { id: 't1', os_id: 'os4', kind: 'system', message: 'OS criada e atribuída ao técnico Lucas Ferreira', created_at: '2026-02-09T08:00:00Z', created_by: 'u1' },
  { id: 't2', os_id: 'os4', kind: 'system', message: 'Técnico iniciou deslocamento', created_at: fmt(12, 45), created_by: 'u3' },
  { id: 't3', os_id: 'os4', kind: 'system', message: 'Técnico chegou ao local', created_at: fmt(13, 10), created_by: 'u3' },
  { id: 't4', os_id: 'os4', kind: 'user', message: 'Cliente relata que o problema começou após atualização de firmware', created_at: fmt(13, 12), created_by: 'u3' },
  { id: 't5', os_id: 'os4', kind: 'system', message: 'Atendimento iniciado', created_at: fmt(13, 15), created_by: 'u3' },
];

// Helper to get technician's orders for today
export const getTechnicianOrders = (techId: string) =>
  mockServiceOrders.filter(os => os.technician_id === techId);

export const getOrdersByStatus = (status: string) =>
  mockServiceOrders.filter(os => os.status === status);

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/integrations/supabase/types';

type OSInsert = Database['public']['Tables']['service_orders']['Insert'];

export const useServiceOrders = () => {
  return useQuery({
    queryKey: ['service-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(*),
          address:customer_addresses(*),
          machine:machines(*)
        `)
        .order('scheduled_start', { ascending: true });
      if (error) throw error;

      // Fetch technician profiles separately
      const techIds = [...new Set(data?.map(d => d.technician_id).filter(Boolean) as string[])];
      let techMap: Record<string, any> = {};
      if (techIds.length > 0) {
        const { data: techs } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', techIds);
        if (techs) {
          techMap = Object.fromEntries(techs.map(t => [t.user_id, t]));
        }
      }

      return (data || []).map(os => ({
        ...os,
        technician: os.technician_id ? techMap[os.technician_id] || null : null,
      }));
    },
  });
};

export const useCreateServiceOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: Omit<OSInsert, 'code' | 'id'>) => {
      const { data, error } = await supabase
        .from('service_orders')
        .insert([{ ...order, code: '' }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
};

export const useUpdateServiceOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Database['public']['Tables']['service_orders']['Update']) => {
      const { data, error } = await supabase
        .from('service_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
};

export const useCustomerAddresses = (customerId?: string) => {
  return useQuery({
    queryKey: ['customer-addresses', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId!);
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
};

export const useMachines = (customerId?: string) => {
  return useQuery({
    queryKey: ['machines', customerId],
    queryFn: async () => {
      let query = supabase.from('machines').select('*');
      if (customerId) query = query.eq('customer_id', customerId);
      const { data, error } = await query.order('model');
      if (error) throw error;
      return data;
    },
    enabled: customerId === undefined || !!customerId,
  });
};

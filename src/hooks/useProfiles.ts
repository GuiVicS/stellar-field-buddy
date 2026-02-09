import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
};

export const useTechnicians = () => {
  return useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'tecnico')
        .eq('active', true);
      if (error) throw error;
      return data;
    },
  });
};

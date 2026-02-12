import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useChecklist = (osId?: string) => {
  return useQuery({
    queryKey: ['checklist', osId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('os_id', osId!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!osId,
  });
};

export const useToggleChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { error } = await supabase
        .from('checklist_items')
        .update({ checked, checked_at: checked ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
    },
  });
};

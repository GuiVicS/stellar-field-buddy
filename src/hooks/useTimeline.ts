import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useTimeline = (osId?: string) => {
  return useQuery({
    queryKey: ['timeline', osId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_comments')
        .select('*')
        .eq('os_id', osId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!osId,
  });
};

export const useAddTimelineComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (comment: { os_id: string; kind: string; message: string; created_by?: string }) => {
      const { error } = await supabase
        .from('timeline_comments')
        .insert([comment]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
};

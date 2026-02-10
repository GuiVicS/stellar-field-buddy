import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  reference_id: string | null;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!user?.user_id) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.user_id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['notifications', user.user_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.user_id, qc]);

  const query = useQuery<Notification[]>({
    queryKey: ['notifications', user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.user_id,
  });

  const unreadCount = (query.data ?? []).filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['notifications', user?.user_id] });
  };

  const markAllAsRead = async () => {
    if (!user?.user_id) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.user_id).eq('read', false);
    qc.invalidateQueries({ queryKey: ['notifications', user?.user_id] });
  };

  return { ...query, unreadCount, markAsRead, markAllAsRead };
};

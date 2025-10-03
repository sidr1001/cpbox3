import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('user_balance')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user balance:', error);
          setBalance(0);
        } else {
          setBalance(Number(data?.balance) || 0);
        }
      } catch (error) {
        console.error('Error fetching user balance:', error);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Subscribe to balance changes
    const channel = supabase
      .channel('user_balance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_balance',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && 'balance' in payload.new) {
            setBalance(Number(payload.new.balance));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { balance, loading };
}
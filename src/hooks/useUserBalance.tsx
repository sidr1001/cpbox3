import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
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
        const settings = await apiClient.getSettings();
        setBalance(Number(settings?.balance) || 0);
      } catch (error) {
        console.error('Error fetching user balance:', error);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    return () => {};
  }, [user]);

  return { balance, loading };
}
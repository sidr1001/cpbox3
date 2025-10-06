import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

export type UserRole = 'user' | 'admin' | 'superadmin';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const settings = await apiClient.getSettings();
        setRole(settings?.role || 'user');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin' || role === 'superadmin';

  return { role, loading, isSuperAdmin, isAdmin };
}
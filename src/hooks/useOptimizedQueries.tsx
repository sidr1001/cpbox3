import { useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { useCachedData } from './useCache';

// Оптимизированные запросы с кэшированием и пагинацией
export function useOptimizedPosts(userId: string, options: {
  limit?: number;
  offset?: number;
  status?: string;
  autoRefresh?: boolean;
} = {}) {
  const { limit = 20, offset = 0, status, autoRefresh = true } = options;

  const fetchPosts = useMemo(() => {
    return async () => {
      const data: any = await apiClient.getPosts({ limit, offset, status });
      const posts = Array.isArray(data) ? data : (data?.data || []);
      return {
        posts,
        total: data?.total ?? posts.length,
        hasMore: posts.length === limit,
      };
    };
  }, [userId, limit, offset, status]);

  return useCachedData(
    `posts-${userId}-${limit}-${offset}-${status || 'all'}`,
    fetchPosts,
    {
      ttl: 30000, // 30 секунд
      autoRefresh,
      refreshInterval: 60000, // 1 минута
    }
  );
}

export function useOptimizedUserStats(userId: string) {
  const fetchStats = useMemo(() => {
    return async () => {
      // Используем один запрос для получения всех статистик
      const data: any = await apiClient.getPosts({ limit: 1000, page: 1 });
      const posts = Array.isArray(data) ? data : (data?.data || []);
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      return {
        total: posts.length,
        published: posts.filter(p => p.status === 'published').length,
        scheduled: posts.filter(p => p.status === 'scheduled').length,
        draft: posts.filter(p => p.status === 'draft').length,
        error: posts.filter(p => p.status === 'error').length,
        thisWeek: posts.filter(p => new Date(p.created_at) > lastWeek).length,
        platforms: {
          vk: posts.filter(p => p.status === 'published' && p.platforms?.includes('vk')).length,
          telegram: posts.filter(p => p.status === 'published' && p.platforms?.includes('telegram')).length,
        },
      };
    };
  }, [userId]);

  return useCachedData(
    `user-stats-${userId}`,
    fetchStats,
    {
      ttl: 60000, // 1 минута
      autoRefresh: true,
      refreshInterval: 300000, // 5 минут
    }
  );
}

export function useOptimizedUserSettings(userId: string) {
  const fetchSettings = useMemo(() => {
    return async () => {
      const data: any = await apiClient.getSettings();
      return data || {
        vk_connected: false,
        telegram_connected: false,
        vk_token: null,
        telegram_token: null,
        telegram_chat_id: null,
      };
    };
  }, [userId]);

  return useCachedData(
    `user-settings-${userId}`,
    fetchSettings,
    {
      ttl: 300000, // 5 минут
      autoRefresh: false, // Настройки не обновляются автоматически
    }
  );
}

// Хук для батчевых операций
export function useBatchOperations() {
  const batchUpdate = async (_updates: Array<{ table: string; id: string; data: Record<string, any>; }>) => {
    const results: PromiseSettledResult<any>[] = [];
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return { successful, failed, results };
  };

  const batchDelete = async (_deletes: Array<{ table: string; id: string; }>) => {
    const results: PromiseSettledResult<any>[] = [];
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return { successful, failed, results };
  };

  return { batchUpdate, batchDelete };
}

// Хук для оптимизированного поиска
export function useOptimizedSearch(userId: string, query: string) {
  const fetchSearchResults = useMemo(() => {
    return async () => {
      if (!query.trim()) return { posts: [], total: 0 };

      const data: any = await apiClient.getPosts({ q: query, limit: 50 });
      const posts = Array.isArray(data) ? data : (data?.data || []);
      return { posts, total: posts.length };
    };
  }, [userId, query]);

  return useCachedData(
    `search-${userId}-${query}`,
    fetchSearchResults,
    {
      ttl: 60000, // 1 минута
      autoRefresh: false,
    }
  );
}
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      let query = supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          status,
          platforms,
          created_at,
          published_at,
          scheduled_at,
          media_urls,
          vk_post_id,
          telegram_message_id
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        posts: data || [],
        total: count || 0,
        hasMore: (data?.length || 0) === limit,
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
      const { data, error } = await supabase
        .from('posts')
        .select('status, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      const posts = data || [];
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
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

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
  const batchUpdate = async (updates: Array<{
    table: string;
    id: string;
    data: Record<string, any>;
  }>) => {
    const promises = updates.map(({ table, id, data }) =>
      supabase.from(table).update(data).eq('id', id)
    );

    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return { successful, failed, results };
  };

  const batchDelete = async (deletes: Array<{
    table: string;
    id: string;
  }>) => {
    const promises = deletes.map(({ table, id }) =>
      supabase.from(table).delete().eq('id', id)
    );

    const results = await Promise.allSettled(promises);
    
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

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return {
        posts: data || [],
        total: data?.length || 0,
      };
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
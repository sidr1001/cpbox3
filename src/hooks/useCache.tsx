import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

export function useCache<T>(key: string, options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options; // 5 minutes default TTL
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isExpired = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp > entry.ttl;
  }, []);

  const get = useCallback((cacheKey: string): T | null => {
    const entry = cacheRef.current.get(cacheKey);
    if (!entry || isExpired(entry)) {
      cacheRef.current.delete(cacheKey);
      return null;
    }
    return entry.data;
  }, [isExpired]);

  const set = useCallback((cacheKey: string, value: T, customTtl?: number): void => {
    // Очистка устаревших записей
    for (const [key, entry] of cacheRef.current.entries()) {
      if (isExpired(entry)) {
        cacheRef.current.delete(key);
      }
    }

    // Удаление старых записей если превышен лимит
    if (cacheRef.current.size >= maxSize) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }

    cacheRef.current.set(cacheKey, {
      data: value,
      timestamp: Date.now(),
      ttl: customTtl || ttl,
    });
  }, [isExpired, maxSize, ttl]);

  const invalidate = useCallback((cacheKey?: string): void => {
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  const fetchData = useCallback(async (
    fetchFn: () => Promise<T>,
    cacheKey: string = key,
    useCache: boolean = true
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      // Проверка кэша
      if (useCache) {
        const cachedData = get(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return cachedData;
        }
      }

      // Загрузка данных
      const result = await fetchFn();
      
      // Сохранение в кэш
      set(cacheKey, result);
      setData(result);
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, get, set]);

  return {
    data,
    loading,
    error,
    fetchData,
    invalidate,
    get,
    set,
  };
}

// Хук для кэширования данных с автоматическим обновлением
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions & { 
    autoRefresh?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const { autoRefresh = false, refreshInterval = 60000, ...cacheOptions } = options;
  const cache = useCache<T>(key, cacheOptions);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Первоначальная загрузка
    cache.fetchData(fetchFn);

    // Автоматическое обновление
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        cache.fetchData(fetchFn, key, false); // Не использовать кэш для обновления
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [key, autoRefresh, refreshInterval, cache, fetchFn]);

  return cache;
}
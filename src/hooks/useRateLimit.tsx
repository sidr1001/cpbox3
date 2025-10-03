import { useState, useCallback, useRef } from 'react';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitState {
  requests: number;
  resetTime: number;
}

export function useRateLimit(options: RateLimitOptions) {
  const { maxRequests, windowMs } = options;
  const [isLimited, setIsLimited] = useState(false);
  const stateRef = useRef<RateLimitState>({ requests: 0, resetTime: Date.now() + windowMs });

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const state = stateRef.current;

    // Сброс счетчика если окно истекло
    if (now > state.resetTime) {
      state.requests = 0;
      state.resetTime = now + windowMs;
      setIsLimited(false);
    }

    // Проверка лимита
    if (state.requests >= maxRequests) {
      setIsLimited(true);
      return false;
    }

    // Увеличение счетчика
    state.requests++;
    return true;
  }, [maxRequests, windowMs]);

  const reset = useCallback(() => {
    stateRef.current = { requests: 0, resetTime: Date.now() + windowMs };
    setIsLimited(false);
  }, [windowMs]);

  return {
    checkRateLimit,
    isLimited,
    reset,
    remainingRequests: Math.max(0, maxRequests - stateRef.current.requests),
    resetTime: stateRef.current.resetTime,
  };
}

// Хук для API запросов с rate limiting
export function useApiRateLimit() {
  const rateLimit = useRateLimit({
    maxRequests: 10, // 10 запросов
    windowMs: 60000, // в минуту
  });

  const makeRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    onRateLimited?: () => void
  ): Promise<T | null> => {
    if (!rateLimit.checkRateLimit()) {
      onRateLimited?.();
      throw new Error('Превышен лимит запросов. Попробуйте позже.');
    }

    try {
      return await requestFn();
    } catch (error) {
      // В случае ошибки не засчитываем запрос
      rateLimit.reset();
      throw error;
    }
  }, [rateLimit]);

  return {
    makeRequest,
    isLimited: rateLimit.isLimited,
    remainingRequests: rateLimit.remainingRequests,
    resetTime: rateLimit.resetTime,
  };
}
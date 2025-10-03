import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
) {
  const { immediate = false, onSuccess, onError } = options;
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async (...args: any[]): Promise<T> => {
    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Создаем новый AbortController
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFunction(...args);
      
      if (isMountedRef.current) {
        setState({
          data: result,
          loading: false,
          error: null,
        });
        
        onSuccess?.(result);
      }
      
      return result;
    } catch (error) {
      if (isMountedRef.current) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        setState({
          data: null,
          loading: false,
          error: err,
        });
        
        onError?.(err);
      }
      throw error;
    }
  }, [asyncFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
  };
}

// Хук для обработки форм с валидацией
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: (values: T) => Record<string, string>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку при изменении значения
    if (errors[name as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as string];
        return newErrors;
      });
    }
  }, [errors]);

  const setFieldTouched = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const validate = useCallback(() => {
    if (!validationSchema) return true;

    const validationErrors = validationSchema(values);
    setErrors(validationErrors);
    
    return Object.keys(validationErrors).length === 0;
  }, [values, validationSchema]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    setFieldError,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
    isTouched: Object.values(touched).some(Boolean),
  };
}

// Хук для debounced значений
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Хук для throttle
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}
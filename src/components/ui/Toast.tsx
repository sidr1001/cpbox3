import React from 'react';
import { toast as sonnerToast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

export function Toast({ title, description, type = 'info', duration = 5000, action }: ToastProps) {
  const Icon = toastIcons[type];
  const colorClass = toastColors[type];

  return (
    <div className="flex items-start space-x-3 p-4 bg-card border border-border rounded-lg shadow-lg">
      <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', colorClass)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-foreground">{title}</p>
        )}
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm text-primary hover:text-primary/80 mt-2 font-medium"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

// Улучшенная система уведомлений
export const toast = {
  success: (title: string, description?: string, options?: Partial<ToastProps>) => {
    sonnerToast.success(title, {
      description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  },
  
  error: (title: string, description?: string, options?: Partial<ToastProps>) => {
    sonnerToast.error(title, {
      description,
      duration: options?.duration || 7000,
      action: options?.action,
    });
  },
  
  warning: (title: string, description?: string, options?: Partial<ToastProps>) => {
    sonnerToast.warning(title, {
      description,
      duration: options?.duration || 6000,
      action: options?.action,
    });
  },
  
  info: (title: string, description?: string, options?: Partial<ToastProps>) => {
    sonnerToast.info(title, {
      description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  },
  
  loading: (title: string, description?: string) => {
    return sonnerToast.loading(title, {
      description,
    });
  },
  
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },
  
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
  
  dismissAll: () => {
    sonnerToast.dismiss();
  },
};

// Компонент для отображения прогресса
interface ProgressToastProps {
  title: string;
  progress: number;
  description?: string;
}

export function ProgressToast({ title, progress, description }: ProgressToastProps) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-card border border-border rounded-lg shadow-lg">
      <div className="w-5 h-5 mt-0.5 flex-shrink-0">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        <div className="mt-2 w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

// Хук для управления уведомлениями
export function useToast() {
  const showToast = React.useCallback((props: ToastProps) => {
    const { type = 'info', ...rest } = props;
    
    switch (type) {
      case 'success':
        toast.success(rest.title || '', rest.description, rest);
        break;
      case 'error':
        toast.error(rest.title || '', rest.description, rest);
        break;
      case 'warning':
        toast.warning(rest.title || '', rest.description, rest);
        break;
      case 'info':
      default:
        toast.info(rest.title || '', rest.description, rest);
        break;
    }
  }, []);

  return {
    toast: showToast,
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    loading: toast.loading,
    promise: toast.promise,
    dismiss: toast.dismiss,
    dismissAll: toast.dismissAll,
  };
}
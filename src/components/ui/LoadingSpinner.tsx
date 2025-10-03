import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Компонент для загрузки страниц
export function PageLoading({ text = 'Загрузка...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-main">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

// Компонент для загрузки карточек
export function CardLoading({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="bg-muted rounded-lg h-4 w-3/4 mb-2"></div>
      <div className="bg-muted rounded-lg h-3 w-1/2 mb-4"></div>
      <div className="bg-muted rounded-lg h-20 w-full"></div>
    </div>
  );
}

// Компонент для загрузки списков
export function ListLoading({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardLoading key={i} className="p-4" />
      ))}
    </div>
  );
}
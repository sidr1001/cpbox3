import React, { Suspense, lazy, ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Компонент загрузки
const LoadingFallback = () => (
  <Card className="bg-gradient-card border-border">
    <CardContent className="flex items-center justify-center py-12">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    </CardContent>
  </Card>
);

// HOC для lazy loading компонентов
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={fallback ? <fallback /> : <LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Lazy компоненты для страниц
export const LazyDashboard = withLazyLoading(() => import('@/pages/Dashboard'));
export const LazyCreatePost = withLazyLoading(() => import('@/pages/CreatePost'));
export const LazyHistory = withLazyLoading(() => import('@/pages/History'));
export const LazySettings = withLazyLoading(() => import('@/pages/Settings'));
export const LazyPayment = withLazyLoading(() => import('@/pages/Payment'));
export const LazyAdmin = withLazyLoading(() => import('@/pages/Admin'));

// Компонент для виртуализации списков
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Компонент для изображений с lazy loading
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
}

export function LazyImage({ 
  src, 
  alt, 
  placeholder = '/placeholder.svg',
  fallback = '/placeholder.svg',
  ...props 
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = React.useState(placeholder);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      setImageSrc(fallback);
      setHasError(true);
    };
    
    img.src = src;
  }, [src, fallback]);

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      style={{
        ...props.style,
        opacity: isLoaded ? 1 : 0.7,
        transition: 'opacity 0.3s ease',
      }}
      onError={() => setHasError(true)}
    />
  );
}
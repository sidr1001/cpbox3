// Система аналитики и мониторинга
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class Analytics {
  private isEnabled: boolean;
  private userId?: string;
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private metrics: PerformanceMetric[] = [];

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' && !!process.env.VITE_GA_TRACKING_ID;
    this.sessionId = this.generateSessionId();
    this.initializePerformanceObserver();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Отслеживание метрик производительности
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformance(entry);
        }
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  private trackPerformance(entry: PerformanceEntry): void {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.duration || entry.startTime,
      unit: 'ms',
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Отправка критических метрик
    if (entry.entryType === 'largest-contentful-paint' && entry.duration > 2500) {
      this.track('performance_issue', {
        metric: 'lcp',
        value: entry.duration,
        threshold: 2500,
      });
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) {
      console.log('Analytics event:', eventName, properties);
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
      userId: this.userId,
    };

    this.events.push(event);

    // Отправка в Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        ...properties,
        custom_parameter_1: this.sessionId,
      });
    }

    // Отправка в собственную систему аналитики
    this.sendToAnalytics(event);
  }

  private async sendToAnalytics(event: AnalyticsEvent): Promise<void> {
    try {
      // Здесь можно добавить отправку в собственную систему аналитики
      // Например, через Supabase Edge Function
      console.log('Sending analytics event:', event);
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  trackPageView(page: string, title?: string): void {
    this.track('page_view', {
      page,
      title: title || document.title,
    });

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.VITE_GA_TRACKING_ID!, {
        page_title: title || document.title,
        page_location: window.location.href,
      });
    }
  }

  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    });
  }

  trackUserAction(action: string, target?: string, value?: any): void {
    this.track('user_action', {
      action,
      target,
      value,
    });
  }

  trackPerformanceMetric(name: string, value: number, unit: string = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    this.track('performance_metric', { name, value, unit });
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clear(): void {
    this.events = [];
    this.metrics = [];
  }
}

// Глобальный экземпляр аналитики
export const analytics = new Analytics();

// Хуки для React
export function useAnalytics() {
  const track = React.useCallback((eventName: string, properties?: Record<string, any>) => {
    analytics.track(eventName, properties);
  }, []);

  const trackPageView = React.useCallback((page: string, title?: string) => {
    analytics.trackPageView(page, title);
  }, []);

  const trackError = React.useCallback((error: Error, context?: Record<string, any>) => {
    analytics.trackError(error, context);
  }, []);

  const trackUserAction = React.useCallback((action: string, target?: string, value?: any) => {
    analytics.trackUserAction(action, target, value);
  }, []);

  return {
    track,
    trackPageView,
    trackError,
    trackUserAction,
  };
}

// HOC для автоматического отслеживания
export function withAnalytics<P extends object>(
  Component: React.ComponentType<P>,
  trackingName?: string
) {
  const WrappedComponent = (props: P) => {
    const { trackPageView } = useAnalytics();

    React.useEffect(() => {
      if (trackingName) {
        trackPageView(trackingName);
      }
    }, [trackPageView]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withAnalytics(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Утилиты для отслеживания
export const trackPostCreated = (platforms: string[], hasMedia: boolean) => {
  analytics.track('post_created', {
    platforms: platforms.join(','),
    has_media: hasMedia,
    platform_count: platforms.length,
  });
};

export const trackPostPublished = (platforms: string[], success: boolean) => {
  analytics.track('post_published', {
    platforms: platforms.join(','),
    success,
    platform_count: platforms.length,
  });
};

export const trackPlatformConnected = (platform: string) => {
  analytics.track('platform_connected', {
    platform,
  });
};

export const trackUserRegistered = (method: string) => {
  analytics.track('user_registered', {
    method,
  });
};

export const trackErrorOccurred = (error: Error, context: string) => {
  analytics.track('error_occurred', {
    error_message: error.message,
    error_name: error.name,
    context,
    stack: error.stack,
  });
};

// Инициализация Google Analytics
export function initializeGoogleAnalytics() {
  if (typeof window === 'undefined' || !process.env.VITE_GA_TRACKING_ID) {
    return;
  }

  // Загрузка Google Analytics
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.VITE_GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Инициализация gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', process.env.VITE_GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
}

// Отслеживание производительности
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            analytics.trackPerformanceMetric('lcp', entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP tracking not supported:', error);
    }
  }

  // First Input Delay
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            analytics.trackPerformanceMetric('fid', entry.processingStart - entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID tracking not supported:', error);
    }
  }
}
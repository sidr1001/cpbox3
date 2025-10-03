// Система логирования
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private level: LogLevel;
  private sessionId: string;
  private userId?: string;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: Date.now(),
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Ограничиваем количество логов в памяти
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Отправка в консоль
    this.logToConsole(entry);
    
    // Отправка в систему мониторинга
    this.sendToMonitoring(entry);
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? JSON.stringify(entry.context, null, 2) : '';

    const logMessage = `[${timestamp}] ${levelName}: ${entry.message}${contextStr ? `\n${contextStr}` : ''}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
    }
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    // Отправка критических ошибок в систему мониторинга
    if (entry.level >= LogLevel.ERROR) {
      try {
        // Здесь можно добавить отправку в Sentry, LogRocket или другую систему
        console.log('Sending error to monitoring system:', entry);
      } catch (error) {
        console.error('Failed to send log to monitoring system:', error);
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(this.createLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(this.createLogEntry(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(this.createLogEntry(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : undefined,
      };
      this.addLog(this.createLogEntry(LogLevel.ERROR, message, errorContext));
    }
  }

  // Специализированные методы логирования
  logApiCall(method: string, url: string, status: number, duration: number, context?: Record<string, any>): void {
    this.info(`API ${method} ${url}`, {
      method,
      url,
      status,
      duration,
      ...context,
    });
  }

  logUserAction(action: string, target?: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      action,
      target,
      ...context,
    });
  }

  logPerformance(metric: string, value: number, unit: string, context?: Record<string, any>): void {
    this.info(`Performance: ${metric}`, {
      metric,
      value,
      unit,
      ...context,
    });
  }

  logSecurity(event: string, context?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, {
      event,
      ...context,
    });
  }

  // Получение логов
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  getLogsByTimeRange(startTime: number, endTime: number): LogEntry[] {
    return this.logs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime);
  }

  // Очистка логов
  clearLogs(): void {
    this.logs = [];
  }

  // Экспорт логов
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Глобальный экземпляр логгера
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);

// Хуки для React
export function useLogger() {
  const log = React.useCallback((level: LogLevel, message: string, context?: Record<string, any>) => {
    switch (level) {
      case LogLevel.DEBUG:
        logger.debug(message, context);
        break;
      case LogLevel.INFO:
        logger.info(message, context);
        break;
      case LogLevel.WARN:
        logger.warn(message, context);
        break;
      case LogLevel.ERROR:
        logger.error(message, undefined, context);
        break;
    }
  }, []);

  const logError = React.useCallback((message: string, error?: Error, context?: Record<string, any>) => {
    logger.error(message, error, context);
  }, []);

  const logInfo = React.useCallback((message: string, context?: Record<string, any>) => {
    logger.info(message, context);
  }, []);

  const logWarning = React.useCallback((message: string, context?: Record<string, any>) => {
    logger.warn(message, context);
  }, []);

  const logDebug = React.useCallback((message: string, context?: Record<string, any>) => {
    logger.debug(message, context);
  }, []);

  return {
    log,
    logError,
    logInfo,
    logWarning,
    logDebug,
  };
}

// HOC для автоматического логирования
export function withLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const { logInfo, logError } = useLogger();
    const name = componentName || Component.displayName || Component.name;

    React.useEffect(() => {
      logInfo(`Component ${name} mounted`);
      
      return () => {
        logInfo(`Component ${name} unmounted`);
      };
    }, [logInfo, name]);

    React.useEffect(() => {
      const handleError = (error: ErrorEvent) => {
        logError(`Error in component ${name}`, error.error, {
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
        });
      };

      window.addEventListener('error', handleError);
      
      return () => {
        window.removeEventListener('error', handleError);
      };
    }, [logError, name]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withLogging(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Утилиты для логирования
export const logApiError = (error: any, context: Record<string, any> = {}) => {
  logger.error('API Error', error, {
    ...context,
    type: 'api_error',
  });
};

export const logUserError = (error: Error, action: string, context: Record<string, any> = {}) => {
  logger.error(`User Error: ${action}`, error, {
    ...context,
    type: 'user_error',
    action,
  });
};

export const logSystemError = (error: Error, component: string, context: Record<string, any> = {}) => {
  logger.error(`System Error in ${component}`, error, {
    ...context,
    type: 'system_error',
    component,
  });
};

export const logSecurityEvent = (event: string, context: Record<string, any> = {}) => {
  logger.logSecurity(event, {
    ...context,
    timestamp: Date.now(),
  });
};
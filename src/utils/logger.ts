// Centralized logging system with levels and formatting

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  prefix: string;
  showTimestamp: boolean;
  showContext: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#9CA3AF',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
};

const defaultConfig: LoggerConfig = {
  enabled: import.meta.env.DEV,
  minLevel: 'debug',
  prefix: '[Teia]',
  showTimestamp: true,
  showContext: true,
};

class Logger {
  private config: LoggerConfig;
  private history: LogEntry[] = [];
  private maxHistorySize = 100;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const parts: string[] = [];
    
    if (this.config.prefix) {
      parts.push(this.config.prefix);
    }
    
    if (this.config.showTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    parts.push(`[${level.toUpperCase()}]`);
    
    if (context && this.config.showContext) {
      parts.push(`[${context}]`);
    }
    
    parts.push(message);
    
    return parts.join(' ');
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    };

    // Add to history
    this.history.push(entry);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    const formattedMessage = this.formatMessage(level, message, context);
    const color = LOG_COLORS[level];

    switch (level) {
      case 'debug':
        console.debug(`%c${formattedMessage}`, `color: ${color}`, data ?? '');
        break;
      case 'info':
        console.info(`%c${formattedMessage}`, `color: ${color}`, data ?? '');
        break;
      case 'warn':
        console.warn(`%c${formattedMessage}`, `color: ${color}`, data ?? '');
        break;
      case 'error':
        console.error(`%c${formattedMessage}`, `color: ${color}`, data ?? '');
        break;
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log('error', message, context, data);
  }

  // Get log history for debugging
  getHistory(): LogEntry[] {
    return [...this.history];
  }

  // Clear log history
  clearHistory(): void {
    this.history = [];
  }

  // Create a child logger with a specific context
  createContext(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }

  // Update configuration
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

class ContextLogger {
  constructor(
    private parent: Logger,
    private context: string
  ) {}

  debug(message: string, data?: unknown): void {
    this.parent.debug(message, this.context, data);
  }

  info(message: string, data?: unknown): void {
    this.parent.info(message, this.context, data);
  }

  warn(message: string, data?: unknown): void {
    this.parent.warn(message, this.context, data);
  }

  error(message: string, data?: unknown): void {
    this.parent.error(message, this.context, data);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export context loggers for specific modules
export const authLogger = logger.createContext('Auth');
export const apiLogger = logger.createContext('API');
export const uiLogger = logger.createContext('UI');
export const metricsLogger = logger.createContext('Metrics');

export { Logger, ContextLogger };
export type { LogLevel, LogEntry, LoggerConfig };

/**
 * Structured logging utility for API routes
 */

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}

interface LogContext {
    requestId?: string;
    userId?: string;
    method?: string;
    path?: string;
    ip?: string;
    duration?: number;
    [key: string]: any;
}

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: LogContext;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

class Logger {
    private context: LogContext = {};

    setContext(context: LogContext): void {
        this.context = { ...this.context, ...context };
    }

    clearContext(): void {
        this.context = {};
    }

    private log(level: LogLevel, message: string, additionalContext?: LogContext): void {
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            context: { ...this.context, ...additionalContext },
        };

        // In production, send to logging service (e.g., Axiom, Datadog, CloudWatch)
        // For now, use console with structured format
        const logMethod = level === LogLevel.ERROR ? console.error : console.log;
        logMethod(JSON.stringify(entry));
    }

    debug(message: string, context?: LogContext): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    info(message: string, context?: LogContext): void {
        this.log(LogLevel.INFO, message, context);
    }

    warn(message: string, context?: LogContext): void {
        this.log(LogLevel.WARN, message, context);
    }

    error(message: string, error?: Error, context?: LogContext): void {
        const entry: LogEntry = {
            level: LogLevel.ERROR,
            message,
            timestamp: new Date().toISOString(),
            context: { ...this.context, ...context },
        };

        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            };
        }

        console.error(JSON.stringify(entry));
    }

    /**
     * Log API request
     */
    logRequest(method: string, path: string, context?: LogContext): void {
        this.info('API Request', {
            method,
            path,
            ...context,
        });
    }

    /**
     * Log API response
     */
    logResponse(
        method: string,
        path: string,
        statusCode: number,
        duration: number,
        context?: LogContext
    ): void {
        const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

        this.log(level, 'API Response', {
            method,
            path,
            statusCode,
            duration,
            ...context,
        });
    }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create a logger with request context
 */
export function createRequestLogger(requestId: string, userId?: string): Logger {
    const requestLogger = new Logger();
    requestLogger.setContext({ requestId, userId });
    return requestLogger;
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

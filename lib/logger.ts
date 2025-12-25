import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Helper functions for structured logging
export const log = {
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(meta, message);
  },
  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    const errorMeta: Record<string, unknown> = { ...meta };
    
    if (error instanceof Error) {
      errorMeta.error = {
        message: error.message,
        name: error.name,
        ...(isDevelopment && { stack: error.stack }),
      };
    } else if (error) {
      errorMeta.error = error;
    }
    
    logger.error(errorMeta, message);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(meta, message);
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(meta, message);
  },
};


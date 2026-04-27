/**
 * Centralized Logger Utility
 * DRY Principle: Single source of truth for all logging
 * 
 * Usage:
 * logger.info('User logged in', { userId: 123 });
 * logger.error('Database error', error, { query: 'SELECT...' });
 * logger.warn('Low stock alert', { productId: 456 });
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
};

const LOG_COLORS = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m',
};

class Logger {
  constructor(minLevel = LOG_LEVELS.INFO) {
    this.minLevel = minLevel;
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
  }

  /**
   * Format log entry
   */
  formatLog(level, message, context = {}, error = null) {
    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level];
    
    const logEntry = {
      timestamp,
      level: levelName,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
      } : null,
    };

    return logEntry;
  }

  /**
   * Store log entry
   */
  storeLog(logEntry) {
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Output log to console
   */
  outputLog(logEntry) {
    const { timestamp, level, message, context, error } = logEntry;
    const color = LOG_COLORS[level];
    const reset = LOG_COLORS.RESET;

    let output = `${color}[${timestamp}] [${level}]${reset} ${message}`;

    if (Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`;
    }

    if (error) {
      output += `\n${error.stack}`;
    }

    console.log(output);
  }

  /**
   * Log at specified level
   */
  log(level, message, context = {}, error = null) {
    if (level < this.minLevel) return;

    const logEntry = this.formatLog(level, message, context, error);
    this.storeLog(logEntry);
    this.outputLog(logEntry);
  }

  /**
   * Debug level logging
   */
  debug(message, context = {}) {
    this.log(LOG_LEVELS.DEBUG, message, context);
  }

  /**
   * Info level logging
   */
  info(message, context = {}) {
    this.log(LOG_LEVELS.INFO, message, context);
  }

  /**
   * Warning level logging
   */
  warn(message, context = {}) {
    this.log(LOG_LEVELS.WARN, message, context);
  }

  /**
   * Error level logging
   */
  error(message, error = null, context = {}) {
    this.log(LOG_LEVELS.ERROR, message, context, error);
  }

  /**
   * Get logs
   */
  getLogs(filter = {}) {
    let filtered = [...this.logs];

    if (filter.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }

    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime();
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() >= sinceTime);
    }

    if (filter.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs to file format
   */
  exportLogs(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'context', 'error'];
      const rows = this.logs.map(log => [
        log.timestamp,
        log.level,
        log.message,
        JSON.stringify(log.context),
        log.error ? log.error.message : '',
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return this.logs;
  }
}

/**
 * Create global logger instance
 */
const logger = new Logger(LOG_LEVELS.INFO);

/**
 * Middleware for Express - log all requests
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const context = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      logger.warn(`HTTP ${res.statusCode}`, context);
    } else {
      logger.info(`HTTP ${res.statusCode}`, context);
    }
  });

  next();
};

/**
 * Middleware for Express - log errors
 */
export const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', err, {
    method: req.method,
    path: req.path,
    body: req.body,
  });

  next(err);
};

export default logger;

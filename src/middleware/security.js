/**
 * Security Middleware
 * SQL injection prevention, input sanitization, rate limiting
 */

const rateLimit = require('express-rate-limit');

/**
 * Sanitize input to prevent SQL injection
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
};

/**
 * Sanitize request body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(v => typeof v === 'string' ? sanitizeInput(v) : v);
      } else {
        sanitized[key] = value;
      }
    }
    req.body = sanitized;
  }
  next();
};

/**
 * Rate limiter for API endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter for sensitive operations
 */
const sensitiveOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many sensitive operations, please try again later',
});

module.exports = {
  sanitizeInput,
  sanitizeBody,
  apiLimiter,
  authLimiter,
  sensitiveOpLimiter,
};

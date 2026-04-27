/**
 * Error Handling Middleware
 * Centralized error handling for all routes
 */

const { logger } = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const error = {
    requestId: req.id,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    status: err.statusCode || 500,
    message: err.message || 'Internal Server Error',
  };

  // Log error based on severity
  if (error.status >= 500) {
    logger.error(JSON.stringify(error));
  } else if (error.status >= 400) {
    logger.warn(JSON.stringify(error));
  } else {
    logger.info(JSON.stringify(error));
  }

  // Send response
  res.status(error.status).json({
    error: error.message,
    code: err.code || 'INTERNAL_ERROR',
    requestId: error.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.id,
  });
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};

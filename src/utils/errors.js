/**
 * Centralized Error Handling Utility
 * DRY Principle: Single source of truth for all error types
 * 
 * Usage:
 * throw new ValidationError('Invalid prescription', 'INVALID_RX');
 * throw new BusinessLogicError('Insufficient credit', 'CREDIT_LIMIT_EXCEEDED');
 * throw new DatabaseError('Query failed', 'DB_QUERY_ERROR');
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Validation error - when input data is invalid
 */
export class ValidationError extends AppError {
  constructor(message, code = 'VALIDATION_ERROR', details = null) {
    super(message, code, 400, details);
  }
}

/**
 * Business logic error - when business rules are violated
 */
export class BusinessLogicError extends AppError {
  constructor(message, code = 'BUSINESS_LOGIC_ERROR', statusCode = 422, details = null) {
    super(message, code, statusCode, details);
  }
}

/**
 * Database error - when database operations fail
 */
export class DatabaseError extends AppError {
  constructor(message, code = 'DATABASE_ERROR', details = null) {
    super(message, code, 500, details);
  }
}

/**
 * Authentication error - when user is not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, code, 401);
  }
}

/**
 * Authorization error - when user doesn't have permission
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, code, 403);
  }
}

/**
 * Not found error - when resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message, code = 'NOT_FOUND', resource = null) {
    super(message, code, 404, { resource });
  }
}

/**
 * Conflict error - when resource already exists
 */
export class ConflictError extends AppError {
  constructor(message, code = 'CONFLICT', details = null) {
    super(message, code, 409, details);
  }
}

/**
 * External service error - when external API fails
 */
export class ExternalServiceError extends AppError {
  constructor(message, code = 'EXTERNAL_SERVICE_ERROR', service = null, details = null) {
    super(message, code, 502, { service, ...details });
  }
}

/**
 * Error handler middleware for Express
 * Usage: app.use(errorHandler);
 */
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Unknown error
  const appError = new AppError(
    err.message || 'Internal Server Error',
    'INTERNAL_SERVER_ERROR',
    500
  );

  res.status(500).json(appError.toJSON());
};

/**
 * Async error wrapper for Express routes
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Error logger utility
 */
export const logError = (error, context = {}) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    code: error.code,
    context,
    stack: error.stack,
  };

  console.error('[ERROR]', JSON.stringify(errorData, null, 2));
};

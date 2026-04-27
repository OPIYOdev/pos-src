/**
 * Validation Middleware
 * Request body and parameter validation
 */

const { ValidationError } = require('../utils/errors');

/**
 * Validate request body against schema
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const messages = error.details.map(d => d.message).join(', ');
        throw new ValidationError(messages);
      }

      req.body = value;
      next();
    } catch (err) {
      res.status(400).json({
        error: 'Validation Error',
        message: err.message,
        requestId: req.id,
      });
    }
  };
};

/**
 * Validate request parameters against schema
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const messages = error.details.map(d => d.message).join(', ');
        throw new ValidationError(messages);
      }

      req.params = value;
      next();
    } catch (err) {
      res.status(400).json({
        error: 'Validation Error',
        message: err.message,
        requestId: req.id,
      });
    }
  };
};

/**
 * Validate query parameters against schema
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const messages = error.details.map(d => d.message).join(', ');
        throw new ValidationError(messages);
      }

      req.query = value;
      next();
    } catch (err) {
      res.status(400).json({
        error: 'Validation Error',
        message: err.message,
        requestId: req.id,
      });
    }
  };
};

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
};

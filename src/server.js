'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Import utilities
const { logger } = require('./utils/logger');
const { AppError, asyncHandler } = require('./utils/errors');

// Import routes
const transferRoutes = require('./reallocation/transferRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts',
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// ============================================================================
// BODY PARSING & COMPRESSION
// ============================================================================

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(compression());

// ============================================================================
// REQUEST TRACKING
// ============================================================================

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ============================================================================
// LOGGING
// ============================================================================

app.use(morgan((tokens, req, res) => {
  const log = {
    timestamp: new Date().toISOString(),
    requestId: req.id,
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens['response-time'](req, res),
  };
  logger.info(JSON.stringify(log));
  return null;
}));

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    requestId: req.id,
    uptime: process.uptime(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Pharmacy POS System',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/transfers', transferRoutes);

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.id,
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  const error = {
    requestId: req.id,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  if (err instanceof AppError) {
    error.status = err.statusCode;
    error.message = err.message;
    error.code = err.code;
    logger.warn(JSON.stringify(error));
    return res.status(err.statusCode).json(error);
  }

  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation Error';
    error.details = err.message;
    logger.warn(JSON.stringify(error));
    return res.status(400).json(error);
  }

  if (err.name === 'JsonWebTokenError') {
    error.status = 401;
    error.message = 'Invalid token';
    logger.warn(JSON.stringify(error));
    return res.status(401).json(error);
  }

  error.status = 500;
  error.message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
  logger.error(JSON.stringify(error));

  res.status(500).json(error);
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

module.exports = app;

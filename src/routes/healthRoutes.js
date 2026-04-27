/**
 * Health Check Routes
 * Monitoring and system health endpoints
 */

const { asyncHandler } = require('../middleware/errorHandler');
const { getDb } = require('../db');

module.exports = (app) => {
  /**
   * Basic health check
   */
  app.get('/health', asyncHandler(async (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }));

  /**
   * API health check
   */
  app.get('/api/health', asyncHandler(async (req, res) => {
    const db = await getDb();
    const dbHealthy = db ? true : false;

    res.json({
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    });
  }));

  /**
   * Detailed system status
   */
  app.get('/api/system/status', asyncHandler(async (req, res) => {
    const db = await getDb();
    
    let dbConnections = 0;
    let dbStatus = 'disconnected';
    
    if (db) {
      try {
        const result = await db.query('SELECT 1');
        dbStatus = 'connected';
        dbConnections = 1;
      } catch (err) {
        dbStatus = 'error';
      }
    }

    res.json({
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      database: {
        status: dbStatus,
        connections: dbConnections,
      },
      timestamp: new Date().toISOString(),
    });
  }));
};

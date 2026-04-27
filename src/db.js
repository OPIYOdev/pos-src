/**
 * Database Connection Pool
 * MySQL connection management with pooling and error handling
 */

'use strict';

const mysql = require('mysql2/promise');
const { logger } = require('./utils/logger');

const DATABASE_URL = process.env.DATABASE_URL;

let pool = null;

/**
 * Initialize database connection pool
 */
async function initializePool() {
  try {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    pool = mysql.createPool({
      connectionLimit: 10,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0,
      waitForConnections: true,
      queueLimit: 0,
      uri: DATABASE_URL,
      multipleStatements: true,
      timezone: '+00:00',
    });

    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    logger.info('Database connection pool initialized successfully');
    return pool;
  } catch (err) {
    logger.error(`Failed to initialize database pool: ${err.message}`);
    throw err;
  }
}

/**
 * Get database connection from pool
 */
async function getConnection() {
  if (!pool) {
    await initializePool();
  }

  try {
    return await pool.getConnection();
  } catch (err) {
    logger.error(`Failed to get database connection: ${err.message}`);
    throw err;
  }
}

/**
 * Execute query with connection pooling
 */
async function query(sql, values = []) {
  const connection = await getConnection();

  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } catch (err) {
    logger.error(`Query execution failed: ${err.message}`);
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Execute multiple queries in transaction
 */
async function transaction(queries) {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const results = [];
    for (const { sql, values } of queries) {
      const [result] = await connection.execute(sql, values);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (err) {
    await connection.rollback();
    logger.error(`Transaction failed: ${err.message}`);
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Close database connection pool
 */
async function closePool() {
  if (pool) {
    try {
      await pool.end();
      logger.info('Database connection pool closed');
    } catch (err) {
      logger.error(`Failed to close connection pool: ${err.message}`);
    }
  }
}

module.exports = {
  initializePool,
  getConnection,
  query,
  transaction,
  closePool,
};

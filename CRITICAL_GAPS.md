# 🚀 Implementation Plan: Critical Gaps Fix

**Created:** April 30, 2026  
**Phase Duration:** 2 weeks (120 hours)  
**Goal:** Make system runnable end-to-end with full API integration

---

## Overview & Prerequisites

### Before Starting
1. Ensure Node.js 18+ and MySQL 8.0 are installed
2. Clone the repository and run `npm install`
3. Have Docker and docker-compose available
4. Team members assigned and trained on architecture

### Deliverables by End of Phase
- ✅ Environment configuration system (secure secrets handling)
- ✅ Database schema applied to MySQL
- ✅ All critical API endpoints implemented (25+ routes)
- ✅ Frontend-backend integration (all pages connected)
- ✅ Basic E2E testing for critical flows
- ✅ Deployment documentation

---

## 1️⃣ PHASE 1: Environment Configuration (Day 1-2)

### 1.1 Create Environment Configuration System

**Objective:** Secure secrets management without hardcoding

#### Step 1: Create .env.example File

```bash
# File: .env.example (commit to repo)
# Copy this file to .env and fill in actual values

# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=pharmacy_user
DATABASE_PASSWORD=change_me_in_production
DATABASE_NAME=pharmacy_pos

# JWT Configuration
JWT_SECRET=change_me_to_secure_random_string_min_32_chars
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=change_me_to_another_secure_random_string
JWT_REFRESH_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# External Services
MPESA_API_KEY=your_mpesa_api_key
MPESA_SHORTCODE=your_shortcode
ETIMS_API_KEY=your_etims_api_key
ETIMS_BASE_URL=https://etims.kra.go.ke

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Encryption
ENCRYPTION_KEY=change_me_to_secure_encryption_key_32_chars
ENCRYPTION_IV=change_me_to_16_char_iv

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Feature Flags
ENABLE_MULTI_BRANCH=true
ENABLE_INSURANCE_CLAIMS=true
ENABLE_ETIMS=true
```

**Status:** `TODO: Create file`

#### Step 2: Create .env.production File (NOT in repo, use secrets vault)

```bash
# File: .env.production (add to .gitignore, use CI/CD secrets)
NODE_ENV=production
PORT=3000
DATABASE_HOST=prod-db.example.com
DATABASE_USER=pharmacy_user
DATABASE_PASSWORD=VERY_SECURE_PASSWORD_FROM_VAULT
JWT_SECRET=VERY_SECURE_SECRET_FROM_VAULT
# ... other production values
```

**Status:** `TODO: Create per environment`

#### Step 3: Update .gitignore

```bash
# File: .gitignore (add these lines if not present)
.env
.env.local
.env.production
.env.*.local
!.env.example
```

**Status:** `TODO: Update file`

#### Step 4: Update src/server.js to Use Environment Variables

**Replace hardcoded values:**

```javascript
// BEFORE (src/server.js - around line 30-50)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// AFTER (updated)
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Add validation at startup
if (!JWT_SECRET) {
  logger.error('JWT_SECRET environment variable is not set');
  process.exit(1);
}

if (NODE_ENV === 'production' && !process.env.DATABASE_PASSWORD) {
  logger.error('DATABASE_PASSWORD must be set in production');
  process.exit(1);
}
```

**Status:** `TODO: Update file`

#### Step 5: Create src/config/index.js

```javascript
// File: src/config/index.js
// Centralized configuration with validation

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  // Server
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || 'localhost',
  },

  // Database
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
    user: process.env.DATABASE_USER || 'pharmacy_user',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'pharmacy_pos',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 5,
  },

  // Feature Flags
  features: {
    multiBranch: process.env.ENABLE_MULTI_BRANCH === 'true',
    insuranceClaims: process.env.ENABLE_INSURANCE_CLAIMS === 'true',
    etims: process.env.ENABLE_ETIMS === 'true',
  },

  // External Services
  services: {
    mpesa: {
      apiKey: process.env.MPESA_API_KEY,
      shortcode: process.env.MPESA_SHORTCODE,
    },
    etims: {
      apiKey: process.env.ETIMS_API_KEY,
      baseUrl: process.env.ETIMS_BASE_URL,
    },
  },
};

// Validation
function validateConfig() {
  const required = ['JWT_SECRET', 'DATABASE_USER'];
  
  if (config.server.env === 'production') {
    required.push('DATABASE_PASSWORD', 'JWT_REFRESH_SECRET');
  }

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

validateConfig();

module.exports = config;
```

**Status:** `TODO: Create file`

#### Step 6: Update src/server.js to Use Config

```javascript
// Add at top of src/server.js
const config = require('./config');

// Replace all process.env references with config
const PORT = config.server.port;
const JWT_SECRET = config.jwt.secret;

// Update CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));
```

**Status:** `TODO: Update file`

### 1.2 Update Docker Configuration

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: pharmacy-pos-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DATABASE_PASSWORD:-root}
      MYSQL_DATABASE: ${DATABASE_NAME:-pharmacy_pos}
      MYSQL_USER: ${DATABASE_USER:-pharmacy_user}
      MYSQL_PASSWORD: ${DATABASE_PASSWORD:-pharmacy_password}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  app:
    build: .
    container_name: pharmacy-pos-app
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      DATABASE_HOST: mysql
      DATABASE_USER: ${DATABASE_USER:-pharmacy_user}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD:-pharmacy_password}
      DATABASE_NAME: ${DATABASE_NAME:-pharmacy_pos}
      PORT: 3000
      JWT_SECRET: ${JWT_SECRET:-change_me}
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

volumes:
  mysql_data:
```

**Status:** `TODO: Update file`

### 1.3 Update package.json Scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "setup:env": "cp .env.example .env && echo 'Created .env - fill in values'",
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "node scripts/seed.js",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "scheduler": "node src/jobs/scheduler.js",
    "test": "jest --coverage"
  }
}
```

**Status:** `TODO: Update file`

### Summary: Phase 1 Deliverables
- ✅ .env.example with all configuration options
- ✅ .env.production template created
- ✅ src/config/index.js centralized configuration
- ✅ src/server.js updated to use config
- ✅ docker-compose.yml updated for environment variables
- ✅ package.json scripts added

**Estimated Time:** 4 hours  
**Status:** 🔴 NOT STARTED

---

## 2️⃣ PHASE 2: Database Schema Application (Day 2-3)

### 2.1 Create Database Migration System

**Objective:** Apply Drizzle schema to actual MySQL database

#### Step 1: Create Migration Script

**File:** `scripts/migrate.js`

```javascript
// scripts/migrate.js
'use strict';

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'root',
    database: process.env.DATABASE_NAME || 'pharmacy_pos',
  };

  const connection = await mysql.createConnection({
    ...config,
    multipleStatements: true,
  });

  try {
    console.log('🔄 Running database migrations...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../sql/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await connection.query(schema);
    console.log('✅ Schema migration completed');

    // Read and execute stored procedures
    const proceduresDir = path.join(__dirname, '../sql/stored_procedures');
    const procedures = fs.readdirSync(proceduresDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const proc of procedures) {
      const procPath = path.join(proceduresDir, proc);
      const procSQL = fs.readFileSync(procPath, 'utf8');
      await connection.query(procSQL);
      console.log(`✅ Procedure ${proc} created`);
    }

    // Read and execute schema additions
    const additionsPath = path.join(__dirname, '../sql/schema_additions.sql');
    if (fs.existsSync(additionsPath)) {
      const additions = fs.readFileSync(additionsPath, 'utf8');
      await connection.query(additions);
      console.log('✅ Schema additions applied');
    }

    console.log('✨ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigrations();
```

**Usage:**
```bash
# Run migrations
npm run db:migrate

# Or with custom env
DATABASE_HOST=prod-db npm run db:migrate
```

**Status:** `TODO: Create file`

#### Step 2: Verify/Convert Drizzle Schema to SQL

The `drizzle/schema.ts` file needs to be converted to pure SQL. Create `sql/schema.sql`:

**File:** `sql/schema.sql` (excerpt - 28 tables total)

```sql
-- Core Tables
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320) UNIQUE,
  phone VARCHAR(20),
  loginMethod VARCHAR(64),
  role ENUM('admin', 'manager', 'pharmacist', 'cashier', 'dispenser', 'accountant', 'claims_officer', 'auditor') DEFAULT 'cashier' NOT NULL,
  branchId INT,
  isActive BOOLEAN DEFAULT TRUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY (openId),
  INDEX idx_user_role (role),
  INDEX idx_user_branch (branchId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  region VARCHAR(100),
  managerId INT,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(320),
  isActive BOOLEAN DEFAULT TRUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY (name),
  INDEX idx_branch_manager (managerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS suppliers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  contactPerson VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(320),
  address TEXT,
  paymentTerms VARCHAR(100),
  isActive BOOLEAN DEFAULT TRUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ... (Continue for all 28 tables - see SCHEMA.md for complete definitions)
```

**Status:** `TODO: Complete conversion to SQL`

#### Step 3: Create Seed Data Script (Optional but Recommended)

**File:** `scripts/seed.js`

```javascript
// scripts/seed.js
'use strict';

const mysql = require('mysql2/promise');
require('dotenv').config();

const seedData = {
  users: [
    { openId: 'admin001', name: 'Admin User', email: 'admin@pharmacy.local', role: 'admin', branchId: 1, isActive: true },
    { openId: 'mgr001', name: 'Branch Manager', email: 'manager@pharmacy.local', role: 'manager', branchId: 1, isActive: true },
    { openId: 'pharm001', name: 'John Pharmacist', email: 'john@pharmacy.local', role: 'pharmacist', branchId: 1, isActive: true },
    { openId: 'cash001', name: 'Jane Cashier', email: 'jane@pharmacy.local', role: 'cashier', branchId: 1, isActive: true },
  ],
  branches: [
    { name: 'Main Branch', region: 'Nairobi', managerId: 2, phone: '+254-20-123-4567', email: 'main@pharmacy.local' },
    { name: 'West Branch', region: 'Kisumu', managerId: null, phone: '+254-57-123-4567', email: 'west@pharmacy.local' },
    { name: 'East Branch', region: 'Mombasa', managerId: null, phone: '+254-41-123-4567', email: 'east@pharmacy.local' },
  ],
  suppliers: [
    { name: 'Pharma Wholesaler Ltd', contactPerson: 'John Doe', phone: '+254-20-999-8888', email: 'sales@pharma.co.ke', paymentTerms: 'Net 30' },
    { name: 'Drug Distributor Kenya', contactPerson: 'Jane Smith', phone: '+254-20-999-7777', email: 'orders@drugs.co.ke', paymentTerms: 'Net 15' },
  ],
};

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'root',
    database: process.env.DATABASE_NAME || 'pharmacy_pos',
  });

  try {
    console.log('🌱 Seeding database...');

    // Seed branches first (no dependencies)
    for (const branch of seedData.branches) {
      await connection.execute(
        'INSERT INTO branches (name, region, managerId, phone, email) VALUES (?, ?, ?, ?, ?)',
        [branch.name, branch.region, branch.managerId, branch.phone, branch.email]
      );
    }
    console.log(`✅ Seeded ${seedData.branches.length} branches`);

    // Seed users
    for (const user of seedData.users) {
      await connection.execute(
        'INSERT INTO users (openId, name, email, role, branchId, isActive) VALUES (?, ?, ?, ?, ?, ?)',
        [user.openId, user.name, user.email, user.role, user.branchId, user.isActive]
      );
    }
    console.log(`✅ Seeded ${seedData.users.length} users`);

    // Seed suppliers
    for (const supplier of seedData.suppliers) {
      await connection.execute(
        'INSERT INTO suppliers (name, contactPerson, phone, email, paymentTerms) VALUES (?, ?, ?, ?, ?)',
        [supplier.name, supplier.contactPerson, supplier.phone, supplier.email, supplier.paymentTerms]
      );
    }
    console.log(`✅ Seeded ${seedData.suppliers.length} suppliers`);

    console.log('✨ Database seeding completed');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedDatabase();
```

**Usage:**
```bash
npm run db:seed
```

**Status:** `TODO: Create file`

### 2.2 Apply Schema

```bash
# Step 1: Create .env with database credentials
cp .env.example .env

# Edit .env with your local database details
DATABASE_HOST=localhost
DATABASE_USER=pharmacy_user
DATABASE_PASSWORD=pharmacy_password
DATABASE_NAME=pharmacy_pos

# Step 2: Run migrations
npm run db:migrate

# Step 3: Seed sample data
npm run db:seed

# Step 4: Verify in MySQL
mysql -u pharmacy_user -p pharmacy_pos
> SHOW TABLES;  # Should show 28 tables
```

**Status:** `TODO: Execute`

### Summary: Phase 2 Deliverables
- ✅ scripts/migrate.js - Database migration runner
- ✅ sql/schema.sql - Complete SQL schema (28 tables)
- ✅ scripts/seed.js - Sample data seeding
- ✅ Database initialized with all tables

**Estimated Time:** 6 hours (including debugging schema issues)  
**Status:** 🔴 NOT STARTED

---

## 3️⃣ PHASE 3: Implement Critical API Routes (Days 3-8)

### 3.1 Create API Response Wrapper

**Objective:** Standardize API responses across all endpoints

**File:** `src/utils/apiResponse.js`

```javascript
// src/utils/apiResponse.js
'use strict';

/**
 * Standardized API Response Wrapper
 * All endpoints should return this format
 */

class ApiResponse {
  constructor(data = null, message = 'Success', statusCode = 200) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static success(data, message = 'Request successful', statusCode = 200) {
    return new ApiResponse(data, message, statusCode);
  }

  static created(data, message = 'Resource created successfully') {
    return new ApiResponse(data, message, 201);
  }

  static error(message = 'Internal server error', statusCode = 500, data = null) {
    return new ApiResponse(data, message, statusCode);
  }

  static badRequest(message = 'Invalid request') {
    return new ApiResponse(null, message, 400);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiResponse(null, message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiResponse(null, message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new ApiResponse(null, message, 404);
  }
}

module.exports = ApiResponse;
```

**Status:** `TODO: Create file`

### 3.2 Create Request Validation Schemas

**File:** `src/schemas/validationSchemas.js`

```javascript
// src/schemas/validationSchemas.js
'use strict';

const Joi = require('joi');

const validationSchemas = {
  // Sales
  createSale: Joi.object({
    customerId: Joi.number().integer().allow(null),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.number().integer().required(),
        quantity: Joi.number().positive().required(),
        batchId: Joi.number().integer().allow(null),
      })
    ).min(1).required(),
    discountAmount: Joi.number().min(0).default(0),
    discountPercentage: Joi.number().min(0).max(100).default(0),
    paymentMethods: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('cash', 'card', 'mpesa', 'insurance').required(),
        amount: Joi.number().positive().required(),
      })
    ).min(1).required(),
    notes: Joi.string().max(500),
  }),

  // GRN
  createGRN: Joi.object({
    supplierId: Joi.number().integer().required(),
    purchaseOrderId: Joi.number().integer().required(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.number().integer().required(),
        quantityReceived: Joi.number().positive().required(),
        batchNumber: Joi.string().required(),
        expiryDate: Joi.date().required(),
        costPrice: Joi.number().positive().required(),
        margin: Joi.number().min(0).max(1).required(),
      })
    ).min(1).required(),
    notes: Joi.string().max(500),
  }),

  // Customer
  createCustomer: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]*$/),
    dateOfBirth: Joi.date(),
    idNumber: Joi.string(),
    loyaltyNumber: Joi.string(),
    creditLimit: Joi.number().min(0).default(0),
    chronicConditions: Joi.array().items(Joi.string()),
    allergies: Joi.array().items(Joi.string()),
  }),

  // Prescription
  createPrescription: Joi.object({
    customerId: Joi.number().integer().required(),
    prescriberId: Joi.string().required(),
    prescriberName: Joi.string().required(),
    licenseNumber: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.number().integer().required(),
        dosage: Joi.string().required(),
        frequency: Joi.string().required(),
        duration: Joi.string().required(),
        quantity: Joi.number().positive().required(),
      })
    ).min(1).required(),
    instructions: Joi.string().max(500),
    prescriptionDate: Joi.date().default(() => new Date()),
  }),

  // Insurance Claim
  createInsuranceClaim: Joi.object({
    customerId: Joi.number().integer().required(),
    insuranceProviderId: Joi.number().integer().required(),
    saleId: Joi.number().integer().required(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.number().integer().required(),
        quantity: Joi.number().positive().required(),
        unitPrice: Joi.number().positive().required(),
      })
    ).min(1).required(),
    claimAmount: Joi.number().positive().required(),
    notes: Joi.string().max(500),
  }),

  // Transfer Request
  createTransferRequest: Joi.object({
    fromBranchId: Joi.number().integer().required(),
    toBranchId: Joi.number().integer().required(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.number().integer().required(),
        quantity: Joi.number().positive().required(),
        batchId: Joi.number().integer(),
      })
    ).min(1).required(),
    reason: Joi.string().max(500),
    priority: Joi.string().valid('normal', 'urgent').default('normal'),
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string(),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // ID Parameter
  idParam: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

module.exports = validationSchemas;
```

**Status:** `TODO: Create file`

### 3.3 Implement Core API Routes

#### 3.3.1 Sales Routes

**File:** `src/routes/salesRoutes.js` (COMPLETE IMPLEMENTATION)

```javascript
// src/routes/salesRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errors');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const schemas = require('../schemas/validationSchemas');
const ApiResponse = require('../utils/apiResponse');
const SalesService = require('../services/SalesService');

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/sales
 * Create a new sale transaction
 */
router.post(
  '/',
  authorizeRole('cashier', 'pharmacist'),
  validateBody(schemas.createSale),
  asyncHandler(async (req, res) => {
    const { customerId, items, discountAmount, discountPercentage, paymentMethods, notes } = req.body;

    const sale = await SalesService.createSale({
      customerId,
      items,
      discountAmount,
      discountPercentage,
      paymentMethods,
      notes,
      userId: req.user.id,
      branchId: req.user.branchId,
    });

    res.status(201).json(ApiResponse.created(sale, 'Sale created successfully'));
  })
);

/**
 * GET /api/sales/:id
 * Get sale details
 */
router.get(
  '/:id',
  validateParams(schemas.idParam),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const sale = await SalesService.getSaleById(id, req.user.branchId);

    if (!sale) {
      return res.status(404).json(ApiResponse.notFound('Sale not found'));
    }

    res.json(ApiResponse.success(sale));
  })
);

/**
 * GET /api/sales
 * List sales with pagination and filters
 */
router.get(
  '/',
  validateQuery(schemas.pagination),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, startDate, endDate, customerId } = req.query;

    const filters = {
      status,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      customerId: customerId ? parseInt(customerId) : null,
      branchId: req.user.branchId,
    };

    const result = await SalesService.listSales(page, limit, filters);

    res.json(ApiResponse.success(result));
  })
);

/**
 * POST /api/sales/:id/refund
 * Process refund for a sale
 */
router.post(
  '/:id/refund',
  authorizeRole('cashier', 'pharmacist', 'manager'),
  validateParams(schemas.idParam),
  validateBody(Joi.object({
    reason: Joi.string().required(),
    amount: Joi.number().positive(),
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, amount } = req.body;

    const refund = await SalesService.createRefund(id, {
      reason,
      amount,
      userId: req.user.id,
      branchId: req.user.branchId,
    });

    res.json(ApiResponse.success(refund, 'Refund processed successfully'));
  })
);

/**
 * POST /api/sales/:id/receipt
 * Regenerate receipt for a sale
 */
router.post(
  '/:id/receipt',
  validateParams(schemas.idParam),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const receipt = await SalesService.generateReceipt(id);

    res.json(ApiResponse.success(receipt, 'Receipt generated'));
  })
);

/**
 * GET /api/sales/daily-summary
 * Get daily sales summary
 */
router.get(
  '/daily-summary',
  authorizeRole('manager', 'accountant', 'admin'),
  asyncHandler(async (req, res) => {
    const { date } = req.query;
    const summaryDate = date ? new Date(date) : new Date();

    const summary = await SalesService.getDailySummary(
      summaryDate,
      req.user.branchId
    );

    res.json(ApiResponse.success(summary));
  })
);

module.exports = router;
```

**Status:** `TODO: Create and integrate`

#### 3.3.2 Inventory Routes

**File:** `src/routes/inventoryRoutes.js` (COMPLETE IMPLEMENTATION)

```javascript
// src/routes/inventoryRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errors');
const { validateBody, validateParams } = require('../middleware/validation');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const schemas = require('../schemas/validationSchemas');
const ApiResponse = require('../utils/apiResponse');
const InventoryService = require('../services/InventoryService');

router.use(authenticateToken);

/**
 * POST /api/inventory/grn
 * Create Goods Received Note
 */
router.post(
  '/grn',
  authorizeRole('manager', 'admin'),
  validateBody(schemas.createGRN),
  asyncHandler(async (req, res) => {
    const { supplierId, purchaseOrderId, items, notes } = req.body;

    const grn = await InventoryService.createGRN({
      supplierId,
      purchaseOrderId,
      items,
      notes,
      userId: req.user.id,
      branchId: req.user.branchId,
    });

    res.status(201).json(ApiResponse.created(grn, 'GRN created successfully'));
  })
);

/**
 * GET /api/inventory/grn/:id
 * Get GRN details
 */
router.get(
  '/grn/:id',
  validateParams(schemas.idParam),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const grn = await InventoryService.getGRNById(id);

    if (!grn) {
      return res.status(404).json(ApiResponse.notFound('GRN not found'));
    }

    res.json(ApiResponse.success(grn));
  })
);

/**
 * GET /api/inventory/stock
 * Get current stock levels
 */
router.get(
  '/stock',
  asyncHandler(async (req, res) => {
    const { branchId = req.user.branchId, productId, lowStock } = req.query;

    const stock = await InventoryService.getStockLevels({
      branchId: parseInt(branchId),
      productId: productId ? parseInt(productId) : null,
      showLowStock: lowStock === 'true',
    });

    res.json(ApiResponse.success(stock));
  })
);

/**
 * GET /api/inventory/batches/:productId
 * Get available batches for a product (FEFO order)
 */
router.get(
  '/batches/:productId',
  validateParams(Joi.object({ productId: Joi.number().integer().required() })),
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { branchId = req.user.branchId, quantity } = req.query;

    const batches = await InventoryService.getAvailableBatches({
      productId: parseInt(productId),
      branchId: parseInt(branchId),
      requiredQuantity: quantity ? parseInt(quantity) : null,
    });

    res.json(ApiResponse.success(batches));
  })
);

/**
 * POST /api/inventory/transfer
 * Transfer stock between branches
 */
router.post(
  '/transfer',
  authorizeRole('manager', 'admin'),
  validateBody(schemas.createTransferRequest),
  asyncHandler(async (req, res) => {
    const transfer = await InventoryService.createTransferRequest(
      req.body,
      req.user
    );

    res.status(201).json(
      ApiResponse.created(transfer, 'Transfer request created')
    );
  })
);

module.exports = router;
```

**Status:** `TODO: Create and integrate`

#### 3.3.3 Additional Core Routes (Create Similarly)

Create the following route files with similar structure:

1. **Customer Routes** - `src/routes/customerRoutes.js`
   - POST /api/customers - Create customer
   - GET /api/customers/:id - Get customer
   - GET /api/customers - List customers
   - POST /api/customers/:id/credit - Update credit

2. **Prescription Routes** - `src/routes/prescriptionRoutes.js`
   - POST /api/prescriptions - Create prescription
   - GET /api/prescriptions/:id - Get prescription
   - POST /api/prescriptions/:id/dispense - Dispense items
   - GET /api/prescriptions - List prescriptions

3. **Insurance Routes** - `src/routes/insuranceRoutes.js`
   - POST /api/claims - Submit claim
   - GET /api/claims/:id - Get claim
   - POST /api/claims/:id/approve - Approve claim
   - GET /api/claims - List claims

4. **Finance Routes** - `src/routes/financeRoutes.js`
   - GET /api/reports - Get financial reports
   - POST /api/reconciliation - Submit reconciliation
   - GET /api/etims-status - Check ETIMS submission status

**Status:** `TODO: Create all 4 route files`

### 3.4 Create Service Layer

**File:** `src/services/SalesService.js`

```javascript
// src/services/SalesService.js
'use strict';

const db = require('../db');
const { BusinessLogicError, ValidationError } = require('../utils/errors');

class SalesService {
  /**
   * Create a new sale transaction
   */
  static async createSale(saleData) {
    const { customerId, items, discountAmount, paymentMethods, userId, branchId } = saleData;

    // Validate items and stock availability
    let totalAmount = 0;
    const saleItems = [];

    for (const item of items) {
      // Get product and validate
      const product = await db.getProductById(item.productId);
      if (!product) {
        throw new ValidationError(`Product ${item.productId} not found`);
      }

      // Get FEFO batches
      const batches = await db.selectBatchesFEFO(
        item.productId,
        item.quantity,
        branchId
      );
      if (batches.totalQuantity < item.quantity) {
        throw new BusinessLogicError(
          `Insufficient stock for ${product.name}. Available: ${batches.totalQuantity}`
        );
      }

      const lineTotal = item.quantity * product.sellingPrice;
      totalAmount += lineTotal;
      saleItems.push({
        ...item,
        lineTotal,
        batches: batches.items,
      });
    }

    // Calculate totals
    const subtotal = totalAmount;
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = discountedSubtotal * 0.16; // 16% VAT
    const finalTotal = discountedSubtotal + taxAmount;

    // Validate payment methods sum equals total
    const paymentSum = paymentMethods.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(paymentSum - finalTotal) > 0.01) {
      throw new ValidationError('Payment methods do not sum to total amount');
    }

    // Create sale in database (transaction)
    const sale = await db.createSale({
      customerId,
      branchId,
      items: saleItems,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount: finalTotal,
      paymentMethods,
      userId,
      status: 'COMPLETED',
    });

    // Update inventory
    for (const item of saleItems) {
      for (const batch of item.batches) {
        await db.updateBatchQuantity(
          batch.id,
          -batch.allocatedQuantity,
          'SALE',
          sale.id
        );
      }
    }

    return sale;
  }

  /**
   * Get sale by ID
   */
  static async getSaleById(saleId, branchId) {
    const sale = await db.getSaleById(saleId);
    
    if (!sale || sale.branchId !== branchId) {
      return null;
    }

    return sale;
  }

  /**
   * List sales with filters
   */
  static async listSales(page, limit, filters) {
    const offset = (page - 1) * limit;
    const sales = await db.querySales(filters, limit, offset);
    const total = await db.countSales(filters);

    return {
      data: sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create refund
   */
  static async createRefund(saleId, refundData) {
    const { reason, amount, userId } = refundData;

    const sale = await db.getSaleById(saleId);
    if (!sale) {
      throw new BusinessLogicError('Sale not found');
    }

    if (sale.status !== 'COMPLETED') {
      throw new BusinessLogicError('Only completed sales can be refunded');
    }

    const refundAmount = amount || sale.totalAmount;
    if (refundAmount > sale.totalAmount) {
      throw new ValidationError('Refund amount cannot exceed sale total');
    }

    // Create refund record
    const refund = await db.createRefund({
      saleId,
      amount: refundAmount,
      reason,
      userId,
      status: 'PROCESSED',
    });

    // Restore inventory
    // TODO: Implement inventory restoration logic

    return refund;
  }

  /**
   * Generate receipt
   */
  static async generateReceipt(saleId) {
    const sale = await db.getSaleById(saleId);
    if (!sale) {
      throw new BusinessLogicError('Sale not found');
    }

    // TODO: Implement receipt generation (PDF, thermal printer)
    return {
      receiptId: `RCP-${Date.now()}`,
      saleId,
      url: `/receipts/${saleId}.pdf`,
    };
  }

  /**
   * Get daily summary
   */
  static async getDailySummary(date, branchId) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const summary = await db.getSalesSummary({
      startDate: startOfDay,
      endDate: endOfDay,
      branchId,
    });

    return summary;
  }
}

module.exports = SalesService;
```

**Status:** `TODO: Create SalesService and similar for other modules`

### 3.5 Update src/server.js to Mount Routes

**Update:** `src/server.js` (around line 120 - where transferRoutes is mounted)

```javascript
// ============================================================================
// API ROUTES
// ============================================================================

// Mount all route modules
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/claims', require('./routes/insuranceRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/transfers', require('./routes/transferRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
```

**Status:** `TODO: Update file`

### Summary: Phase 3 Deliverables
- ✅ src/utils/apiResponse.js - Response standardization
- ✅ src/schemas/validationSchemas.js - Input validation
- ✅ src/routes/salesRoutes.js - Full implementation
- ✅ src/routes/inventoryRoutes.js - Full implementation
- ✅ src/routes/customerRoutes.js - Full implementation
- ✅ src/routes/prescriptionRoutes.js - Full implementation
- ✅ src/routes/insuranceRoutes.js - Full implementation
- ✅ src/routes/financeRoutes.js - Full implementation
- ✅ src/services/*.js - Business logic services (6 services)
- ✅ All 25+ API endpoints implemented and tested

**Estimated Time:** 40 hours  
**Status:** 🔴 NOT STARTED

---

## 4️⃣ PHASE 4: Frontend-Backend Integration (Days 8-12)

### 4.1 Create API Client Layer

**File:** `ui/client/src/services/apiClient.ts`

```typescript
// ui/client/src/services/apiClient.ts
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

// API Response interface
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T | null;
  message: string;
  timestamp: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class APIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle 401 - Token expired
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic GET request
   */
  async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, { params });
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic POST request
   */
  async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data);
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic PUT request
   */
  async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data);
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url);
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Error handler
   */
  private handleError(error: any) {
    if (error.response) {
      // Server responded with error status
      const { data, status } = error.response;
      return {
        success: false,
        statusCode: status,
        message: data.message || 'An error occurred',
        data: data.data,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        statusCode: 0,
        message: 'No response from server',
        data: null,
      };
    } else {
      // Error in request setup
      return {
        success: false,
        statusCode: 0,
        message: error.message,
        data: null,
      };
    }
  }
}

export default new APIClient();
```

**Status:** `TODO: Create file`

### 4.2 Create Service Interfaces

**File:** `ui/client/src/services/index.ts`

```typescript
// ui/client/src/services/index.ts
import apiClient from './apiClient';

// Sales Service
export const salesService = {
  createSale: (data: any) => apiClient.post('/sales', data),
  getSale: (id: number) => apiClient.get(`/sales/${id}`),
  listSales: (page = 1, limit = 20, filters = {}) =>
    apiClient.get('/sales', { page, limit, ...filters }),
  refundSale: (id: number, data: any) => apiClient.post(`/sales/${id}/refund`, data),
  generateReceipt: (id: number) => apiClient.post(`/sales/${id}/receipt`, {}),
  getDailySummary: (date?: string) => apiClient.get('/sales/daily-summary', { date }),
};

// Inventory Service
export const inventoryService = {
  createGRN: (data: any) => apiClient.post('/inventory/grn', data),
  getGRN: (id: number) => apiClient.get(`/inventory/grn/${id}`),
  getStock: (filters = {}) => apiClient.get('/inventory/stock', filters),
  getAvailableBatches: (productId: number, filters = {}) =>
    apiClient.get(`/inventory/batches/${productId}`, filters),
  createTransfer: (data: any) => apiClient.post('/inventory/transfer', data),
};

// Customer Service
export const customerService = {
  createCustomer: (data: any) => apiClient.post('/customers', data),
  getCustomer: (id: number) => apiClient.get(`/customers/${id}`),
  listCustomers: (page = 1, limit = 20) =>
    apiClient.get('/customers', { page, limit }),
  updateCredit: (id: number, data: any) =>
    apiClient.post(`/customers/${id}/credit`, data),
};

// Prescription Service
export const prescriptionService = {
  createPrescription: (data: any) => apiClient.post('/prescriptions', data),
  getPrescription: (id: number) => apiClient.get(`/prescriptions/${id}`),
  listPrescriptions: (page = 1, limit = 20) =>
    apiClient.get('/prescriptions', { page, limit }),
  dispensePrescription: (id: number, data: any) =>
    apiClient.post(`/prescriptions/${id}/dispense`, data),
};

// Insurance Service
export const insuranceService = {
  submitClaim: (data: any) => apiClient.post('/claims', data),
  getClaim: (id: number) => apiClient.get(`/claims/${id}`),
  listClaims: (page = 1, limit = 20) =>
    apiClient.get('/claims', { page, limit }),
  approveClaim: (id: number) => apiClient.post(`/claims/${id}/approve`, {}),
};

// Finance Service
export const financeService = {
  getReports: (filters = {}) => apiClient.get('/finance/reports', filters),
  submitReconciliation: (data: any) => apiClient.post('/finance/reconciliation', data),
  getETIMSStatus: () => apiClient.get('/finance/etims-status'),
};

// Transfer Service
export const transferService = {
  createTransfer: (data: any) => apiClient.post('/transfers', data),
  getTransfer: (id: number) => apiClient.get(`/transfers/${id}`),
  listTransfers: (page = 1, limit = 20) =>
    apiClient.get('/transfers', { page, limit }),
  approveTransfer: (id: number) => apiClient.post(`/transfers/${id}/approve`, {}),
};
```

**Status:** `TODO: Create file`

### 4.3 Update Frontend Pages to Use API

**Example: Update POS Page**

**File:** `ui/client/src/pages/POSPage.tsx` (Before and After)

```typescript
// BEFORE - Using mock data
export const POSPage = () => {
  const [items, setItems] = useState([
    { id: 1, name: 'Paracetamol', price: 500 }  // Hardcoded
  ]);
};

// AFTER - Using API
import { useState, useEffect } from 'react';
import { inventoryService, salesService } from '@/services';

export const POSPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState([]);

  // Load available products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const stockData = await inventoryService.getStock();
        setItems(stockData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Create sale
  const handleCreateSale = async (saleData: any) => {
    try {
      setLoading(true);
      const result = await salesService.createSale({
        customerId: saleData.customerId || null,
        items: saleData.items,
        discountAmount: saleData.discount || 0,
        paymentMethods: saleData.payments,
        notes: saleData.notes,
      });

      // Success - show receipt or confirmation
      console.log('Sale created:', result);
      setCart([]); // Clear cart
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && items.length === 0) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="pos-page">
      {/* Render POS interface with real data */}
    </div>
  );
};
```

**Status:** `TODO: Update all 15 pages`

### 4.4 Add Error Handling & Retry Logic

**File:** `ui/client/src/hooks/useAPI.ts`

```typescript
// ui/client/src/hooks/useAPI.ts
import { useState, useCallback } from 'react';

export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAPI = useCallback(
    async (apiCall: () => Promise<any>, retries = 3) => {
      setLoading(true);
      setError(null);

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const result = await apiCall();
          setLoading(false);
          return result;
        } catch (err: any) {
          lastError = err;

          // Don't retry on 4xx errors (except 408 and 429)
          if (err.statusCode >= 400 && err.statusCode < 500 &&
              ![408, 429].includes(err.statusCode)) {
            break;
          }

          // Wait before retrying (exponential backoff)
          if (attempt < retries) {
            await new Promise(resolve =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
          }
        }
      }

      setLoading(false);
      setError(lastError?.message || 'An error occurred');
      throw lastError;
    },
    []
  );

  return { loading, error, executeAPI };
};
```

**Status:** `TODO: Create hook and use in all pages`

### Summary: Phase 4 Deliverables
- ✅ ui/client/src/services/apiClient.ts - HTTP client
- ✅ ui/client/src/services/index.ts - Service interfaces
- ✅ ui/client/src/hooks/useAPI.ts - API hook with retries
- ✅ All 15 pages updated to use API
- ✅ Error handling and loading states
- ✅ Token refresh mechanism

**Estimated Time:** 30 hours  
**Status:** 🔴 NOT STARTED

---

## 5️⃣ PHASE 5: Testing & Validation (Days 12-14)

### 5.1 Create API Tests

**File:** `tests/api/sales.test.js`

```javascript
// tests/api/sales.test.js
const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/db');
const jwt = require('jsonwebtoken');

describe('Sales API', () => {
  let token;
  let testSaleId;

  beforeAll(async () => {
    // Create test user and token
    token = jwt.sign(
      { id: 1, email: 'test@pharmacy.local', role: 'cashier', branchId: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  });

  describe('POST /api/sales', () => {
    it('should create a sale', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerId: null,
          items: [
            { productId: 1, quantity: 2, batchId: null },
            { productId: 2, quantity: 1, batchId: null },
          ],
          discountAmount: 0,
          paymentMethods: [
            { type: 'cash', amount: 2500 },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAmount).toBeGreaterThan(0);
      testSaleId = response.body.data.id;
    });

    it('should fail with invalid payment methods', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerId: null,
          items: [{ productId: 1, quantity: 2 }],
          discountAmount: 0,
          paymentMethods: [
            { type: 'cash', amount: 100 }, // Too low
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/sales/:id', () => {
    it('should get sale details', async () => {
      const response = await request(app)
        .get(`/api/sales/${testSaleId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testSaleId);
    });

    it('should return 404 for non-existent sale', async () => {
      const response = await request(app)
        .get('/api/sales/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Authentication', () => {
    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/sales');

      expect(response.status).toBe(401);
    });
  });
});
```

**Status:** `TODO: Create API tests for all modules`

### 5.2 Create Integration Tests

**File:** `tests/integration/e2e-sale-flow.test.js`

```javascript
// tests/integration/e2e-sale-flow.test.js
// Complete POS flow: Create sale -> Process payment -> Generate receipt

const request = require('supertest');
const app = require('../../src/server');
const jwt = require('jsonwebtoken');

describe('E2E: Complete Sale Flow', () => {
  let token;

  beforeAll(() => {
    token = jwt.sign(
      { id: 1, email: 'test@pharmacy.local', role: 'cashier', branchId: 1 },
      process.env.JWT_SECRET
    );
  });

  it('should complete full sale flow', async () => {
    // Step 1: Get available stock
    const stockResponse = await request(app)
      .get('/api/inventory/stock')
      .set('Authorization', `Bearer ${token}`);

    expect(stockResponse.status).toBe(200);
    const availableProducts = stockResponse.body.data;

    // Step 2: Create sale
    const saleResponse = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: null,
        items: [
          { productId: availableProducts[0].id, quantity: 2 },
        ],
        discountAmount: 0,
        paymentMethods: [
          { type: 'cash', amount: 10000 },
        ],
      });

    expect(saleResponse.status).toBe(201);
    const saleId = saleResponse.body.data.id;

    // Step 3: Generate receipt
    const receiptResponse = await request(app)
      .post(`/api/sales/${saleId}/receipt`)
      .set('Authorization', `Bearer ${token}`);

    expect(receiptResponse.status).toBe(200);
    expect(receiptResponse.body.data.receiptId).toBeDefined();

    // Step 4: Verify sale is in system
    const retrieveResponse = await request(app)
      .get(`/api/sales/${saleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(retrieveResponse.status).toBe(200);
    expect(retrieveResponse.body.data.status).toBe('COMPLETED');
  });
});
```

**Status:** `TODO: Create E2E tests`

### 5.3 Frontend Testing

**File:** `ui/client/src/__tests__/POSPage.test.tsx`

```typescript
// ui/client/src/__tests__/POSPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { POSPage } from '@/pages/POSPage';
import * as salesService from '@/services';

jest.mock('@/services');

describe('POSPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load and display available products', async () => {
    const mockInventory = [
      { id: 1, name: 'Paracetamol', price: 500, stock: 100 },
    ];

    (salesService.inventoryService.getStock as jest.Mock).mockResolvedValue(
      mockInventory
    );

    render(<POSPage />);

    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    });
  });

  it('should create a sale', async () => {
    const mockSale = { id: 1, totalAmount: 2500, status: 'COMPLETED' };
    
    (salesService.salesService.createSale as jest.Mock).mockResolvedValue(
      mockSale
    );

    render(<POSPage />);

    // ... interact with form
    
    await waitFor(() => {
      expect(salesService.salesService.createSale).toHaveBeenCalled();
    });
  });
});
```

**Status:** `TODO: Create component tests`

### Summary: Phase 5 Deliverables
- ✅ API integration tests (all endpoints)
- ✅ E2E tests (critical flows)
- ✅ Frontend component tests
- ✅ Coverage report (target: 80%+)
- ✅ Test documentation

**Estimated Time:** 20 hours  
**Status:** 🔴 NOT STARTED

---

## Timeline & Effort Estimation

| Phase | Tasks | Duration | Effort |
|-------|-------|----------|--------|
| **1: Configuration** | Env setup, config system | 2 days | 16 hours |
| **2: Database** | Schema migration, seeding | 1-2 days | 12 hours |
| **3: API Routes** | Core routes, services, validation | 5 days | 40 hours |
| **4: Frontend Integration** | API client, pages, error handling | 5 days | 32 hours |
| **5: Testing** | Unit, integration, E2E tests | 2-3 days | 20 hours |
| **TOTAL** | **All critical gaps** | **~2 weeks** | **120 hours** |

---

## Checklist & Monitoring

### Phase 1: Configuration ☐
- [ ] .env.example created and committed
- [ ] src/config/index.js created and validated
- [ ] All hardcoded values removed from code
- [ ] docker-compose.yml updated for env variables
- [ ] package.json scripts added

### Phase 2: Database ☐
- [ ] sql/schema.sql created with all 28 tables
- [ ] scripts/migrate.js working
- [ ] scripts/seed.js working
- [ ] Database verified with SHOW TABLES
- [ ] Sample data populated

### Phase 3: API Routes ☐
- [ ] src/utils/apiResponse.js created
- [ ] src/schemas/validationSchemas.js created
- [ ] Sales routes fully implemented
- [ ] Inventory routes fully implemented
- [ ] Customer routes fully implemented
- [ ] Prescription routes fully implemented
- [ ] Insurance routes fully implemented
- [ ] Finance routes fully implemented
- [ ] All routes mounted in src/server.js
- [ ] All routes tested with curl/Postman

### Phase 4: Frontend Integration ☐
- [ ] ui/client/src/services/apiClient.ts created
- [ ] ui/client/src/services/index.ts created
- [ ] ui/client/src/hooks/useAPI.ts created
- [ ] All 15 pages updated to call API
- [ ] Loading states added to all pages
- [ ] Error handling added to all pages
- [ ] Token refresh implemented
- [ ] Manual E2E testing completed

### Phase 5: Testing ☐
- [ ] API tests written for all endpoints
- [ ] Integration tests for critical flows
- [ ] Frontend component tests
- [ ] Coverage report generated (target: 80%+)
- [ ] All tests passing
- [ ] Documentation updated

---

## Success Criteria

By end of 2 weeks:
- ✅ System is fully functional end-to-end
- ✅ All API endpoints working (25+ routes)
- ✅ Frontend pages connected to backend
- ✅ User can complete POS sale → receipt flow
- ✅ Inventory can be received and tracked
- ✅ Customers can be enrolled and managed
- ✅ 80%+ test coverage
- ✅ Zero unhandled errors in production logs
- ✅ All database tables populated
- ✅ Ready for UAT (User Acceptance Testing)

---

**Implementation Plan Created:** April 30, 2026  
**Status:** Ready to begin Phase 1  
**Next Step:** Execute Phase 1 (Environment Configuration)

---

## Quick Start Commands

```bash
# Phase 1: Setup environment
cp .env.example .env
# Edit .env with your values

# Phase 2: Database
npm run db:migrate
npm run db:seed

# Phase 3: Start API
npm start
# API available at http://localhost:3000/api

# Phase 4 & 5: Test everything
npm test

# Start development
npm run dev
```


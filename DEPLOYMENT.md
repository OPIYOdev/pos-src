# Pharmacy POS System - Deployment Guide

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- Docker & Docker Compose (optional)
- Git

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/OPIYOdev/pos-src.git
cd pos-src
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials and configuration
```

### 4. Initialize Database

```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run dev
```

Server will start on http://localhost:3000

## Docker Deployment

### Quick Start with Docker Compose

```bash
docker-compose up -d
```

This will:
- Start MySQL database
- Build and start the application
- Expose on http://localhost:3000

### View Logs

```bash
docker-compose logs -f app
```

### Stop Services

```bash
docker-compose down
```

## Production Deployment

### 1. Build Application

```bash
npm run build
```

### 2. Set Production Environment Variables

```bash
export NODE_ENV=production
export DATABASE_URL=mysql://user:password@prod-host:3306/pharmacy_pos
export JWT_SECRET=your-production-secret-key
export CORS_ORIGIN=https://yourdomain.com
```

### 3. Run Application

```bash
npm start
```

### 4. Verify Health

```bash
curl http://localhost:3000/health
```

## API Endpoints

### Health Check

- **GET** `/health` - Basic health check
- **GET** `/api/health` - API health check

### Authentication

- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/logout` - User logout

### Sales

- **POST** `/api/sales` - Create sale
- **GET** `/api/sales` - List sales
- **GET** `/api/sales/:id` - Get sale details
- **POST** `/api/sales/:id/refund` - Process refund

### Inventory

- **GET** `/api/inventory/stock` - Get stock levels
- **GET** `/api/inventory/alerts` - Get alerts
- **POST** `/api/inventory/grn` - Create GRN
- **POST** `/api/inventory/grn/:id/verify` - Verify GRN

### Prescriptions

- **POST** `/api/prescriptions` - Create prescription
- **GET** `/api/prescriptions` - List prescriptions
- **POST** `/api/prescriptions/:id/dispense` - Dispense prescription

### Insurance

- **POST** `/api/insurance/claims` - Create claim
- **GET** `/api/insurance/claims` - List claims
- **POST** `/api/insurance/claims/:id/approve` - Approve claim

### Finance

- **GET** `/api/finance/reports` - Get financial reports
- **GET** `/api/finance/reconciliation` - Get reconciliation
- **POST** `/api/finance/reconciliation` - Create reconciliation

### Customers

- **POST** `/api/customers` - Create customer
- **GET** `/api/customers` - List customers
- **POST** `/api/customers/:id/credit-limit` - Update credit limit

### Transfers

- **POST** `/api/transfers/requests` - Create transfer request
- **GET** `/api/transfers/orders` - List transfer orders
- **POST** `/api/transfers/settlements` - Create settlement

## Monitoring

### Health Checks

Monitor the health endpoints to ensure the system is running:

```bash
# Every 30 seconds
watch -n 30 'curl -s http://localhost:3000/health | jq'
```

### Logs

Check application logs in `.manus-logs/` directory:

- `devserver.log` - Server startup and errors
- `browserConsole.log` - Client-side errors
- `networkRequests.log` - HTTP requests
- `sessionReplay.log` - User interactions

### Database

Monitor MySQL connection pool and query performance:

```bash
# Connect to MySQL
mysql -u root -p pharmacy_pos

# Check active connections
SHOW PROCESSLIST;

# Check table sizes
SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'pharmacy_pos'
ORDER BY size_mb DESC;
```

## Backup & Recovery

### Automated Backups

Backups are configured to run daily at 2 AM:

```bash
# Manual backup
./scripts/backup.sh

# Restore from backup
mysql -u root -p pharmacy_pos < backup_file.sql
```

### Backup Retention

- Daily backups: 30 days retention
- Location: `/backups/pharmacy-pos/`

## Troubleshooting

### Database Connection Issues

```bash
# Test MySQL connection
mysql -u root -p -h localhost

# Check connection string
echo $DATABASE_URL
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Memory Issues

```bash
# Increase Node.js memory
node --max-old-space-size=4096 src/server.js
```

### Docker Issues

```bash
# Rebuild image
docker-compose build --no-cache

# Remove all containers
docker-compose down -v

# Restart
docker-compose up -d
```

## Performance Optimization

### Database Indexes

Ensure all indexes are created:

```bash
npm run migrate
```

### Connection Pooling

Configure in `.env`:

```
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Caching

Enable caching for frequently accessed data:

```bash
# Redis (optional)
docker run -d -p 6379:6379 redis:latest
```

## Security

### SSL/TLS

For production, use HTTPS:

```bash
# Generate self-signed certificate (development only)
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

### Environment Variables

Never commit `.env` file. Use `.env.example` as template.

### JWT Secret

Generate strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Scaling

### Horizontal Scaling

For multiple instances, use a load balancer:

```bash
# Start multiple instances
PORT=3001 npm start &
PORT=3002 npm start &
PORT=3003 npm start &
```

### Database Optimization

- Add indexes on frequently queried columns
- Implement query caching
- Archive old data periodically

## Support

For issues and support, refer to:
- TROUBLESHOOTING.md - Common issues and solutions
- API.md - API documentation
- SYSTEM_AUDIT_REPORT.md - System architecture and gaps

---

*Last Updated: April 27, 2026*

# Pharmacy POS System - Troubleshooting Guide

## Database Connection Issues

### Error: "connect ECONNREFUSED"

**Cause:** MySQL server is not running or not accessible

**Solution:**
```bash
# Check if MySQL is running
mysql -u root -p -h localhost

# Or start MySQL with Docker
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8.0
```

### Error: "Access denied for user 'root'@'localhost'"

**Cause:** Wrong database credentials

**Solution:**
1. Check DATABASE_URL in .env file
2. Verify MySQL user and password
3. Reset MySQL root password if needed

## API Issues

### Error: "Cannot POST /api/sales"

**Cause:** Route not registered or server not started

**Solution:**
1. Check server is running: `npm run dev`
2. Verify routes are imported in server.js
3. Check for middleware errors in logs
4. Verify route file exists in src/routes/

### Error: "401 Unauthorized"

**Cause:** Missing or invalid JWT token

**Solution:**
1. Get token from `/api/auth/login`
2. Include in Authorization header: `Authorization: Bearer <token>`
3. Check JWT_SECRET is set correctly
4. Verify token hasn't expired

### Error: "403 Forbidden"

**Cause:** User doesn't have required role/permission

**Solution:**
1. Check user role in database
2. Verify role is included in JWT token
3. Check route authorization middleware
4. Ensure user has required permissions

### Error: "400 Bad Request"

**Cause:** Invalid request body or parameters

**Solution:**
1. Check request body format (JSON)
2. Verify required fields are present
3. Check data types match schema
4. Review API documentation for endpoint

## Performance Issues

### Slow Queries

**Symptoms:** API responses taking >5 seconds

**Solution:**
1. Check database indexes: `SHOW INDEX FROM table_name;`
2. Add missing indexes on frequently queried columns
3. Use EXPLAIN to analyze slow queries
4. Implement pagination for large datasets

### High Memory Usage

**Symptoms:** Application crashes with "out of memory"

**Solution:**
1. Check for memory leaks: `node --inspect src/server.js`
2. Increase Node.js memory: `node --max-old-space-size=4096`
3. Monitor connection pool size
4. Archive old data periodically

### High CPU Usage

**Symptoms:** Server becomes unresponsive

**Solution:**
1. Check for infinite loops in code
2. Monitor background jobs
3. Reduce logging verbosity
4. Implement caching for expensive operations

## Docker Issues

### Container won't start

**Solution:**
```bash
# Check logs
docker-compose logs app

# Rebuild image
docker-compose build --no-cache

# Restart services
docker-compose restart
```

### MySQL container won't connect

**Solution:**
```bash
# Check MySQL is running
docker-compose ps

# Check MySQL logs
docker-compose logs mysql

# Verify connection string
echo $DATABASE_URL
```

### Port already in use

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

## Authentication Issues

### Token expired

**Solution:**
1. Get new token from `/api/auth/login`
2. Increase JWT_EXPIRY in .env (e.g., 48h)
3. Implement token refresh mechanism

### Invalid token

**Solution:**
1. Verify JWT_SECRET matches between login and API calls
2. Check token format (Bearer <token>)
3. Ensure token wasn't corrupted in transit

## Data Issues

### Duplicate records

**Cause:** Missing unique constraints

**Solution:**
1. Add unique constraints to schema
2. Implement duplicate detection logic
3. Clean up existing duplicates

### Data inconsistency

**Cause:** Transactions not properly handled

**Solution:**
1. Implement transaction rollback on errors
2. Add data validation before insert
3. Implement audit logging

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| ENOENT: no such file | Missing file | Check file paths, verify files exist |
| EADDRINUSE | Port in use | Change PORT or kill process |
| ValidationError | Invalid input | Check request body format |
| TokenExpiredError | JWT expired | Get new token from login |
| EACCES | Permission denied | Check file permissions, run with sudo if needed |
| ENOMEM | Out of memory | Increase memory, check for leaks |
| ETIMEDOUT | Connection timeout | Check network, increase timeout |
| ECONNRESET | Connection reset | Check server logs, restart service |

## Debugging

### Enable Debug Logging

```bash
# Set log level to debug
LOG_LEVEL=debug npm run dev
```

### Use Node Inspector

```bash
# Start with inspector
node --inspect src/server.js

# Open in Chrome: chrome://inspect
```

### Check Request/Response

```bash
# Using curl with verbose output
curl -v -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"customerId": 1, "items": []}'
```

## Performance Monitoring

### Monitor Database

```bash
# Check active connections
mysql -u root -p -e "SHOW PROCESSLIST;"

# Check table sizes
mysql -u root -p -e "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb FROM information_schema.TABLES WHERE table_schema = 'pharmacy_pos' ORDER BY size_mb DESC;"
```

### Monitor Application

```bash
# Check memory usage
ps aux | grep node

# Check CPU usage
top -p <PID>

# Monitor logs
tail -f .manus-logs/devserver.log
```

## Recovery Procedures

### Database Recovery

```bash
# Backup current database
mysqldump -u root -p pharmacy_pos > backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u root -p pharmacy_pos < backup_file.sql
```

### Application Recovery

```bash
# Stop application
npm stop

# Clear cache
rm -rf node_modules/.cache

# Reinstall dependencies
npm install

# Restart
npm start
```

### Full System Recovery

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild and restart
docker-compose up -d
```

## Getting Help

1. Check this troubleshooting guide
2. Review logs in `.manus-logs/`
3. Check DEPLOYMENT.md for setup issues
4. Review API.md for endpoint issues
5. Check GitHub issues: https://github.com/OPIYOdev/pos-src/issues

---

*Last Updated: April 27, 2026*

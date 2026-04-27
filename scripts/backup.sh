#!/bin/bash
# Daily MySQL backup script
# Cron: 0 2 * * * /path/to/scripts/backup.sh

set -e
DB_NAME="${DB_NAME:-pharmacy_pos}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_DIR="/var/backups/pharmacy-pos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
mysqldump -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" | gzip > "$FILENAME"
echo "[Backup] Created: $FILENAME"

# Retain last 30 days only
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
echo "[Backup] Old backups pruned."

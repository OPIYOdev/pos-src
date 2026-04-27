'use strict';
const db = require('../db');
(async () => {
  const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 1);
  console.log(`[MonthlyArchive] Archiving records older than ${cutoff.toISOString()}`);
  process.exit(0);
})();

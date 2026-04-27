'use strict';
const db = require('../db');
(async () => {
  const lowStock = await db.InventoryBatch.findAll({ where: { quantity_available: { [db.Op.lt]: 50 } } });
  console.log(`[ReorderAlerts] ${lowStock.length} items below reorder threshold.`);
  process.exit(0);
})();

'use strict';
const db = require('../db');
const { Op } = require('sequelize');
(async () => {
  const soon = new Date(); soon.setDate(soon.getDate() + 90);
  const batches = await db.InventoryBatch.findAll({ where: { expiry_date: { [Op.lte]: soon }, is_quarantined: false } });
  console.log(`[ExpiryAlerts] ${batches.length} batches expiring within 90 days.`);
  process.exit(0);
})();

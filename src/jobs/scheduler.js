'use strict';
const cron = require('node-cron');
const AutoReallocationEngine = require('../reallocation/AutoReallocationEngine');
const engine = new AutoReallocationEngine();
// Run auto-reallocation check every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('[Scheduler] Running auto-reallocation check...');
  try { await engine.runReallocationCheck(); } catch (e) { console.error(e); }
});
console.log('[Scheduler] Jobs registered.');

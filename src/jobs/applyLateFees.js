'use strict';
const { CreditAccountManager } = require('../customer/creditAccountManager');
const manager = new CreditAccountManager();
(async () => {
  console.log('[Job] Applying late fees...');
  await manager.applyLateFees();
  console.log('[Job] Late fees applied.');
  process.exit(0);
})();

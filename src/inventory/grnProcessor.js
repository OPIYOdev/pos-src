const db = require('../db');
async function processGoodsReceivedNote(grnData, purchaseOrder) {
  if (grnData.quantity > purchaseOrder.quantity * 1.1) {
    throw new Error('Quantity exceeds 10% tolerance. Manager approval required.');
  }
  const batches = grnData.items.map(item => ({
    batch_number: generateBatchNumber(),
    product_id: item.product_id,
    quantity_received: item.quantity,
    expiry_date: item.expiry_date,
    cost_price: item.cost_price,
    selling_price: calculateSellingPrice(item.cost_price, item.margin),
    date_received: new Date(),
    is_short_dated: isShortDated(item.expiry_date),
    qr_code: generateQRCode(item.batch_number),
  }));
  await db.InventoryBatch.bulkCreate(batches);
  for (const batch of batches) {
    await db.Drug.increment('stock_quantity', { by: batch.quantity_received, where: { id: batch.product_id } });
  }
  const grn = await db.sequelize.models.grn.create({
    supplier_id: grnData.supplier_id,
    po_id: purchaseOrder.id,
    total_amount: batches.reduce((sum, b) => sum + b.quantity_received * b.cost_price, 0),
    status: 'COMPLETED',
  });
  return { grn, batches };
}
function isShortDated(expiryDate) {
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  return new Date(expiryDate) < sixMonthsFromNow;
}
function generateBatchNumber() { return `BN-${Date.now()}`; }
function calculateSellingPrice(cost, margin) { return cost * (1 + margin); }
function generateQRCode(data) { return `QR-${data}`; }
module.exports = { processGoodsReceivedNote, isShortDated };

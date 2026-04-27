/**
 * INV-GRN-001: Goods Received Note Processor
 * Validates quantities, generates batches, updates stock.
 */

const db = require('../db');

async function processGoodsReceivedNote(grnData, purchaseOrder) {
  // Tolerance check: max +10% over PO quantity
  if (grnData.quantity > purchaseOrder.quantity * 1.1) {
    throw new Error('Quantity exceeds 10% tolerance. Manager approval required.');
  }

  const batches = grnData.items.map(item => ({
    batch_number:      generateBatchNumber(),
    product_id:        item.product_id,
    quantity_received: item.quantity,
    expiry_date:       item.expiry_date,
    cost_price:        item.cost_price,
    selling_price:     calculateSellingPrice(item.cost_price, item.margin),
    date_received:     new Date(),
    is_short_dated:    isShortDated(item.expiry_date),   // <6 months → true
    qr_code:           generateQRCode(item.batch_number),
  }));

  // Persist batches
  await db.inventory_batches.bulkCreate(batches);

  // Increment product stock for each batch
  for (const batch of batches) {
    await db.products.increment('stock_quantity', {
      by:    batch.quantity_received,
      where: { id: batch.product_id },
    });
  }

  // Create GRN record
  const grn = await db.grn.create({
    supplier_id:  grnData.supplier_id,
    po_id:        purchaseOrder.id,
    total_amount: batches.reduce(
      (sum, b) => sum + b.quantity_received * b.cost_price, 0
    ),
    status: 'COMPLETED',
  });

  return { grn, batches };
}

/**
 * Flag if expiry date is within 6 months of today.
 * @param {Date|string} expiryDate
 * @returns {boolean}
 */
function isShortDated(expiryDate) {
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  return new Date(expiryDate) < sixMonthsFromNow;
}

module.exports = { processGoodsReceivedNote, isShortDated };

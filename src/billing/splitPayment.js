/**
 * POS-STD-002: Multi-tender / Split Payment
 * Supports: Cash, M-Pesa (STK Push), Card, Insurance
 */
async function processSplitPayment(sale) {
  let balanceRemaining = sale.totalAmount;
  const tenders = [];
  while (balanceRemaining > 0) {
    const tenderType = selectTenderType(); // Cash | M-Pesa | Card | Insurance
    switch (tenderType) {
      case 'insurance': {
        const insurancePayment = await verifyInsuranceCover(sale);
        tenders.push(insurancePayment);
        balanceRemaining -= insurancePayment.amount;
        break;
      }
      case 'mpesa': {
        const mpesaPayment = await initiateSTKPush(balanceRemaining);
        tenders.push(mpesaPayment);
        balanceRemaining = 0;
        break;
      }
      case 'cash': {
        const cashAmount = prompt('Enter cash amount:');
        tenders.push({ type: 'cash', amount: Number(cashAmount) });
        balanceRemaining -= Number(cashAmount);
        break;
      }
      default:
        throw new Error(`Unknown tender type: ${tenderType}`);
    }
  }
  return generateConsolidatedReceipt(sale, tenders);
}
function selectTenderType() { return 'cash'; }
async function verifyInsuranceCover(sale) { return { type: 'insurance', amount: 0 }; }
async function initiateSTKPush(amount) { return { type: 'mpesa', amount }; }
function generateConsolidatedReceipt(sale, tenders) { return { sale, tenders }; }
module.exports = { processSplitPayment };

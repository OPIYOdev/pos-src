/**
 * FIN-ETIMS-001: KRA eTIMS Real-time Tax Compliance
 * VAT rate: 16% for taxable drugs, 0% for VAT-exempt
 * Invoice format: INV{YYYYMMDD}{SEQ:6}
 * Retry policy: 3 attempts, 2s delay, then queue for manual verification
 */

const axios = require('axios');

class KRABillingCompliance {
  async processTaxInvoice(sale) {
    const items = sale.items.map(item => {
      const isExempt  = item.drug_category === 'VAT_EXEMPT';
      const vatRate   = isExempt ? 0 : 0.16;
      const itemTotal = item.quantity * item.price;
      return {
        item_name:  item.drug_name,
        quantity:   item.quantity,
        unit_price: item.price,
        total:      itemTotal,
        vat_rate:   vatRate,
        vat_amount: itemTotal * vatRate,
      };
    });

    const invoice = {
      invoiceNumber: this.generateKRAInvoiceNumber(),
      timestamp:     new Date().toISOString(),
      supplierTin:   'P123456789Z',
      supplierName:  'Pharmacy POS System Ltd',
      customerTin:   sale.customer?.tin  || 'N/A',
      customerName:  sale.customer?.name || 'Cash Customer',
      invoiceType:   'E1',
      items,
      subtotal:      items.reduce((sum, i) => sum + i.total, 0),
      vatTotal:      items.reduce((sum, i) => sum + i.vat_amount, 0),
      grandTotal:    items.reduce((sum, i) => sum + i.total + i.vat_amount, 0),
    };

    let retries = 3;
    while (retries > 0) {
      try {
        const response = await axios.post(
          'https://etims.kra.go.ke/api/v1/invoice',
          invoice,
          {
            headers: {
              Authorization:  `Bearer ${await this.getAccessToken()}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        if (response.data.status === 'ACCEPTED') {
          await this.attachQRCodeToReceipt(sale.id, response.data.qrCode);
          await this.markSaleAsTaxCompliant(sale.id);
          return { success: true, receipt: response.data };
        }
        break;

      } catch (error) {
        retries--;
        if (retries === 0) {
          // Queue for later submission
          await this.queueTaxInvoice(sale, invoice);
          await this.markForManualVerification(sale.id);
          return {
            success: false,
            queued:  true,
            message: 'Queued for later submission',
          };
        }
        await this.delay(2000);
      }
    }
  }

  /**
   * Invoice number format: INV{YYYY}{MM}{DD}{SEQ:6}
   */
  generateKRAInvoiceNumber() {
    const date     = new Date();
    const sequence = this.getDailySequence();
    return [
      'INV',
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
      String(sequence).padStart(6, '0'),
    ].join('');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { KRABillingCompliance };

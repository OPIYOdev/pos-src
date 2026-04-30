import { decimal } from "drizzle-orm/mysql-core";
import * as db from "../db";

/**
 * TODOs: COMPLETE IMPLEMENTATION, NOT COMPLETE
 * SalesService - Handles all sales transaction logic
 * Enforces business rules: inventory deduction, payment processing, receipt generation
 */
export class SalesService {
  /**
   * Create a complete sale transaction with inventory deduction and payment processing
   */
  async createCompleteSale(params: {
    branchId: number;
    customerId?: number;
    userId: number;
    items: Array<{
      productId: number;
      batchId: number;
      quantity: number;
      unitPrice: number;
    }>;
    discountAmount: number;
    paymentMethods: Array<{
      methodType: "Cash" | "M-Pesa" | "Card" | "Insurance";
      amount: number;
      reference?: string;
    }>;
  }) {
    // Validate payment methods sum to net amount
    const totalAmount = params.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const netAmount = totalAmount - params.discountAmount;

    const paymentTotal = params.paymentMethods.reduce(
      (sum, pm) => sum + pm.amount,
      0
    );

    if (Math.abs(paymentTotal - netAmount) > 0.01) {
      throw new Error(
        `Payment total (${paymentTotal}) does not match net amount (${netAmount})`
      );
    }

    // Validate customer credit if applicable
    if (params.customerId) {
      const hasCredit = await db.checkCustomerCredit(
        params.customerId,
        netAmount
      );
      if (!hasCredit) {
        throw new Error("Insufficient customer credit");
      }
    }

    // Validate inventory availability
    for (const item of params.items) {
      const available = await db.getAvailableStock(
        params.branchId,
        item.productId
      );
      if (available < item.quantity) {
        throw new Error(
          `Insufficient stock for product ${item.productId}: available ${available}, requested ${item.quantity}`
        );
      }
    }

    // Create sale record
    const saleResult = await db.createSale({
      branchId: params.branchId,
      customerId: params.customerId,
      userId: params.userId,
      totalAmount,
      discountAmount: params.discountAmount,
      netAmount,
    });

        // Create sale items and deduct inventory
    for (const item of params.items) {
      await db.createSaleItem({
        saleId: saleResult.insertId,
        productId: item.productId,
        batchId: item.batchId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      });
      await db.deductInventoryBatch(item.batchId, item.quantity);
    }

    // Process payments
    for (const payment of params.paymentMethods) {
      await db.createPaymentMethod({
        saleId: saleResult.insertId,
        methodType: payment.methodType,
        amount: payment.amount,
        reference: payment.reference,
        status: "completed",
      });
    }

    // Update sale status to completed
    await db.updateSaleStatus(saleResult.insertId, "completed");

    // TODO: Generate KRA eTIMS receipt.
    // TODO: Generate customer receipt.

    return {
      success: true,
      saleNumber: "SAL-" + Date.now(),
      netAmount,
    };
  }

  /**
   * Generate KRA eTIMS compliant receipt
   */
  async generateKRAReceipt(saleId: number) {
    // TODO: Implement KRA eTIMS API integration
    // This should:
    // 1. Call KRA eTIMS API with sale details
    // 2. Get receipt number from KRA
    // 3. Update sale record with KRA receipt number
    // 4. Return formatted receipt
    return {
      kraReceiptNumber: "KRA-" + Date.now(),
      receiptData: {},
    };
  }

  /**
   * Process refund for a sale
   */
  async processSaleRefund(saleId: number, reason: string) {
    const sale = await db.getSaleById(saleId);
    if (!sale) {
      throw new Error("Sale not found");
    }

    if (sale.paymentStatus === "refunded") {
      throw new Error("Sale already refunded");
    }

    // TODO: Implement refund logic
    // 1. Validate refund eligibility
    // 2. Reverse inventory transactions
    // 3. Process payment reversal
    // 4. Update sale status
    // 5. Log audit trail

    return { success: true };
  }
}

export const salesService = new SalesService();

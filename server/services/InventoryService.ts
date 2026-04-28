import * as db from "../db";

/**
 * InventoryService - Handles all inventory management operations
 * Enforces FEFO (First Expiry First Out), batch tracking, and low-stock alerts
 */
export class InventoryService {
  /**
   * Reserve inventory for a sale using FEFO logic
   * Returns selected batches with quantities to pick
   */
  async reserveInventoryFEFO(
    branchId: number,
    productId: number,
    quantityNeeded: number
  ) {
    const selectedBatches = await db.selectBatchesFEFO(
      branchId,
      productId,
      quantityNeeded
    );

    if (selectedBatches.length === 0) {
      throw new Error(
        `No available batches for product ${productId} at branch ${branchId}`
      );
    }

    const totalSelected = selectedBatches.reduce(
      (sum, b) => sum + b.quantityToTake,
      0
    );

    if (totalSelected < quantityNeeded) {
      throw new Error(
        `Insufficient inventory: need ${quantityNeeded}, can only reserve ${totalSelected}`
      );
    }

    return selectedBatches;
  }

  /**
   * Create GRN (Goods Received Note) with tolerance validation
   */
  async createGRN(params: {
    branchId: number;
    supplierId: number;
    invoiceNumber: string;
    items: Array<{
      productId: number;
      batchNumber: string;
      quantityOrdered: number;
      quantityReceived: number;
      expiryDate: string;
      costPrice: number;
    }>;
  }) {
    const grnNumber = `GRN-${Date.now()}-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;

    // Validate all items within tolerance (±5%)
    const tolerance = 0.05;
    const discrepancies = [];

    for (const item of params.items) {
      const maxAllowed = item.quantityOrdered * (1 + tolerance);
      const minAllowed = item.quantityOrdered * (1 - tolerance);

      if (item.quantityReceived > maxAllowed) {
        discrepancies.push({
          productId: item.productId,
          reason: "QUANTITY_EXCESS",
          expected: item.quantityOrdered,
          received: item.quantityReceived,
          tolerance: tolerance * 100,
        });
      } else if (item.quantityReceived < minAllowed) {
        discrepancies.push({
          productId: item.productId,
          reason: "QUANTITY_SHORT",
          expected: item.quantityOrdered,
          received: item.quantityReceived,
          tolerance: tolerance * 100,
        });
      }
    }

    // TODO: Create GRN record in database
    // TODO: Create inventory batches for each item
    // TODO: Log audit trail
    // TODO: Trigger low-stock alerts if needed

    return {
      grnNumber,
      status: discrepancies.length === 0 ? "verified" : "pending_review",
      discrepancies,
      itemCount: params.items.length,
    };
  }

  /**
   * Check for low-stock items and generate reorder requests
   */
  async checkLowStockAndReorder(branchId: number) {
    // TODO: Implement low-stock checking
    // 1. Query all products at branch
    // 2. For each product, check available stock vs reorder level
    // 3. Generate automatic reorder requests for low-stock items
    // 4. Notify inventory manager

    return {
      lowStockItems: [],
      reorderRequestsCreated: 0,
    };
  }

  /**
   * Check for expiring batches and generate alerts
   */
  async checkExpiringBatches(branchId: number, daysUntilExpiry: number = 30) {
    // TODO: Implement expiry checking
    // 1. Query batches expiring within specified days
    // 2. Generate alerts for pharmacist
    // 3. Suggest FEFO-based dispensing order
    // 4. Flag for potential write-off if not sold

    return {
      expiringBatches: [],
      alertCount: 0,
    };
  }

  /**
   * Perform inventory adjustment (damage, loss, theft, etc.)
   */
  async adjustInventory(params: {
    branchId: number;
    batchId: number;
    quantityChange: number;
    reason: "damaged" | "expired" | "loss" | "theft" | "correction";
    reference: string;
    createdBy: number;
  }) {
    // TODO: Implement inventory adjustment
    // 1. Validate batch exists
    // 2. Update batch quantity
    // 3. Create inventory transaction record
    // 4. Log audit trail
    // 5. Trigger alerts if significant loss

    return {
      success: true,
      newQuantity: 0,
    };
  }

  /**
   * Generate inventory valuation report
   */
  async generateInventoryValuation(branchId: number) {
    // TODO: Implement inventory valuation
    // 1. Get all batches at branch
    // 2. Calculate total value (quantity * cost price)
    // 3. Identify slow-moving stock
    // 4. Calculate potential write-offs
    // 5. Generate report

    return {
      totalValue: 0,
      batchCount: 0,
      slowMovingItems: [],
      potentialWriteOffs: [],
    };
  }
}

export const inventoryService = new InventoryService();

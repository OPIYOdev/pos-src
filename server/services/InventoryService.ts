import * as db from "../db";

/**
 * TODOs: COMPLETE IMPLEMENTATION, NOT COMPLETE
 * WORK IN PROGRESSs
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
    userId: number;
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

        const grnResult = await db.createGrn({
      grnNumber,
      branchId: params.branchId,
      supplierId: params.supplierId,
      invoiceNumber: params.invoiceNumber,
      status: discrepancies.length === 0 ? "verified" : "pending_review",
      verifiedBy: params.userId, // Assuming userId is passed in params for GRN creation
    });

    for (const item of params.items) {
      await db.createGrnItem({
        grnId: grnResult.insertId,
        productId: item.productId,
        batchNumber: item.batchNumber,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: item.quantityReceived,
        expiryDate: item.expiryDate,
        costPrice: item.costPrice,
      });

      await db.createInventoryBatch({
        branchId: params.branchId,
        productId: item.productId,
        batchNumber: item.batchNumber,
        quantityAvailable: item.quantityReceived,
        expiryDate: item.expiryDate,
        costPrice: item.costPrice,
        sellingPrice: item.costPrice * 1.2, // Assuming 20% markup for selling price
      });

      // Log inventory transaction
      await db.createInventoryTransaction({
        batchId: inventoryBatchResult.insertId,
        productId: item.productId,
        branchId: params.branchId,
        transactionType: "GRN",
        quantity: item.quantityReceived,
        currentQuantity: item.quantityReceived, // This will be updated later
        reason: "Goods Received",
        referenceId: grnResult.insertId,
        userId: params.userId,
      });
    }

    // Log audit trail
    // Assuming userId is available in params
    await db.createAuditLog({
      userId: params.userId,
      action: "CREATE",
      module: "INVENTORY",
      entityType: "GRN",
      entityId: grnNumber,
      newValues: { grnNumber, itemCount: params.items.length },
      status: "success",
    });

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
        const lowStockProducts = await db.getProductsBelowReorderLevel(branchId);

    // In a real system, this would generate reorder requests and notify managers.
    // For now, we just return the list of low stock items.
    return {
      lowStockItems: lowStockProducts.map((p) => ({
        productId: p.product.id,
        productName: p.product.genericName,
        currentStock: p.totalAvailable,
        reorderLevel: p.product.reorderLevel,
        reorderQuantity: p.product.reorderQuantity,
      })),
      reorderRequestsCreated: 0,
    };


  }

  /**
   * Check for expiring batches and generate alerts
   */
  async checkExpiringBatches(branchId: number, daysUntilExpiry: number = 30) {
        const expiringBatches = await db.getExpiringBatches(branchId, daysUntilExpiry);

    // In a real system, this would generate alerts for pharmacists and suggest dispensing order.
    // For now, we just return the list of expiring batches.
    return {
      expiringBatches: expiringBatches.map((b) => ({
        batchId: b.id,
        productId: b.productId,
        batchNumber: b.batchNumber,
        quantityAvailable: b.quantityAvailable,
        expiryDate: b.expiryDate,
      })),
      alertCount: expiringBatches.length,
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
        const batch = await db.getInventoryBatchById(params.batchId);
    if (!batch) {
      throw new Error(`Batch with ID ${params.batchId} not found`);
    }

    await db.updateInventoryBatchQuantity(params.batchId, params.quantityChange);

    const updatedBatch = await db.getInventoryBatchById(params.batchId);

    await db.createInventoryTransaction({
      batchId: params.batchId,
      productId: batch.productId,
      branchId: params.branchId,
      transactionType: "ADJUSTMENT",
      quantity: params.quantityChange,
      currentQuantity: updatedBatch?.quantityAvailable || 0,
      reason: params.reason,
      referenceId: params.batchId,
      userId: params.createdBy,
    });

    await db.createAuditLog({
      userId: params.createdBy,
      action: "UPDATE",
      module: "INVENTORY",
      entityType: "BATCH",
      entityId: params.batchId.toString(),
      oldValues: { quantity: batch.quantityAvailable },
      newValues: { quantity: updatedBatch?.quantityAvailable },
      status: "success",
    });

    return {
      success: true,
      newQuantity: updatedBatch?.quantityAvailable || 0,
    };


  }

  /**
   * Generate inventory valuation report
   */
  async generateInventoryValuation(branchId: number) {
        const valuationData = await db.getInventoryValuationData(branchId);

    let totalValue = 0;
    const slowMovingItems: any[] = [];
    const potentialWriteOffs: any[] = [];

    for (const item of valuationData) {
      const itemValue = parseFloat(item.quantity.toString()) * parseFloat(item.costPrice.toString());
      totalValue += itemValue;

      // Simple logic for slow-moving and potential write-offs (can be expanded)
      if (item.quantity > 100 && item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) {
        slowMovingItems.push(item);
      }
      if (item.expiryDate && new Date(item.expiryDate) < new Date()) {
        potentialWriteOffs.push(item);
      }
    }

    return {
      totalValue,
      batchCount: valuationData.length,
      slowMovingItems,
      potentialWriteOffs,
    };


  }
}

export const inventoryService = new InventoryService();

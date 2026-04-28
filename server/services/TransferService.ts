import * as db from "../db";

/**
 * TransferService - Handles multi-branch transfer operations
 * Implements FEFO batch selection, cost allocation, and settlement logic
 */
export class TransferService {
  /**
   * Create transfer request with stock validation
   */
  async createTransferRequest(params: {
    sourceBranchId: number;
    destinationBranchId: number;
    requestedBy: number;
    items: Array<{
      productId: number;
      quantityRequested: number;
      batchPreference?: "FEFO" | "LIFO" | "any";
    }>;
    priority: "urgent" | "normal" | "low";
    reason: string;
    requiredByDate?: string;
    allowPartial?: boolean;
  }) {
    if (params.sourceBranchId === params.destinationBranchId) {
      throw new Error("Source and destination branches cannot be the same");
    }

    // Validate stock availability
    let totalEstimatedValue = 0;
    const validatedItems = [];

    for (const item of params.items) {
      const available = await db.getAvailableStock(
        params.sourceBranchId,
        item.productId
      );

      if (available < item.quantityRequested && !params.allowPartial) {
        throw new Error(
          `Insufficient stock for product ${item.productId}: available ${available}, requested ${item.quantityRequested}`
        );
      }

      // Get product cost for valuation
      const product = await db.getProductById(item.productId);
      if (product) {
        // TODO: Get average cost price for product
        // totalEstimatedValue += item.quantityRequested * averageCostPrice;
      }

      validatedItems.push({
        ...item,
        quantityApproved: Math.min(available, item.quantityRequested),
      });
    }

    const requestId = `TR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;

        const transferRequestResult = await db.createTransferRequest({
      requestId,
      sourceBranchId: params.sourceBranchId,
      destinationBranchId: params.destinationBranchId,
      requestedBy: params.requestedBy,
      priority: params.priority,
      reason: params.reason,
      requiredByDate: params.requiredByDate,
      status: "pending_approval",
      totalEstimatedValue,
    });

    for (const item of validatedItems) {
      await db.createTransferRequestItem({
        transferRequestId: transferRequestResult.insertId,
        productId: item.productId,
        quantityRequested: item.quantityRequested,
        quantityApproved: item.quantityApproved,
      });
    }

    await db.createAuditLog({
      userId: params.requestedBy,
      action: "CREATE",
      module: "TRANSFER",
      entityType: "TRANSFER_REQUEST",
      entityId: requestId,
      newValues: { requestId, totalItems: validatedItems.length, totalEstimatedValue },
      status: "success",
    });

    // TODO: Trigger approval workflow based on value

    return {
      requestId,
      status: "pending_approval",
      totalItems: validatedItems.length,
      totalEstimatedValue,
    };
  }

  /**
   * Approve transfer request and create transfer order
   */
  async approveAndCreateTransferOrder(params: {
    transferRequestId: number;
    approvedBy: number;
    approvedItems?: Array<{
      itemId: number;
      quantityApproved: number;
    }>;
  }) {
        const request = await db.getTransferRequestById(params.transferRequestId);
    if (!request || request.status !== "pending_approval") {
      throw new Error("Transfer request not found or not pending approval");
    }

    const orderNumber = `TO-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

    const transferOrderResult = await db.createTransferOrder({
      transferRequestId: params.transferRequestId,
      orderNumber,
      sourceBranchId: request.sourceBranchId,
      destinationBranchId: request.destinationBranchId,
      approvedBy: params.approvedBy,
      status: "created",
    });

    const requestItems = await db.getTransferRequestItems(params.transferRequestId);

    for (const item of requestItems) {
      const selectedBatches = await db.selectBatchesFEFO(
        request.sourceBranchId,
        item.productId,
        item.quantityApproved
      );

      for (const batch of selectedBatches) {
        await db.createTransferOrderItem({
          transferOrderId: transferOrderResult.insertId,
          productId: item.productId,
          batchId: batch.batchId,
          quantity: batch.quantityToTake,
        });
        await db.updateInventoryBatchReserved(batch.batchId, batch.quantityToTake);
      }
    }

    await db.updateTransferRequestStatus(params.transferRequestId, "approved");

    await db.createAuditLog({
      userId: params.approvedBy,
      action: "UPDATE",
      module: "TRANSFER",
      entityType: "TRANSFER_REQUEST",
      entityId: request.requestId,
      newValues: { status: "approved", orderNumber },
      status: "success",
    });

    // TODO: Generate pick slip

    return {
      orderNumber,
      status: "approved",
      itemCount: requestItems.length,
    };
  }

  /**
   * Process transfer dispatch with waybill generation
   */
  async dispatchTransfer(params: {
    transferOrderId: number;
    dispatchedBy: number;
    transporterDetails?: {
      name: string;
      phone: string;
      vehicle: string;
      estimatedDelivery: string;
    };
  }) {
        const order = await db.getTransferOrderById(params.transferOrderId);
    if (!order || order.status !== "created") {
      throw new Error("Transfer order not found or not ready for dispatch");
    }

    const waybillNumber = `WB-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

    await db.updateTransferOrderStatus(params.transferOrderId, "dispatched");

    await db.createAuditLog({
      userId: params.dispatchedBy,
      action: "UPDATE",
      module: "TRANSFER",
      entityType: "TRANSFER_ORDER",
      entityId: order.orderNumber,
      newValues: { status: "dispatched", waybillNumber, transporterDetails: params.transporterDetails },
      status: "success",
    });

    // TODO: Notify destination branch
    // TODO: Schedule delivery reminder

    return {
      waybillNumber: "WB-" + Date.now(),
      status: "dispatched",
    };
  }

  /**
   * Receive transfer at destination branch
   */
  async receiveTransfer(params: {
    transferOrderId: number;
    receivedBy: number;
    receivedItems: Array<{
      itemId: number;
      quantityReceived: number;
      condition: "good" | "damaged" | "expired";
      notes?: string;
    }>;
  }) {
        const order = await db.getTransferOrderById(params.transferOrderId);
    if (!order || order.status !== "dispatched") {
      throw new Error("Transfer order not found or not dispatched");
    }

    const discrepancies = [];
    for (const receivedItem of params.receivedItems) {
      const orderItem = await db.getTransferOrderItemById(receivedItem.itemId);
      if (!orderItem) {
        discrepancies.push({
          itemId: receivedItem.itemId,
          reason: "ITEM_NOT_IN_ORDER",
          receivedQuantity: receivedItem.quantityReceived,
        });
        continue;
      }

      if (receivedItem.quantityReceived !== orderItem.quantity) {
        discrepancies.push({
          itemId: receivedItem.itemId,
          reason: "QUANTITY_MISMATCH",
          expected: orderItem.quantity,
          received: receivedItem.quantityReceived,
        });
      }

      if (receivedItem.condition !== "good") {
        discrepancies.push({
          itemId: receivedItem.itemId,
          reason: receivedItem.condition.toUpperCase(),
          notes: receivedItem.notes,
        });
      }

      // Create inventory batches at destination
      await db.createInventoryBatch({
        branchId: order.destinationBranchId,
        productId: orderItem.productId,
        batchNumber: (await db.getInventoryBatchById(orderItem.batchId))?.batchNumber || "UNKNOWN",
        quantityAvailable: receivedItem.quantityReceived,
        expiryDate: (await db.getInventoryBatchById(orderItem.batchId))?.expiryDate || new Date().toISOString(),
        costPrice: (await db.getInventoryBatchById(orderItem.batchId))?.costPrice || 0,
        sellingPrice: (await db.getInventoryBatchById(orderItem.batchId))?.sellingPrice || 0,
      });

      // Deduct from source branch reserved quantity and add to destination branch available quantity
      await db.updateInventoryBatchReserved(orderItem.batchId, -orderItem.quantity);
      await db.updateInventoryBatchQuantity(orderItem.batchId, -orderItem.quantity); // Deduct from source available

      await db.createInventoryTransaction({
        batchId: orderItem.batchId,
        productId: orderItem.productId,
        branchId: order.destinationBranchId,
        transactionType: "TRANSFER_IN",
        quantity: receivedItem.quantityReceived,
        currentQuantity: receivedItem.quantityReceived, // This will be updated later
        reason: "Transfer In",
        referenceId: params.transferOrderId,
        userId: params.receivedBy,
      });
    }

    await db.updateTransferOrderStatus(params.transferOrderId, "received");

    await db.createAuditLog({
      userId: params.receivedBy,
      action: "UPDATE",
      module: "TRANSFER",
      entityType: "TRANSFER_ORDER",
      entityId: order.orderNumber,
      newValues: { status: "received", discrepancies },
      status: "success",
    });

    // TODO: Trigger settlement calculation

    return {
      status: "received",
      discrepancies: [],
    };
  }

  /**
   * Handle transfer discrepancies (shortages, damage, expiry)
   */
  async resolveDiscrepancy(params: {
    transferOrderId: number;
    discrepancyType:
      | "quantity_short"
      | "quantity_excess"
      | "damaged"
      | "expired"
      | "wrong_product";
    expectedQuantity: number;
    receivedQuantity: number;
    resolution: "credit_note" | "return" | "accept_loss" | "negotiate_discount";
    resolvedBy: number;
  }) {
        const order = await db.getTransferOrderById(params.transferOrderId);
    if (!order) {
      throw new Error("Transfer order not found");
    }

    // In a real system, this would involve more complex logic for inventory updates and financial adjustments.
    // For now, we'll just log the resolution and update the transfer status.

    await db.createAuditLog({
      userId: params.resolvedBy,
      action: "UPDATE",
      module: "TRANSFER",
      entityType: "TRANSFER_DISCREPANCY",
      entityId: params.transferOrderId.toString(),
      newValues: { discrepancyType: params.discrepancyType, resolution: params.resolution },
      status: "success",
    });

    // Update transfer status to reflect resolution (e.g., 'completed' if all discrepancies are resolved)
    // For simplicity, we'll just return the status as 'resolved'


    return {
      status: "resolved",
      creditNoteNumber: params.resolution === "credit_note" ? "CN-" + Date.now() : undefined,
    };
  }

  /**
   * Calculate transfer costs with allocation rules
   */
  async calculateTransferCosts(transferOrderId: number) {
        const orderDetails = await db.getTransferOrderDetails(transferOrderId);
    if (!orderDetails) {
      throw new Error("Transfer order not found");
    }

    const totalOrderValue = orderDetails.items.reduce(
      (sum: number, item: any) => sum + (parseFloat(item.quantity.toString()) * parseFloat(item.product.costPrice.toString())),
      0
    );

    // Stub for transport cost (e.g., based on distance, weight, etc.)
    const transportCost = 50; // Placeholder value
    const handlingFee = totalOrderValue * 0.02;
    const insuranceCost = totalOrderValue * 0.005;
    const totalCost = transportCost + handlingFee + insuranceCost;

    let sourcePortion = 0;
    let destinationPortion = 0;

    // Apply allocation rules:
    //   - Source bears handling
    //   - Destination bears transport
    //   - Insurance split 50/50
    //   - Emergency: destination bears all (assuming 'urgent' priority for emergency)
    if (orderDetails.priority === "urgent") {
      destinationPortion = totalCost;
    } else {
      sourcePortion = handlingFee;
      destinationPortion = transportCost + (insuranceCost / 2);
      sourcePortion += (insuranceCost / 2);
    }

    await db.createTransferCost({
      transferOrderId,
      transportCost,
      handlingFee,
      insuranceCost,
      totalCost,
      sourcePortion,
      destinationPortion,
    });

    await db.createAuditLog({
      userId: orderDetails.approvedBy, // Assuming approvedBy is the one triggering cost calculation
      action: "CREATE",
      module: "TRANSFER",
      entityType: "TRANSFER_COST",
      entityId: transferOrderId.toString(),
      newValues: { totalCost, sourcePortion, destinationPortion },
      status: "success",
    });

    return {
      transport: transportCost,
      handling: handlingFee,
      insurance: insuranceCost,
      total: totalCost,
      allocation: {
        sourcePortion,
        destinationPortion,
      },
    };
  }

  /**
   * Generate monthly inter-branch settlement
   */
  async generateMonthlySettlement(branchId: number, month: number, year: number) {
        const transfersAsSource = await db.getCompletedTransfersAsSource(branchId, month, year);
    const transfersAsDestination = await db.getCompletedTransfersAsDestination(branchId, month, year);

    let valueSent = 0;
    for (const transfer of transfersAsSource) {
      const orderDetails = await db.getTransferOrderDetails(transfer.id);
      if (orderDetails) {
        valueSent += orderDetails.items.reduce(
          (sum: number, item: any) => sum + (parseFloat(item.quantity.toString()) * parseFloat(item.product.costPrice.toString())),
          0
        );
      }
    }

    let valueReceived = 0;
    for (const transfer of transfersAsDestination) {
      const orderDetails = await db.getTransferOrderDetails(transfer.id);
      if (orderDetails) {
        valueReceived += orderDetails.items.reduce(
          (sum: number, item: any) => sum + (parseFloat(item.quantity.toString()) * parseFloat(item.product.costPrice.toString())),
          0
        );
      }
    }

    const netSettlement = valueReceived - valueSent;
    const settlementMonth = `${year}-${String(month).padStart(2, "0")}`;

    await db.createInterBranchSettlement({
      branchId,
      settlementMonth,
      valueSent,
      valueReceived,
      netSettlement,
      status: netSettlement === 0 ? "balanced" : "pending",
    });

    await db.createAuditLog({
      userId: 1, // Assuming an admin user for scheduled tasks
      action: "CREATE",
      module: "FINANCE",
      entityType: "INTER_BRANCH_SETTLEMENT",
      entityId: `${branchId}-${settlementMonth}`,
      newValues: { valueSent, valueReceived, netSettlement },
      status: "success",
    });

    // TODO: Generate settlement report

    return {
      branchId,
      settlementMonth,
      valueSent,
      valueReceived,
      netSettlement,
      status: netSettlement === 0 ? "balanced" : "pending",
    };
  }

  /**
   * Get transfer analytics and performance metrics
   */
  async getTransferAnalytics(branchId?: number) {
        // For simplicity, these are placeholder calculations.
    // In a real system, this would involve querying historical transfer data.
    const transferCount = 100; // Placeholder
    const avgCompletionHours = 24; // Placeholder
    const discrepancyRate = 0.05; // Placeholder
    const optimizationScore = 85; // Placeholder

    return {
      transferCount,
      avgCompletionHours,
      discrepancyRate,
      optimizationScore,
    };


  }
}

export const transferService = new TransferService();

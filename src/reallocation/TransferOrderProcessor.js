const db = require('../db');

class TransferOrderProcessor {
  async createTransferOrder(transferRequest) {
    const transferOrder = await db.TransferOrder.create({
      transfer_request_id: transferRequest.id,
      order_number: this.generateOrderNumber(),
      source_branch_id: transferRequest.source_branch_id,
      destination_branch_id: transferRequest.destination_branch_id,
      status: 'CREATED',
      created_by: transferRequest.approved_by,
      created_at: new Date(),
      expected_delivery_date: this.calculateExpectedDelivery(transferRequest.priority),
      priority: transferRequest.priority
    });
    
    for (const requestItem of transferRequest.TransferRequestItems) {
      if (requestItem.quantity_approved > 0) {
        const batches = await this.selectBatchesFEFO(requestItem.drug_id, requestItem.quantity_approved, transferRequest.source_branch_id);
        for (const batch of batches) {
          await db.TransferOrderItem.create({
            transfer_order_id: transferOrder.id,
            drug_id: requestItem.drug_id,
            batch_id: batch.batch_id,
            quantity: batch.quantity_to_take,
            unit_cost: batch.cost_price,
            total_cost: batch.quantity_to_take * batch.cost_price,
            status: 'PENDING'
          });
          await this.reserveStock(batch.batch_id, batch.quantity_to_take);
        }
      }
    }
    return transferOrder;
  }

  async selectBatchesFEFO(drugId, quantityNeeded, branchId) {
    const batches = await db.InventoryBatch.findAll({
      where: { drug_id: drugId, branch_id: branchId, quantity_available: { [db.Op.gt]: 0 }, expiry_date: { [db.Op.gte]: new Date() }, is_reserved: false },
      order: [['expiry_date', 'ASC']]
    });
    const selectedBatches = [];
    let remainingQuantity = quantityNeeded;
    for (const batch of batches) {
      if (remainingQuantity <= 0) break;
      const takeQuantity = Math.min(batch.quantity_available, remainingQuantity);
      selectedBatches.push({ batch_id: batch.id, quantity_to_take: takeQuantity, cost_price: batch.cost_price, expiry_date: batch.expiry_date });
      remainingQuantity -= takeQuantity;
    }
    if (remainingQuantity > 0) throw new Error(`Insufficient stock across batches. Shortfall: ${remainingQuantity}`);
    return selectedBatches;
  }

  async dispatchTransferOrder(orderId, transporterInfo) {
    const transferOrder = await db.TransferOrder.findByPk(orderId, { include: [{ model: db.TransferOrderItem }] });
    if (transferOrder.status !== 'PICKED') throw new Error(`Cannot dispatch order in ${transferOrder.status} state`);
    
    const waybill = await db.Waybill.create({
      transfer_order_id: orderId,
      waybill_number: `WB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      transporter_name: transporterInfo.name,
      transporter_contact: transporterInfo.contact,
      vehicle_number: transporterInfo.vehicle_number,
      driver_name: transporterInfo.driver_name,
      estimated_arrival: transporterInfo.estimated_arrival,
      created_at: new Date()
    });
    
    transferOrder.status = 'DISPATCHED';
    transferOrder.dispatched_at = new Date();
    transferOrder.transporter_details = JSON.stringify(transporterInfo);
    transferOrder.waybill_id = waybill.id;
    await transferOrder.save();
    
    await this.notifyDestinationBranch(transferOrder.destination_branch_id, {
      order_number: transferOrder.order_number,
      estimated_arrival: transporterInfo.estimated_arrival,
      waybill_number: waybill.waybill_number,
      total_items: transferOrder.TransferOrderItems.reduce((sum, i) => sum + i.quantity, 0)
    });
    this.scheduleArrivalReminder(transferOrder.id, transporterInfo.estimated_arrival);
    return { transferOrder, waybill };
  }

  async receiveTransferOrder(orderId, receivedBy) {
    const transferOrder = await db.TransferOrder.findByPk(orderId, { include: [{ model: db.TransferOrderItem, include: [db.Batch] }, { model: db.TransferRequest }] });
    if (transferOrder.status !== 'DISPATCHED' && transferOrder.status !== 'IN_TRANSIT') throw new Error(`Cannot receive order in ${transferOrder.status} state`);
    
    transferOrder.status = 'RECEIVED';
    transferOrder.received_at = new Date();
    transferOrder.received_by = receivedBy;
    await transferOrder.save();
    
    const receiving = await db.TransferReceiving.create({
      transfer_order_id: orderId,
      received_by: receivedBy,
      received_at: new Date(),
      verification_status: 'PENDING'
    });
    return receiving;
  }

  async verifyAndCompleteTransfer(orderId, verificationData) {
    const transferOrder = await db.TransferOrder.findByPk(orderId, { include: [{ model: db.TransferOrderItem }] });
    const receiving = await db.TransferReceiving.findOne({ where: { transfer_order_id: orderId, verification_status: 'PENDING' } });
    let hasDiscrepancies = false;
    const discrepancies = [];
    
    for (const item of transferOrder.TransferOrderItems) {
      const receivedItem = verificationData.items.find(i => i.item_id === item.id);
      if (!receivedItem) {
        discrepancies.push({ item_id: item.id, expected: item.quantity, received: 0, reason: 'Item not received' });
        hasDiscrepancies = true;
        continue;
      }
      if (receivedItem.quantity !== item.quantity) {
        discrepancies.push({ item_id: item.id, expected: item.quantity, received: receivedItem.quantity, reason: receivedItem.discrepancy_reason || 'Quantity mismatch' });
        hasDiscrepancies = true;
      }
      if (receivedItem.damaged_quantity > 0) {
        discrepancies.push({ item_id: item.id, damaged_quantity: receivedItem.damaged_quantity, reason: 'Damaged goods' });
        hasDiscrepancies = true;
      }
    }
    
    if (hasDiscrepancies) {
      receiving.verification_status = 'DISCREPANCY_FOUND';
      receiving.discrepancy_details = JSON.stringify(discrepancies);
      await receiving.save();
      transferOrder.status = 'DISPUTED';
      await transferOrder.save();
      await this.createDiscrepancyReport(orderId, discrepancies);
      return { status: 'DISPUTED', message: 'Discrepancies found. Please resolve before completion.', discrepancies: discrepancies };
    }
    
    receiving.verification_status = 'VERIFIED';
    receiving.completed_at = new Date();
    await receiving.save();
    
    for (const item of transferOrder.TransferOrderItems) {
      await this.releaseReservedStock(item.batch_id, item.quantity);
      await this.addStockToDestination(item.drug_id, item.batch_id, item.quantity, transferOrder.destination_branch_id, item.unit_cost);
    }
    
    transferOrder.status = 'COMPLETED';
    transferOrder.completed_at = new Date();
    await transferOrder.save();
    return { status: 'COMPLETED', message: 'Transfer completed successfully' };
  }

  generateOrderNumber() { return `TO-${Date.now()}`; }
  calculateExpectedDelivery(priority) { return new Date(); }
  async reserveStock(batchId, quantity) {}
  async notifyDestinationBranch(branchId, data) {}
  scheduleArrivalReminder(orderId, time) {}
  async createDiscrepancyReport(orderId, discrepancies) {}
  async releaseReservedStock(batchId, quantity) {}
  async addStockToDestination(drugId, batchId, quantity, branchId, unitCost) {}
}

module.exports = TransferOrderProcessor;

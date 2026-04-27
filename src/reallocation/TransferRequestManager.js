const db = require('../db');

class TransferRequestManager {
  async createTransferRequest(requestData) {
    if (requestData.source_branch_id === requestData.destination_branch_id) {
      throw new Error('Source and destination branches cannot be the same');
    }
    const requestId = `TR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random() * 10000).toString().padStart(4,'0')}`;
    
    for (const item of requestData.items) {
      const availableStock = await this.checkBranchStock(item.drug_id, requestData.source_branch_id);
      if (availableStock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.drug_name}. Available: ${availableStock}`);
      }
      const branchLimits = await this.getBranchTransferLimits(requestData.source_branch_id);
      if (item.quantity > branchLimits.max_per_transfer) {
        throw new Error(`Quantity exceeds maximum transfer limit of ${branchLimits.max_per_transfer}`);
      }
    }
    
    const transferRequest = await db.TransferRequest.create({
      request_id: requestId,
      source_branch_id: requestData.source_branch_id,
      destination_branch_id: requestData.destination_branch_id,
      requested_by: requestData.requested_by,
      priority: requestData.priority || 'NORMAL',
      status: 'PENDING_APPROVAL',
      total_items: requestData.items.length,
      total_estimated_value: await this.calculateTotalValue(requestData.items),
      created_at: new Date(),
      required_by_date: requestData.required_by_date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      reason: requestData.reason
    });
    
    for (const item of requestData.items) {
      await db.TransferRequestItem.create({
        transfer_request_id: transferRequest.id,
        drug_id: item.drug_id,
        quantity_requested: item.quantity,
        batch_preference: item.batch_preference || 'FEFO',
        status: 'PENDING'
      });
    }
    
    await this.notifyBranchManager(requestData.destination_branch_id, `Transfer request ${requestId} requires your approval`);
    return transferRequest;
  }

  async approveTransferRequest(requestId, approverId) {
    const transferRequest = await db.TransferRequest.findOne({
      where: { request_id: requestId },
      include: [{ model: db.TransferRequestItem, include: [db.Drug] }]
    });
    if (!transferRequest) throw new Error('Transfer request not found');
    if (transferRequest.status !== 'PENDING_APPROVAL') throw new Error(`Cannot approve request in ${transferRequest.status} state`);
    if (transferRequest.required_by_date < new Date()) {
      transferRequest.status = 'EXPIRED';
      await transferRequest.save();
      throw new Error('Transfer request has expired');
    }
    
    for (const item of transferRequest.TransferRequestItems) {
      const currentStock = await this.checkBranchStock(item.drug_id, transferRequest.source_branch_id);
      if (currentStock < item.quantity_requested) {
        if (transferRequest.allow_partial) {
          item.quantity_approved = currentStock;
          item.status = 'PARTIALLY_APPROVED';
        } else {
          transferRequest.status = 'REJECTED';
          transferRequest.rejection_reason = `Insufficient stock for ${item.Drug.name}`;
          await transferRequest.save();
          throw new Error(`Insufficient stock. Available: ${currentStock}`);
        }
      } else {
        item.quantity_approved = item.quantity_requested;
        item.status = 'APPROVED';
      }
      await item.save();
    }
    
    transferRequest.status = 'APPROVED';
    transferRequest.approved_by = approverId;
    transferRequest.approved_at = new Date();
    await transferRequest.save();
    await this.createTransferOrder(transferRequest);
    return transferRequest;
  }

  async checkBranchStock(drugId, branchId) { return 1000; }
  async getBranchTransferLimits(branchId) { return { max_per_transfer: 5000 }; }
  async calculateTotalValue(items) { return 10000; }
  async notifyBranchManager(branchId, message) { console.log(message); }
  async createTransferOrder(transferRequest) { console.log('Order created'); }
}

module.exports = TransferRequestManager;

/**
 * MB-COST-001: Transfer Cost Allocation
 * Calculates and records transport, handling, and insurance costs
 * for each completed transfer order.
 *
 * Allocation rules:
 *   EMERGENCY       → destination branch bears 100 %
 *   STOCK_BALANCING → split 50 / 50 (corporate absorbs)
 *   Standard        → source 30 % (handling), destination 70 % (transport + insurance)
 */

const db = require('../db');

class TransferCostAllocator {
  /**
   * Creates cost records for a completed transfer order.
   * @param {number} transferOrderId
   * @returns {{ total_cost, breakdown, allocation }}
   */
  async allocateTransferCosts(transferOrderId) {
    const transferOrder = await db.TransferOrder.findByPk(transferOrderId, {
      include: [
        { model: db.TransferRequest },
        { model: db.TransferOrderItem }
      ]
    });

    const totalValue = transferOrder.TransferOrderItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_cost,
      0
    );

    const costs = {
      transport: this.calculateTransportCost(transferOrder),
      handling:  totalValue * 0.02,   // 2 % handling fee
      insurance: totalValue * 0.005   // 0.5 % insurance premium
    };

    let allocation;
    const reason = transferOrder.TransferRequest
      ? transferOrder.TransferRequest.reason
      : 'STANDARD';

    if (reason === 'EMERGENCY') {
      allocation = { source_portion: 0,  destination_portion: 100 };
    } else if (reason === 'STOCK_BALANCING') {
      allocation = { source_portion: 50, destination_portion: 50  };
    } else {
      allocation = { source_portion: 30, destination_portion: 70  };
    }

    await db.TransferCost.create({
      transfer_order_id:    transferOrderId,
      cost_type:            'TRANSPORT',
      amount:               costs.transport,
      currency:             'KES',
      paid_by_branch_id:    transferOrder.source_branch_id,
      allocated_to_branch_id: transferOrder.destination_branch_id,
      description:          'Transport cost for transfer order'
    });

    await db.TransferCost.create({
      transfer_order_id:    transferOrderId,
      cost_type:            'HANDLING',
      amount:               costs.handling,
      currency:             'KES',
      paid_by_branch_id:    transferOrder.source_branch_id,
      allocated_to_branch_id: transferOrder.source_branch_id,
      description:          'Handling fee — source branch'
    });

    await db.TransferCost.create({
      transfer_order_id:    transferOrderId,
      cost_type:            'INSURANCE',
      amount:               costs.insurance,
      currency:             'KES',
      paid_by_branch_id:    transferOrder.source_branch_id,
      allocated_to_branch_id: transferOrder.destination_branch_id,
      description:          'Insurance premium — split 50/50'
    });

    return {
      total_cost: costs.transport + costs.handling + costs.insurance,
      breakdown:  costs,
      allocation
    };
  }

  /**
   * Distance-based transport cost: KES 50/km × distance × volume multiplier.
   * Stub — replace getDistanceBetweenBranches with real geo lookup.
   */
  calculateTransportCost(transferOrder) {
    const baseRate        = 50; // KES per km
    const distance        = this.getDistanceBetweenBranches(
      transferOrder.source_branch_id,
      transferOrder.destination_branch_id
    );
    const volume          = this.calculateTransferVolume(transferOrder);
    const volumeMultiplier = Math.ceil(volume / 100);
    return baseRate * distance * volumeMultiplier;
  }

  getDistanceBetweenBranches(sourceBranchId, destinationBranchId) {
    // Stub: return a default distance of 20 km until geo data is available
    return 20;
  }

  calculateTransferVolume(transferOrder) {
    if (!transferOrder.TransferOrderItems) return 0;
    return transferOrder.TransferOrderItems.reduce((sum, i) => sum + i.quantity, 0);
  }
}

module.exports = TransferCostAllocator;

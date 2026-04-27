/**
 * MB-BILL-001: Inter-Branch Settlement
 * Generates monthly settlement records showing the net value
 * of stock sent versus received for each branch.
 */

const db = require('../db');
const { Op } = require('sequelize');

class InterBranchSettlement {
  /**
   * Generates a monthly settlement summary for the given branch.
   * @param {number} branchId
   * @param {number} month  - 1-based month number (1 = January)
   * @param {number} year
   * @returns {object} settlement record
   */
  async generateMonthlySettlement(branchId, month, year) {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd   = new Date(year, month, 0, 23, 59, 59);

    const transfersAsSource = await db.TransferOrder.findAll({
      where: {
        source_branch_id: branchId,
        status:           'COMPLETED',
        completed_at:     { [Op.between]: [periodStart, periodEnd] }
      },
      include: [{ model: db.TransferOrderItem }]
    });

    const transfersAsDestination = await db.TransferOrder.findAll({
      where: {
        destination_branch_id: branchId,
        status:                'COMPLETED',
        completed_at:          { [Op.between]: [periodStart, periodEnd] }
      },
      include: [{ model: db.TransferOrderItem }]
    });

    let valueSent     = 0;
    let valueReceived = 0;

    for (const transfer of transfersAsSource) {
      valueSent += transfer.TransferOrderItems.reduce(
        (sum, item) => sum + item.quantity * item.unit_cost,
        0
      );
    }

    for (const transfer of transfersAsDestination) {
      valueReceived += transfer.TransferOrderItems.reduce(
        (sum, item) => sum + item.quantity * item.unit_cost,
        0
      );
    }

    const netSettlement = valueSent - valueReceived;

    const settlement = await db.InterBranchSettlement.create({
      branch_id:        branchId,
      settlement_month: periodStart,
      value_sent:       valueSent,
      value_received:   valueReceived,
      net_settlement:   netSettlement,
      status:           netSettlement >= 0 ? 'OWED_TO_CORPORATE' : 'OWED_FROM_CORPORATE',
      generated_at:     new Date()
    });

    return settlement;
  }
}

module.exports = InterBranchSettlement;

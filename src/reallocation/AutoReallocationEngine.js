/**
 * MB-AUTO-001: Automated Product Reallocation Engine
 * Runs every 6 hours or on demand.
 * Identifies overstocked branches and creates auto-transfer requests
 * to branches with low stock, using FEFO batch selection.
 */

const db = require('../db');
const { Op } = require('sequelize');

class AutoReallocationEngine {
  /**
   * Main entry point — scans all active branches and triggers
   * auto-transfer requests where stock imbalances are detected.
   */
  async runReallocationCheck() {
    const branches = await db.Branch.findAll({ where: { is_active: true } });

    for (const sourceBranch of branches) {
      const overstockedItems = await this.getOverstockedItems(sourceBranch.id);

      for (const overstock of overstockedItems) {
        const needyBranches = await this.findBranchesWithLowStock(
          overstock.drug_id,
          sourceBranch.id,
          30 // days-of-stock threshold
        );

        for (const needyBranch of needyBranches) {
          const transferQuantity = this.calculateOptimalTransferQuantity(
            overstock,
            needyBranch,
            sourceBranch
          );

          if (transferQuantity > 0) {
            await this.createAutoTransferRequest({
              drug_id:               overstock.drug_id,
              quantity:              transferQuantity,
              source_branch_id:      sourceBranch.id,
              destination_branch_id: needyBranch.branch_id,
              reason:                'AUTO_REBALANCE',
              priority:              'NORMAL',
              batch_selection:       'FEFO'
            });
          }
        }
      }
    }
  }

  /**
   * Returns drugs at the given branch that have more than 90 days of stock
   * and at least 100 units on hand.
   */
  async getOverstockedItems(branchId) {
    const [items] = await db.sequelize.query(`
      SELECT
        ib.drug_id,
        d.generic_name,
        SUM(ib.quantity_available)                                          AS total_stock,
        COALESCE(AVG(ds.daily_sales_30d), 0)                               AS avg_daily_sales,
        (SUM(ib.quantity_available) / NULLIF(AVG(ds.daily_sales_30d), 0))  AS days_of_stock
      FROM inventory_batches ib
      JOIN drugs d ON ib.drug_id = d.id
      LEFT JOIN drug_sales_stats ds
             ON d.id = ds.drug_id AND ds.branch_id = ib.branch_id
      WHERE ib.branch_id       = :branchId
        AND ib.expiry_date     > DATE_ADD(CURDATE(), INTERVAL 90 DAY)
        AND ib.is_quarantined  = FALSE
      GROUP BY ib.drug_id, d.generic_name
      HAVING days_of_stock > 90
         AND total_stock   > 100
      ORDER BY days_of_stock DESC
    `, { replacements: { branchId } });

    return items;
  }

  /**
   * Returns active branches (excluding the source) whose stock for the
   * given drug is below the threshold in days.
   */
  async findBranchesWithLowStock(drugId, excludeBranchId, thresholdDays) {
    const [branches] = await db.sequelize.query(`
      SELECT
        b.id   AS branch_id,
        b.branch_name,
        b.region,
        COALESCE(SUM(ib.quantity_available), 0)  AS current_stock,
        COALESCE(AVG(ds.daily_sales_30d), 0)     AS avg_daily_sales,
        CASE
          WHEN COALESCE(AVG(ds.daily_sales_30d), 0) > 0
            THEN COALESCE(SUM(ib.quantity_available), 0) / AVG(ds.daily_sales_30d)
          ELSE 999
        END AS days_of_stock
      FROM branches b
      LEFT JOIN inventory_batches ib
             ON b.id = ib.branch_id AND ib.drug_id = :drugId
      LEFT JOIN drug_sales_stats ds
             ON b.id = ds.branch_id AND ds.drug_id = :drugId
      WHERE b.id        != :excludeBranchId
        AND b.is_active  = TRUE
      GROUP BY b.id, b.branch_name, b.region
      HAVING days_of_stock < :thresholdDays
          OR current_stock = 0
      ORDER BY days_of_stock ASC
    `, { replacements: { drugId, excludeBranchId, thresholdDays } });

    return branches;
  }

  /**
   * Calculates how many units to move from the overstocked branch
   * to the needy branch, respecting minimum batch sizes.
   */
  calculateOptimalTransferQuantity(overstock, needyBranch, sourceBranch) {
    const targetDaysStock  = 45;
    const minTransfer      = 50;

    let neededQuantity = Math.max(
      0,
      (targetDaysStock * needyBranch.avg_daily_sales) - needyBranch.current_stock
    );

    const sourceExcess       = overstock.total_stock - (60 * overstock.avg_daily_sales);
    const maxFromSource      = sourceExcess * 0.5;
    let transferQuantity     = Math.min(neededQuantity, maxFromSource);

    if (transferQuantity < minTransfer) return 0;

    // Round down to nearest 10 units
    return Math.floor(transferQuantity / 10) * 10;
  }

  /**
   * Creates an AUTO_GENERATED transfer request, skipping duplicates
   * raised within the last 24 hours.  Low-value requests (<KES 50,000)
   * are auto-approved; higher-value ones are routed for manual review.
   */
  async createAutoTransferRequest(params) {
    const existingRequest = await db.TransferRequest.findOne({
      where: {
        drug_id:               params.drug_id,
        source_branch_id:      params.source_branch_id,
        destination_branch_id: params.destination_branch_id,
        status:                ['PENDING_APPROVAL', 'APPROVED'],
        created_at:            { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    if (existingRequest) {
      console.log(`Auto-transfer request already exists for drug ${params.drug_id}`);
      return null;
    }

    const transferRequest = await db.TransferRequest.create({
      request_id:            `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      source_branch_id:      params.source_branch_id,
      destination_branch_id: params.destination_branch_id,
      requested_by:          1, // System user
      priority:              params.priority,
      status:                'AUTO_GENERATED',
      total_items:           1,
      reason:                params.reason,
      auto_generated:        true,
      created_at:            new Date()
    });

    await db.TransferRequestItem.create({
      transfer_request_id: transferRequest.id,
      drug_id:             params.drug_id,
      quantity_requested:  params.quantity,
      batch_preference:    params.batch_selection,
      status:              'PENDING'
    });

    const totalValue = await this.calculateItemValue(params.drug_id, params.quantity);
    if (totalValue < 50000) {
      await this.autoApproveTransfer(transferRequest.id);
    } else {
      await this.notifyForManualApproval(transferRequest.id);
    }

    return transferRequest;
  }

  async calculateItemValue(drugId, quantity) {
    // Stub: replace with real cost-price lookup
    return quantity * 100;
  }

  async autoApproveTransfer(transferRequestId) {
    await db.TransferRequest.update(
      { status: 'APPROVED', approved_by: 1, approved_at: new Date() },
      { where: { id: transferRequestId } }
    );
  }

  async notifyForManualApproval(transferRequestId) {
    console.log(`Manual approval required for transfer request ${transferRequestId}`);
  }
}

module.exports = AutoReallocationEngine;

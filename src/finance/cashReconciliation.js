/**
 * FIN-CASH-001: Cash Drawer Reconciliation
 * Variance thresholds per approved procedures:
 *   ≤200       → LOG only
 *   201–1,000  → Written warning
 *   >1,000     → Formal investigation + suspend cashier
 */

class CashDrawerReconciliation {
  reconcile(expectedTotal, physicalCash, cashierId) {
    const variance    = physicalCash - expectedTotal;
    const varianceAbs = Math.abs(variance);

    const reconciliation = {
      expected_total: expectedTotal,
      physical_cash:  physicalCash,
      variance,
      status:  'RECONCILED',
      actions: [],
    };

    if (varianceAbs <= 200) {
      reconciliation.actions.push('LOG_VARIANCE');
      this.logVariance(cashierId, variance, 'MINOR');

    } else if (varianceAbs <= 1000) {
      reconciliation.status = 'WARNING';
      reconciliation.actions.push('ISSUE_WRITTEN_WARNING');
      this.issueWarning(cashierId, variance);
      this.logVariance(cashierId, variance, 'MODERATE');

    } else {
      reconciliation.status = 'INVESTIGATION_REQUIRED';
      reconciliation.actions.push('FORMAL_INVESTIGATION');
      this.escalateToManager(cashierId, variance);
      this.suspendCashierPrivileges(cashierId);
      this.logVariance(cashierId, variance, 'SEVERE');
    }

    return reconciliation;
  }

  logVariance(cashierId, variance, severity) {
    console.log(`[VARIANCE] Cashier ${cashierId} | Amount: ${variance} | Severity: ${severity}`);
    // Persist to variance_log table
  }

  issueWarning(cashierId, variance) {
    console.warn(`[WARNING] Written warning issued to cashier ${cashierId} for variance ${variance}`);
  }

  escalateToManager(cashierId, variance) {
    console.error(`[ESCALATION] Variance KES ${variance} by cashier ${cashierId} — manager notified`);
  }

  suspendCashierPrivileges(cashierId) {
    console.error(`[SECURITY] Cashier ${cashierId} privileges suspended pending investigation`);
  }
}

module.exports = { CashDrawerReconciliation };

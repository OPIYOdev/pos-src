/**
 * CUST-CREDIT-001: Credit Account Manager
 * Handles credit sales, utilization alerts, and late fee application.
 */

const { Op } = require('sequelize');
const db = require('../db');

class CreditAccountManager {
  /**
   * Process a credit sale against a customer's credit account.
   * Enforces credit limit and triggers 80% utilization SMS alert.
   */
  async processCreditSale(sale, customerId) {
    const customer = await db.Customer.findByPk(customerId, {
      include: [{ model: db.CreditAccount }],
    });

    if (!customer.creditAccount) {
      throw new Error('Customer does not have a credit account');
    }

    const creditAccount = customer.creditAccount;
    const currentUtilization = creditAccount.balance + sale.total;
    const utilizationPercentage = (currentUtilization / creditAccount.limit) * 100;

    if (currentUtilization > creditAccount.limit) {
      throw new Error(
        `Credit limit exceeded. Limit: ${creditAccount.limit}, Requested: ${currentUtilization}`
      );
    }

    // Alert customer at 80% utilization
    if (utilizationPercentage >= 80) {
      await this.sendCreditAlert(customer.phone, utilizationPercentage);
    }

    const transaction = await db.CreditTransaction.create({
      credit_account_id: creditAccount.id,
      sale_id:           sale.id,
      amount:            sale.total,
      transaction_type:  'DEBIT',
      description:       `Sale #${sale.id}`,
      due_date:          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    creditAccount.balance += sale.total;
    await creditAccount.save();

    return transaction;
  }

  /**
   * Apply 5% late fee to all accounts overdue >30 days.
   * Run nightly via scheduled job.
   */
  async applyLateFees() {
    const overdueAccounts = await db.CreditAccount.findAll({
      where: {
        balance:            { [Op.gt]: 0 },
        last_payment_date:  { [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    for (const account of overdueAccounts) {
      const daysOverdue = Math.floor(
        (Date.now() - account.last_payment_date) / (24 * 60 * 60 * 1000)
      );

      if (daysOverdue > 30) {
        const lateFee = account.balance * 0.05;

        await db.CreditTransaction.create({
          credit_account_id: account.id,
          amount:            lateFee,
          transaction_type:  'LATE_FEE',
          description:       `Late fee for ${daysOverdue} days overdue`,
        });

        account.balance += lateFee;
        await account.save();
      }
    }
  }

  async sendCreditAlert(phone, utilizationPercentage) {
    // Delegate to SMS gateway service
    await db.sms_queue.create({
      recipient: phone,
      message:   `Credit utilization alert: ${utilizationPercentage.toFixed(1)}% of your credit limit used.`,
      status:    'PENDING',
      created_at: new Date(),
    });
  }
}

module.exports = { CreditAccountManager };

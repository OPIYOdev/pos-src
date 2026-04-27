const db = require('../db');
class CreditAccountManager {
  async processCreditSale(sale, customerId) {
    const customer = await db.sequelize.models.Customer.findByPk(customerId, { include: ['CreditAccount'] });
    if (!customer || !customer.CreditAccount) throw new Error('Customer does not have a credit account');
    const creditAccount = customer.CreditAccount;
    const currentUtilization = creditAccount.balance + sale.total;
    const utilizationPercentage = (currentUtilization / creditAccount.limit) * 100;
    if (currentUtilization > creditAccount.limit) throw new Error(`Credit limit exceeded. Limit: ${creditAccount.limit}, Requested: ${currentUtilization}`);
    if (utilizationPercentage >= 80) await this.sendCreditAlert(customer.phone, utilizationPercentage);
    const transaction = await db.sequelize.models.CreditTransaction.create({
      credit_account_id: creditAccount.id,
      sale_id: sale.id,
      amount: sale.total,
      transaction_type: 'DEBIT',
      description: `Sale #${sale.id}`,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    creditAccount.balance += sale.total;
    await creditAccount.save();
    return transaction;
  }
  async applyLateFees() {
    const overdueAccounts = await db.sequelize.models.CreditAccount.findAll({
      where: { balance: { [db.Op.gt]: 0 }, last_payment_date: { [db.Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });
    for (const account of overdueAccounts) {
      const daysOverdue = Math.floor((Date.now() - account.last_payment_date) / (24 * 60 * 60 * 1000));
      if (daysOverdue > 30) {
        const lateFee = account.balance * 0.05;
        await db.sequelize.models.CreditTransaction.create({
          credit_account_id: account.id,
          amount: lateFee,
          transaction_type: 'LATE_FEE',
          description: `Late fee for ${daysOverdue} days overdue`
        });
      }
    }
  }
  async sendCreditAlert(phone, pct) { console.log(`Alert: ${phone} utilization at ${pct}%`); }
}
module.exports = { CreditAccountManager };

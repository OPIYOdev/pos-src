const db = require('../db');
class InsuranceClaimProcessor {
  async processClaim(sale, insuranceMemberId) {
    const member = await db.sequelize.models.InsuranceMember.findByPk(insuranceMemberId, { include: ['InsuranceScheme'] });
    const eligibility = await this.checkEligibility(member);
    if (!eligibility.isEligible) return { approved: false, reason: eligibility.reason };
    const benefitCheck = await this.checkBenefitLimits(member, sale.total);
    if (!benefitCheck.withinLimit) {
      const patientPortion = sale.total - benefitCheck.remainingLimit;
      return { approved: true, partialApproval: true, insuranceAmount: benefitCheck.remainingLimit, patientAmount: patientPortion };
    }
    if (sale.total > member.InsuranceScheme.preAuthThreshold) {
      const preAuth = await this.requestPreAuthorization(member, sale);
      if (!preAuth.approved) return { approved: false, reason: 'Pre-authorization denied' };
    }
    const coPayment = this.calculateCoPayment(sale.total, member.InsuranceScheme);
    const claim = await db.sequelize.models.InsuranceClaim.create({
      member_id: member.id,
      sale_id: sale.id,
      total_amount: sale.total,
      insurance_amount: sale.total - coPayment,
      patient_co_payment: coPayment,
      status: 'SUBMITTED',
      claim_date: new Date(),
      claim_reference: this.generateClaimReference()
    });
    await this.submitToInsurer(claim);
    return { approved: true, insuranceAmount: sale.total - coPayment, patientAmount: coPayment, claimReference: claim.claim_reference };
  }
  calculateCoPayment(total, scheme) {
    if (scheme.co_payment_type === 'PERCENTAGE') return total * (scheme.co_payment_value / 100);
    if (scheme.co_payment_type === 'FIXED') return Math.min(scheme.co_payment_value, total);
    return 0;
  }
  async checkEligibility(m) { return { isEligible: true }; }
  async checkBenefitLimits(m, t) { return { withinLimit: true }; }
  async requestPreAuthorization(m, s) { return { approved: true }; }
  async submitToInsurer(c) {}
  generateClaimReference() { return `CLM-${Date.now()}`; }
}
module.exports = { InsuranceClaimProcessor };

/**
 * INS-CLM-001: Insurance Claim Processor
 * Handles eligibility, benefit limits, pre-authorization, and co-payment.
 */

const db = require('../db');

class InsuranceClaimProcessor {
  async processClaim(sale, insuranceMemberId) {
    const member = await db.InsuranceMember.findByPk(insuranceMemberId, {
      include: [{ model: db.InsuranceScheme }],
    });

    // Eligibility check
    const eligibility = await this.checkEligibility(member);
    if (!eligibility.isEligible) {
      return { approved: false, reason: eligibility.reason };
    }

    // Benefit limit check (partial approval if benefits exhausted)
    const benefitCheck = await this.checkBenefitLimits(member, sale.total);
    if (!benefitCheck.withinLimit) {
      const patientPortion = sale.total - benefitCheck.remainingLimit;
      return {
        approved:        true,
        partialApproval: true,
        insuranceAmount: benefitCheck.remainingLimit,
        patientAmount:   patientPortion,
      };
    }

    // Pre-authorization for high-value claims
    if (sale.total > member.scheme.preAuthThreshold) {
      const preAuth = await this.requestPreAuthorization(member, sale);
      if (!preAuth.approved) {
        return { approved: false, reason: 'Pre-authorization denied' };
      }
    }

    const coPayment = this.calculateCoPayment(sale.total, member.scheme);

    const claim = await db.InsuranceClaim.create({
      member_id:          member.id,
      sale_id:            sale.id,
      total_amount:       sale.total,
      insurance_amount:   sale.total - coPayment,
      patient_co_payment: coPayment,
      status:             'SUBMITTED',
      claim_date:         new Date(),
      claim_reference:    this.generateClaimReference(),
    });

    await this.submitToInsurer(claim);

    return {
      approved:        true,
      insuranceAmount: sale.total - coPayment,
      patientAmount:   coPayment,
      claimReference:  claim.claim_reference,
    };
  }

  /**
   * Co-payment calculation.
   * Schemes define either PERCENTAGE or FIXED co-payment type.
   */
  calculateCoPayment(totalAmount, scheme) {
    if (scheme.co_payment_type === 'PERCENTAGE') {
      return totalAmount * (scheme.co_payment_value / 100);
    } else if (scheme.co_payment_type === 'FIXED') {
      return Math.min(scheme.co_payment_value, totalAmount);
    }
    return 0;
  }

  generateClaimReference() {
    return `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
}

module.exports = { InsuranceClaimProcessor };

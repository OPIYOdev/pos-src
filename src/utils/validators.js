/**
 * Centralized Validation Utilities
 * DRY Principle: Single source of truth for all validation logic
 * 
 * Usage:
 * validators.prescription(rxData);
 * validators.grn(grnData);
 * validators.payment(paymentData);
 */

import { ValidationError } from './errors.js';

/**
 * Prescription validation
 */
export const validatePrescription = (prescription, patientProfile = null) => {
  const errors = [];

  // Mandatory fields
  if (!prescription.patient_name) errors.push('Patient name is required');
  if (!prescription.prescriber_name) errors.push('Prescriber name is required');
  if (!prescription.prescriber_license) errors.push('Prescriber license is required');
  if (!prescription.date) errors.push('Prescription date is required');
  if (!prescription.drug_name) errors.push('Drug name is required');
  if (!prescription.strength) errors.push('Drug strength is required');
  if (!prescription.quantity) errors.push('Quantity is required');
  if (!prescription.directions) errors.push('Directions are required');

  // Expiry check (6 months)
  if (prescription.date) {
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    if (new Date(prescription.date) < sixMonthsAgo) {
      errors.push('Prescription has expired (older than 6 months)');
    }
  }

  // Drug interaction check
  if (patientProfile && patientProfile.current_medications) {
    const interactions = checkDrugInteractions(prescription.drug_name, patientProfile.current_medications);
    if (interactions.length > 0) {
      errors.push(`Drug interactions detected: ${interactions.join(', ')}`);
    }
  }

  // Allergy check
  if (patientProfile && patientProfile.allergies) {
    if (patientProfile.allergies.includes(prescription.drug_name)) {
      errors.push('Patient has documented allergy to this drug');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('; '), 'INVALID_PRESCRIPTION', { errors });
  }

  return true;
};

/**
 * GRN (Goods Received Note) validation
 */
export const validateGRN = (grn, purchaseOrder = null) => {
  const errors = [];

  // Mandatory fields
  if (!grn.po_id) errors.push('Purchase Order ID is required');
  if (!grn.quantity) errors.push('Quantity is required');
  if (!grn.batch_number) errors.push('Batch number is required');
  if (!grn.expiry_date) errors.push('Expiry date is required');

  // Tolerance check (10%)
  if (purchaseOrder && grn.quantity) {
    const tolerance = purchaseOrder.quantity * 0.1;
    const variance = Math.abs(grn.quantity - purchaseOrder.quantity);
    if (variance > tolerance) {
      errors.push(`Quantity variance exceeds tolerance. Expected: ${purchaseOrder.quantity}, Received: ${grn.quantity}`);
    }
  }

  // Expiry date validation
  if (grn.expiry_date) {
    const expiryDate = new Date(grn.expiry_date);
    const today = new Date();
    if (expiryDate < today) {
      errors.push('Batch has already expired');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('; '), 'INVALID_GRN', { errors });
  }

  return true;
};

/**
 * Payment validation
 */
export const validatePayment = (payment, sale = null) => {
  const errors = [];

  // Mandatory fields
  if (!payment.amount || payment.amount <= 0) errors.push('Payment amount must be greater than 0');
  if (!payment.method) errors.push('Payment method is required');

  // Valid payment methods
  const validMethods = ['cash', 'mpesa', 'card', 'insurance', 'split'];
  if (payment.method && !validMethods.includes(payment.method)) {
    errors.push(`Invalid payment method. Valid methods: ${validMethods.join(', ')}`);
  }

  // Amount validation
  if (sale && payment.amount > sale.total_amount) {
    errors.push(`Payment amount (${payment.amount}) exceeds sale total (${sale.total_amount})`);
  }

  // M-Pesa specific validation
  if (payment.method === 'mpesa') {
    if (!payment.phone || !payment.phone.match(/^254\d{9}$/)) {
      errors.push('Invalid M-Pesa phone number (format: 254XXXXXXXXX)');
    }
  }

  // Card specific validation
  if (payment.method === 'card') {
    if (!payment.card_number || payment.card_number.length < 13) {
      errors.push('Invalid card number');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('; '), 'INVALID_PAYMENT', { errors });
  }

  return true;
};

/**
 * Credit account validation
 */
export const validateCredit = (creditAccount, sale = null) => {
  const errors = [];

  // Mandatory fields
  if (!creditAccount.customer_id) errors.push('Customer ID is required');
  if (!creditAccount.limit || creditAccount.limit <= 0) errors.push('Credit limit must be greater than 0');

  // Credit limit check
  if (sale) {
    const newBalance = (creditAccount.balance || 0) + sale.total_amount;
    if (newBalance > creditAccount.limit) {
      errors.push(`Credit limit exceeded. Current: ${creditAccount.balance}, Limit: ${creditAccount.limit}, Sale: ${sale.total_amount}`);
    }
  }

  // Account status check
  if (creditAccount.status && creditAccount.status === 'suspended') {
    errors.push('Credit account is suspended');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('; '), 'INVALID_CREDIT', { errors });
  }

  return true;
};

/**
 * Transfer request validation
 */
export const validateTransfer = (transfer) => {
  const errors = [];

  // Mandatory fields
  if (!transfer.source_branch_id) errors.push('Source branch is required');
  if (!transfer.destination_branch_id) errors.push('Destination branch is required');
  if (!transfer.items || transfer.items.length === 0) errors.push('At least one item is required');

  // Branch validation
  if (transfer.source_branch_id === transfer.destination_branch_id) {
    errors.push('Source and destination branches cannot be the same');
  }

  // Items validation
  if (transfer.items) {
    transfer.items.forEach((item, idx) => {
      if (!item.drug_id) errors.push(`Item ${idx + 1}: Drug ID is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${idx + 1}: Quantity must be greater than 0`);
      if (!item.batch_id) errors.push(`Item ${idx + 1}: Batch ID is required`);
    });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('; '), 'INVALID_TRANSFER', { errors });
  }

  return true;
};

/**
 * Insurance claim validation
 */
export const validateInsuranceClaim = (claim) => {
  const errors = [];

  // Mandatory fields
  if (!claim.member_id) errors.push('Member ID is required');
  if (!claim.scheme_id) errors.push('Insurance scheme is required');
  if (!claim.sale_id) errors.push('Sale ID is required');
  if (!claim.amount || claim.amount <= 0) errors.push('Claim amount must be greater than 0');

  // Date validation
  if (claim.claim_date) {
    const claimDate = new Date(claim.claim_date);
    const today = new Date();
    if (claimDate > today) {
      errors.push('Claim date cannot be in the future');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('; '), 'INVALID_CLAIM', { errors });
  }

  return true;
};

/**
 * Helper: Check drug interactions
 */
const checkDrugInteractions = (newDrug, currentMedications) => {
  const interactionMap = {
    'Ibuprofen': ['Aspirin', 'Warfarin'],
    'Metformin': ['Alcohol', 'Contrast dye'],
    'Warfarin': ['Aspirin', 'NSAIDs'],
    'Lisinopril': ['Potassium supplements'],
  };

  const interactions = interactionMap[newDrug] || [];
  return interactions.filter(med => currentMedications.includes(med));
};

/**
 * Validators object - export all validators
 */
export const validators = {
  prescription: validatePrescription,
  grn: validateGRN,
  payment: validatePayment,
  credit: validateCredit,
  transfer: validateTransfer,
  claim: validateInsuranceClaim,
};

export default validators;

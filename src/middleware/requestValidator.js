/**
 * Request Validation Middleware
 * Validates incoming requests against defined schemas
 */

const { ValidationError } = require('../utils/errors');

/**
 * Validate sales request
 */
const validateSaleRequest = (req, res, next) => {
  const { customerId, items, paymentMethods } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Items array is required and must not be empty',
      requestId: req.id,
    });
  }

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Each item must have productId and positive quantity',
        requestId: req.id,
      });
    }
  }

  if (!paymentMethods || !Array.isArray(paymentMethods) || paymentMethods.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'At least one payment method is required',
      requestId: req.id,
    });
  }

  next();
};

/**
 * Validate GRN request
 */
const validateGRNRequest = (req, res, next) => {
  const { supplierId, items, invoiceNumber } = req.body;

  if (!supplierId) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Supplier ID is required',
      requestId: req.id,
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Items array is required',
      requestId: req.id,
    });
  }

  if (!invoiceNumber) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invoice number is required',
      requestId: req.id,
    });
  }

  next();
};

/**
 * Validate prescription request
 */
const validatePrescriptionRequest = (req, res, next) => {
  const { patientId, drugs, instructions } = req.body;

  if (!patientId) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Patient ID is required',
      requestId: req.id,
    });
  }

  if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Drugs array is required',
      requestId: req.id,
    });
  }

  next();
};

/**
 * Validate insurance claim request
 */
const validateClaimRequest = (req, res, next) => {
  const { patientId, claimAmount, insuranceProvider } = req.body;

  if (!patientId || !claimAmount || !insuranceProvider) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Patient ID, claim amount, and insurance provider are required',
      requestId: req.id,
    });
  }

  if (claimAmount <= 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Claim amount must be positive',
      requestId: req.id,
    });
  }

  next();
};

module.exports = {
  validateSaleRequest,
  validateGRNRequest,
  validatePrescriptionRequest,
  validateClaimRequest,
};

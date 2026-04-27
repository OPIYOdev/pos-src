const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errors');
const { authorizeRole } = require('../middleware/auth');

router.post('/', authorizeRole('cashier', 'pharmacist'), asyncHandler(async (req, res) => {
  res.status(201).json({ message: 'Customer created', customerId: 'CUST-001' });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ customerId: req.params.id, name: 'John Doe' });
}));

router.get('/', asyncHandler(async (req, res) => {
  res.json({ data: [], pagination: { page: 1, limit: 20, total: 0 } });
}));

router.post('/:id/credit-limit', authorizeRole('manager'), asyncHandler(async (req, res) => {
  res.json({ message: 'Credit limit updated', customerId: req.params.id });
}));

module.exports = router;

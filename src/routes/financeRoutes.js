const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errors');
const { authorizeRole } = require('../middleware/auth');

router.get('/reports', authorizeRole('accountant', 'manager'), asyncHandler(async (req, res) => {
  res.json({ reports: [] });
}));

router.get('/reconciliation', authorizeRole('accountant'), asyncHandler(async (req, res) => {
  res.json({ reconciliations: [] });
}));

router.post('/reconciliation', authorizeRole('accountant'), asyncHandler(async (req, res) => {
  res.status(201).json({ message: 'Reconciliation created', reconciliationId: 'REC-001' });
}));

module.exports = router;

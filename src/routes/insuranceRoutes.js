const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errors');
const { authorizeRole } = require('../middleware/auth');

router.post('/claims', authorizeRole('claims_officer'), asyncHandler(async (req, res) => {
  res.status(201).json({ message: 'Claim created', claimId: 'CLM-001' });
}));

router.get('/claims/:id', asyncHandler(async (req, res) => {
  res.json({ claimId: req.params.id, status: 'pending' });
}));

router.get('/claims', asyncHandler(async (req, res) => {
  res.json({ data: [], pagination: { page: 1, limit: 20, total: 0 } });
}));

router.post('/claims/:id/approve', authorizeRole('claims_officer'), asyncHandler(async (req, res) => {
  res.json({ message: 'Claim approved', claimId: req.params.id });
}));

module.exports = router;

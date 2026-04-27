const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errors');
const { authorizeRole } = require('../middleware/auth');

router.post('/', authorizeRole('pharmacist', 'dispenser'), asyncHandler(async (req, res) => {
  const { patientId, drugs, instructions } = req.body;
  res.status(201).json({ message: 'Prescription created', prescriptionId: 'RX-001' });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ prescriptionId: req.params.id, status: 'active' });
}));

router.get('/', asyncHandler(async (req, res) => {
  res.json({ data: [], pagination: { page: 1, limit: 20, total: 0 } });
}));

router.post('/:id/dispense', authorizeRole('dispenser'), asyncHandler(async (req, res) => {
  res.json({ message: 'Prescription dispensed', dispensedAt: new Date() });
}));

module.exports = router;

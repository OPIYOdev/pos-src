/**
 * Transfer API Routes
 * Base path: /api/transfers
 *
 * POST   /requests              — Create a new transfer request
 * POST   /requests/:id/approve  — Approve a transfer request
 * POST   /requests/:id/reject   — Reject a transfer request
 * GET    /orders                — List all transfer orders
 * POST   /orders/:id/dispatch   — Dispatch a transfer order
 * POST   /orders/:id/receive    — Mark order as received
 * POST   /orders/:id/verify     — Verify and complete an order
 * POST   /auto-check            — Trigger auto-reallocation check
 * POST   /settlements           — Generate monthly inter-branch settlement
 */

'use strict';

const express                = require('express');
const router                 = express.Router();
const TransferRequestManager = require('./TransferRequestManager');
const TransferOrderProcessor = require('./TransferOrderProcessor');
const AutoReallocationEngine = require('./AutoReallocationEngine');
const TransferCostAllocator  = require('./TransferCostAllocator');
const InterBranchSettlement  = require('./InterBranchSettlement');
const TransferAlertSystem    = require('./TransferAlertSystem');

const requestManager = new TransferRequestManager();
const orderProcessor = new TransferOrderProcessor();
const autoEngine     = new AutoReallocationEngine();
const costAllocator  = new TransferCostAllocator();
const settlement     = new InterBranchSettlement();
const alertSystem    = new TransferAlertSystem();

// ── Transfer Requests ─────────────────────────────────────────────────────────

router.post('/requests', async (req, res, next) => {
  try {
    const result = await requestManager.createTransferRequest(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

router.post('/requests/:id/approve', async (req, res, next) => {
  try {
    const result = await requestManager.approveTransferRequest(req.params.id, req.body.approver_id);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/requests/:id/reject', async (req, res, next) => {
  try {
    const db = require('../db');
    const request = await db.TransferRequest.findOne({ where: { request_id: req.params.id } });
    if (!request) return res.status(404).json({ error: 'Transfer request not found' });
    request.status = 'REJECTED';
    request.rejection_reason = req.body.reason || 'Rejected by manager';
    await request.save();
    res.json(request);
  } catch (err) { next(err); }
});

// ── Transfer Orders ───────────────────────────────────────────────────────────

router.get('/orders', async (req, res, next) => {
  try {
    const db = require('../db');
    const orders = await db.TransferOrder.findAll({
      include: [
        { model: db.Branch, as: 'sourceBranch' },
        { model: db.Branch, as: 'destinationBranch' }
      ],
      order: [['created_at', 'DESC']],
      limit: 100
    });
    res.json(orders);
  } catch (err) { next(err); }
});

router.post('/orders/:id/dispatch', async (req, res, next) => {
  try {
    const result = await orderProcessor.dispatchTransferOrder(req.params.id, req.body);
    await alertSystem.sendTransferAlert(req.params.id, 'REQUEST_CREATED', {});
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/orders/:id/receive', async (req, res, next) => {
  try {
    const result = await orderProcessor.receiveTransferOrder(req.params.id, req.body.received_by);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/orders/:id/verify', async (req, res, next) => {
  try {
    const result = await orderProcessor.verifyAndCompleteTransfer(req.params.id, req.body);
    if (result.status === 'COMPLETED') {
      await costAllocator.allocateTransferCosts(req.params.id);
    } else {
      await alertSystem.sendTransferAlert(req.params.id, 'DISCREPANCY', result.discrepancies);
    }
    res.json(result);
  } catch (err) { next(err); }
});

// ── Auto-Reallocation ─────────────────────────────────────────────────────────

router.post('/auto-check', async (req, res, next) => {
  try {
    await autoEngine.runReallocationCheck();
    res.json({ message: 'Auto-reallocation check completed.' });
  } catch (err) { next(err); }
});

// ── Inter-Branch Settlement ───────────────────────────────────────────────────

router.post('/settlements', async (req, res, next) => {
  try {
    const { branch_id, month, year } = req.body;
    const result = await settlement.generateMonthlySettlement(branch_id, month, year);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;

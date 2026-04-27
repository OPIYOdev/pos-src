# 12. Multi-Branch Product Reallocation Module

> **Procedure Manual v1.0** | Module: MB-TRANS / MB-AUTO / MB-COST / MB-BILL / MB-DISP / MB-ALERT / MB-RECON / MB-REPORT

---

## Overview

Multi-branch product reallocation enables inventory transfer between pharmacy branches to optimise stock levels, prevent expiry, and fulfil customer demand across locations. The module integrates with the base Pharmacy POS System and operates alongside existing sales, inventory, and financial workflows.

---

## ER Diagram

```
[branch] ---1---*--- [inventory_batches]
[branch] ---1---*--- [transfer_requests]  (as source)
[branch] ---1---*--- [transfer_requests]  (as destination)
[branch] ---1---*--- [transfer_orders]    (as source)
[branch] ---1---*--- [transfer_orders]    (as destination)
[transfer_requests] ---1---1--- [transfer_orders]
[transfer_orders]   ---1---*--- [transfer_order_items]
[transfer_order_items] ---*---1--- [inventory_batches]
[users] ---1---*--- [transfer_orders]     (as requester)
[users] ---1---*--- [transfer_orders]     (as approver)
```

---

## Section 1 — Transfer Workflows

### 1.1 Stock Transfer Request Workflow (MB-TRANS-001)

| Step | Action | Responsibility | System Response | Time Limit |
|------|--------|----------------|-----------------|------------|
| 1 | Identify stock need | Branch Pharmacist | Check availability at other branches | 5 min |
| 2 | Create transfer request | Inventory Manager | Generate request ID (TR-YYYYMMDD-XXXX) | 2 min |
| 3 | Specify items & quantities | Inventory Manager | Validate stock availability at source | 1 min/item |
| 4 | Set priority level | Inventory Manager | Flag: URGENT / NORMAL / LOW | 30 sec |
| 5 | Submit for approval | Inventory Manager | Notify destination branch manager | 10 sec |
| 6 | Review request | Destination Manager | Display item details, cost impact | 5 min |
| 7 | Approve / Reject / Modify | Destination Manager | Update request status | 2 min |
| 8 | Route to source branch | System | Assign to source inventory manager | 5 sec |

**Transfer Request States:**
```
DRAFT → PENDING_APPROVAL → APPROVED → PROCESSING → IN_TRANSIT → RECEIVED → COMPLETED
                                  ↓
                            REJECTED → CANCELLED
```

**Source file:** `src/reallocation/TransferRequestManager.js`

---

### 1.2 Transfer Order Processing (MB-TRANS-002)

**Transfer Order States:**

| State | Description |
|-------|-------------|
| CREATED | Order initialised from approved request |
| PICKING | Source branch picking stock |
| PICKED | Items picked and packed |
| DISPATCHED | Goods leave source branch |
| IN_TRANSIT | En route to destination |
| RECEIVED | Arrived at destination branch |
| VERIFYING | Destination verifying items |
| COMPLETED | Fully received and reconciled |
| CANCELLED | Order cancelled |
| DISPUTED | Quantity/quality discrepancy |

| Step | Action | Responsible | SLA |
|------|--------|-------------|-----|
| 1 | Convert request to order | System auto | 1 min |
| 2 | Assign picking list | Source Inventory Manager | 5 min |
| 3 | Pick items from batches (FEFO) | Warehouse Staff | 30 min |
| 4 | Pack and label | Warehouse Staff | 15 min |
| 5 | Quality check | Source Pharmacist | 10 min |
| 6 | Dispatch goods | Source Manager | 5 min |
| 7 | Generate waybill | System | 2 min |
| 8 | Update transit tracking | System | 1 min |
| 9 | Receive at destination | Destination Manager | Upon arrival |
| 10 | Verify against manifest | Destination Staff | 20 min |
| 11 | Accept / Dispute | Destination Pharmacist | 15 min |
| 12 | Complete order | System | 5 min |

**Source file:** `src/reallocation/TransferOrderProcessor.js`

---

## Section 2 — Inventory Reconciliation (MB-RECON-001)

Post-transfer reconciliation is handled by the `ReconcileTransferStock` stored procedure in `sql/transfer_schema.sql` and the `verifyAndCompleteTransfer` method in `TransferOrderProcessor.js`.

The cross-branch stock visibility view `v_cross_branch_stock` provides a real-time snapshot of available, reserved, and expiring stock across all active branches.

---

## Section 3 — Transfer Rules & Limits

### 3.1 Transfer Authorization Matrix

| Transfer Value | Requires Approval | Authorization Level | Documentation |
|----------------|-------------------|---------------------|---------------|
| < KES 50,000 | Branch Manager only | Single signature | Transfer request form |
| KES 50,000 – 250,000 | Regional Manager | Dual signature | Transfer order + Regional approval |
| KES 250,000 – 1,000,000 | Operations Director | Triple signature | Board notification copy |
| > KES 1,000,000 | GM + Finance Director | Full board notification | Board minutes reference |
| Emergency transfers | Any amount | GM override + written explanation | Emergency authorization form |

### 3.2 Transfer Limits by Drug Category

| Drug Category | Max Qty/Transfer | Max Value (KES) | Pharmacist Approval |
|---------------|-----------------|-----------------|---------------------|
| Standard OTC | 1,000 | 500,000 | Yes |
| Prescription Only | 500 | 750,000 | Yes |
| Controlled Substances | 100 | 250,000 | Yes |
| Cold Chain | 200 | 500,000 | Yes |
| High Value (>10k/unit) | 50 | 500,000 | Yes |

**SQL table:** `transfer_limits` in `sql/transfer_schema.sql`

---

## Section 4 — Notification & Alert System (MB-ALERT-001)

| Event | Severity | Recipients | Channels | Timing |
|-------|----------|------------|----------|--------|
| Transfer request created | INFO | Destination Manager, Source Manager | In-app, Email | Immediate |
| Request approved | INFO | Requester, Source Manager | In-app, SMS | Immediate |
| Request rejected | WARNING | Requester | In-app, Email | Immediate |
| Picking delay >2 hours | ESCALATION | Source Supervisor | SMS, Push | At threshold |
| Dispatch confirmation | INFO | Destination Manager, Requester | Email, SMS | At dispatch |
| In transit update | INFO | Destination Manager | SMS (tracking link) | Every 2 hours |
| Estimated arrival in 1 hour | URGENT | Destination Manager, Receiving Staff | SMS, In-app | 1 hour before |
| Receiving discrepancy | CRITICAL | Both Branch Managers, Inventory Director | Email, SMS, In-app | Immediate |
| Transfer not received by EOD | ESCALATION | Regional Manager | Email | End of day |

**Source file:** `src/reallocation/TransferAlertSystem.js`

---

## Section 5 — Auto-Reallocation Logic (MB-AUTO-001)

The `AutoReallocationEngine` runs every 6 hours (via `src/jobs/scheduler.js`) and:

1. Identifies branches with more than 90 days of stock on hand for any drug.
2. Finds other branches where the same drug has fewer than 30 days of stock.
3. Calculates an optimal transfer quantity targeting 45 days of stock at the destination, capped at 50 % of the source excess.
4. Creates an `AUTO_GENERATED` transfer request; requests under KES 50,000 are auto-approved.

**Source file:** `src/reallocation/AutoReallocationEngine.js`

---

## Section 6 — Transfer Cost Accounting (MB-COST-001)

| Cost Type | Rate | Allocation |
|-----------|------|------------|
| Transport | KES 50/km × volume | Destination branch |
| Handling | 2 % of transfer value | Source branch |
| Insurance | 0.5 % of transfer value | Split 50/50 |

Allocation varies by transfer reason: emergency transfers are fully borne by the requesting branch; stock-balancing transfers are split 50/50.

**Source file:** `src/reallocation/TransferCostAllocator.js`  
**SQL table:** `transfer_costs` in `sql/transfer_schema.sql`

---

## Section 7 — Transfer Reports & Dashboards (MB-REPORT-001)

| Report | SQL View / Query |
|--------|-----------------|
| Transfer velocity (30 days) | `v_transfer_velocity` |
| Cross-branch stock snapshot | `v_cross_branch_stock` |
| Discrepancy report | Query on `transfer_reconciliation` |
| Branch optimisation score | Composite query in `sql/transfer_schema.sql` |

---

## Section 8 — Transfer Roles & Responsibilities

| Role | Transfer Authority | Key Responsibilities |
|------|-------------------|---------------------|
| Branch Pharmacist | Create requests, verify receipts | Identify stock needs, check product condition |
| Inventory Manager | Approve <50k, process orders | Initiate transfers, pick stock, create packing lists |
| Branch Manager | Approve 50k–250k | Review requests, approve/reject, sign off transfers |
| Regional Manager | Approve 250k–1M, resolve disputes | Oversee inter-branch transfers, handle escalation |
| Quality Assurance | Verify cold chain, controlled substances | Inspect special category transfers |
| Accountant | Cost allocation, inter-branch billing | Process transfer costs, generate invoices |
| Logistics Coordinator | Schedule transport, track shipments | Arrange pickup, monitor transit |
| GM | Approve >1M, policy decisions | Strategic transfer approval |

---

## Section 9 — Transfer SLA & Escalation

| Transfer Stage | SLA | Escalation Threshold | Escalation Path |
|----------------|-----|---------------------|-----------------|
| Request creation | 5 min | 30 min | Inventory Manager → Branch Manager |
| Request approval | 2 hours | 4 hours | Branch Manager → Regional Manager |
| Picking | 4 hours | 8 hours | Warehouse → Inventory Manager → Branch Manager |
| Quality check | 1 hour | 2 hours | Pharmacist → Branch Manager |
| Dispatch | 2 hours | 4 hours | Source Manager → Regional Logistics |
| Transit (local) | 4 hours | 6 hours | Logistics → Regional Manager |
| Transit (regional) | 24 hours | 36 hours | Logistics → Operations Director |
| Receiving verification | 2 hours | 4 hours | Destination Manager → Regional Manager |
| Discrepancy resolution | 48 hours | 72 hours | Both Managers → GM |

---

## Section 10 — Quick-Guide Cards

### Inventory Manager Transfer Card

```
=== INITIATE TRANSFER ===
1. CHECK STOCK: Search drug → View all branches
2. CREATE REQUEST: Source → Destination → Items
3. PRIORITY: URGENT (24hr) / NORMAL (3d) / LOW (7d)
4. SUBMIT → WAIT APPROVAL

=== PROCESS TRANSFER ===
1. APPROVED REQUEST → CREATE ORDER
2. GENERATE PICK SLIP
3. SELECT BATCHES (FEFO)
4. PACK & LABEL
5. QUALITY CHECK
6. DISPATCH → UPDATE SYSTEM
7. PRINT WAYBILL

=== RECEIVE TRANSFER ===
1. ARRIVAL NOTIFICATION → RECEIVE
2. COUNT AGAINST MANIFEST
3. CHECK CONDITION
4. REPORT DISCREPANCIES (if any)
5. ACCEPT → UPDATE STOCK
6. COMPLETE ORDER
```

### Pharmacist Transfer Card

```
=== BEFORE TRANSFER ===
✓ Verify expiry dates >90 days
✓ Check cold chain requirements
✓ Document controlled substances
✓ Sign quality checklist

=== ON RECEIPT ===
✓ Inspect packaging integrity
✓ Verify temperature logs (cold chain)
✓ Count controlled substances (2-person)
✓ Report damage within 2 hours
✓ Update batch records
```

### Branch Manager Transfer Card

```
=== APPROVAL MATRIX ===
<50k:    Your approval only
50k-250k: + Regional Manager
>250k:   + Operations Director
EMERGENCY: GM override

=== DISCREPANCY HANDLING ===
1. DOCUMENT: Photos, counts, condition
2. NOTIFY: Source branch within 2 hours
3. DECIDE: Accept partial / Reject / Return
4. RESOLVE: Within 48 hours
5. ADJUST: Inventory / Credit note
```

---

## Section 11 — Transfer Discrepancy Resolution (MB-DISP-001)

| Discrepancy Type | Resolution | Time Limit |
|-----------------|------------|------------|
| Quantity Shortage | Source branch credits destination (unit cost × missing qty) | 24 hours |
| Quantity Excess | Destination returns excess OR purchases at 10 % discount | 48 hours |
| Damaged Goods | Quarantine; source or transporter liable; joint write-off approval | 24 hours |
| Expired / Short-dated (<30 days) | Reject entire batch | Immediate |
| Expired / Short-dated (30–90 days) | Negotiate 30–50 % discount | 48 hours |
| Wrong Product | Do not accept; return to source at source's cost | 48 hours |

**SQL table:** `transfer_disputes` in `sql/transfer_schema.sql`

---

## Section 12 — Inter-Branch Billing & Settlement (MB-BILL-001)

Monthly settlements are generated by `InterBranchSettlement.generateMonthlySettlement(branchId, month, year)`, which calculates the net value of stock sent versus received and records the result in `inter_branch_settlements`.

**Source file:** `src/reallocation/InterBranchSettlement.js`

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transfers/requests` | Create transfer request |
| POST | `/api/transfers/requests/:id/approve` | Approve request |
| POST | `/api/transfers/requests/:id/reject` | Reject request |
| GET | `/api/transfers/orders` | List transfer orders |
| POST | `/api/transfers/orders/:id/dispatch` | Dispatch order |
| POST | `/api/transfers/orders/:id/receive` | Mark as received |
| POST | `/api/transfers/orders/:id/verify` | Verify and complete |
| POST | `/api/transfers/auto-check` | Trigger auto-reallocation |
| POST | `/api/transfers/settlements` | Generate monthly settlement |

---

*All staff involved in multi-branch operations must complete training on these procedures before executing any transfers.*

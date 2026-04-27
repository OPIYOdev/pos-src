# 🔄 PHARMACY POS SYSTEM — MASTER WORKFLOW

> **Procedure Manual v1.0** | One-sprint operational overview  
> All workflows are strictly sourced from the approved procedures document.

---

## TABLE OF CONTENTS

1. [Sales & Billing Workflows](#1-sales--billing-workflows)
2. [Inventory Management Workflows](#2-inventory-management-workflows)
3. [Prescription Management Workflows](#3-prescription-management-workflows)
4. [Customer Management Workflows](#4-customer-management-workflows)
5. [Insurance & SHA/NHIF Workflows](#5-insurance--shanhif-workflows)
6. [Financial & Accounting Workflows](#6-financial--accounting-workflows)
7. [Reporting Schedules](#7-reporting-schedules)
8. [System Maintenance Protocols](#8-system-maintenance-protocols)
9. [Compliance & Audit Preparation](#9-compliance--audit-preparation)
10. [Roles & Responsibilities Matrix](#10-roles--responsibilities-matrix)
11. [Standard Response Times](#11-standard-response-times)

---

## 1. Sales & Billing Workflows

### ER Diagram
```
[sale] ---1---*--- [sale_item] ---*---1--- [product]
[sale] ---1---1--- [payment]
[sale] ---*---1--- [customer]
```

### POS-STD-001 — Cash Sale

| Step | Action | Responsibility | System Response | Time Limit |
|------|--------|---------------|-----------------|------------|
| 1 | Initiate transaction | Cashier | Generate sale session ID | 5 sec |
| 2 | Add items (scan/manual) | Cashier | Display item details, price, stock remaining | 2 sec/item |
| 3 | Apply discount (if any) | Pharmacist | Log discount reason, require approval if >10% | 10 sec |
| 4 | Calculate totals | System | Display breakdown | 1 sec |
| 5 | Process payment | Cashier | Open cash drawer | 30 sec |
| 6 | Generate KRA-compliant receipt | System | Send to printer + SMS/email | 5 sec |
| 7 | Update inventory | System | Reduce stock, log batch usage | 2 sec |
| 8 | Close transaction | Cashier | Save to database, print customer copy | 10 sec |

---

### POS-STD-002 — Multi-tender / Split Payment

**Supported tender types:** Cash · M-Pesa (STK Push) · Card · Insurance

```
START
  │
  ▼
balanceRemaining = sale.totalAmount
  │
  ▼
┌─────────────────────────────────────┐
│  Select tender type for remainder   │◄──────────────────┐
└─────────────────────────────────────┘                   │
  │                                                       │
  ├─── Insurance ──► verifyInsuranceCover() ──► deduct    │
  ├─── M-Pesa    ──► initiateSTKPush()      ──► balance=0 │
  └─── Cash      ──► prompt amount          ──► deduct    │
                                                 │        │
                                         balanceRemaining>0?──YES──►┘
                                                 │
                                                NO
                                                 │
                                                 ▼
                                  generateConsolidatedReceipt()
                                                 │
                                               END
```

---

### POS-PRS-001 — Prescription Filling

| Step | Action | Validation | Escalation |
|------|--------|-----------|------------|
| 1 | Receive prescription | Check prescriber signature, date, patient name | Reject if >6 months old |
| 2 | Verify patient identity | Match ID number with system | Create new patient profile if new |
| 3 | Check prescription-type drugs | Flag POM for pharmacist verification | Pharmacist override required |
| 4 | Dispense medication | Select batch (FEFO), calculate quantity | Partial dispensing allowed |
| 5 | Apply dispensing label | Print patient name, drug name, dosage, expiry | Pharmacist initials required |
| 6 | Cashier processes payment | Follow POS-STD-001 | Supervisor override for credit |
| 7 | Log to controlled register | For narcotics/psychotropics | Daily PPB report generation |
| 8 | Pharmacist final check | Verify correct drug, dose, patient | Document any discrepancy |

#### Partial Dispensing Decision Logic
```
IF stock_available < prescribed_quantity
  ├── Dispense available quantity → INSERT dispensing_record
  ├── Create backorder (expires in 30 days)
  └── SMS patient: "Your order is partially ready. Balance: X units"
END IF
```

---

## 2. Inventory Management Workflows

### ER Diagram
```
[purchase_order] ---1---*--- [grn] ---1---*--- [grn_item] ---*---1--- [batch]
[supplier]       ---1---*--- [purchase_order]
[batch]          ---*---1--- [product]
```

### INV-GRN-001 — Goods Received Note (GRN)

| Field | Validation Rule | Action on Failure |
|-------|----------------|-------------------|
| Batch number | Unique, alphanumeric, 8–12 chars | Reject, request correction |
| Expiry date | ≥6 months from today (standard drugs) | Flag as "short-dated", require discount |
| Quantity received | ≤ PO quantity + 10% tolerance | Auto-approval ≤10%; manager approval >10% |
| Cost price | Within KRA fair market value ±15% | Flag for tax review |
| VAT status | Verify exempt vs taxable classification | Auto-recalculate on correction |

#### GRN Processing Flow
```
Receive GRN Data
      │
      ▼
qty > PO * 1.1? ──YES──► THROW: "Manager approval required"
      │
     NO
      │
      ▼
Generate batches (batch_number, expiry, cost, selling_price, QR code)
      │
      ▼
bulkCreate inventory_batches
      │
      ▼
Increment product stock_quantity for each batch
      │
      ▼
Create GRN record (status: COMPLETED)
      │
      ▼
Return { grn, batches }
```

---

### INV-FEFO-001 — First Expired First Out (FEFO)

> Inventory is **always** dispensed in order of earliest expiry date.

```sql
-- GetFEFOBatch stored procedure
SELECT batch_number, expiry_date, quantity_available, selling_price
FROM   inventory_batches
WHERE  drug_id          = p_drug_id
AND    quantity_available >= p_quantity
AND    expiry_date      >= CURDATE()
AND    is_quarantined   = 0
ORDER BY expiry_date ASC
LIMIT 1;
```

#### Expiry Alert Matrix

| Days to Expiry | Alert Level | Action Required | Notify |
|----------------|-------------|-----------------|--------|
| >180 days | 🟢 Green | No action | — |
| 90–180 days | 🟡 Yellow | Review slow movers | Inventory Manager |
| 30–89 days | 🟠 Orange | Markdown price, contact supplier for return | Store Manager + Pharmacist |
| <30 days | 🔴 Red | Remove from dispensary, quarantine, prepare disposal | GM + PPB Compliance Officer |
| Expired | ⚫ Black | Quarantine, document, dispose per protocol | PPB, KRA (write-off) |

---

### INV-CONT-001 — Narcotic / Psychotropic Handling

#### Daily Controlled Substances Schedule

| Time | Activity |
|------|----------|
| 06:00 | Receive from armored transport (2-person verification) |
| 08:00 | Pharmacist opens safe, verifies seal numbers |
| 09:00 | Log opening count in CS Register |
| 12:00 | Mid-day count (barcode-scanned system) |
| 17:00 | End-of-day count by **two** pharmacists |
| 18:00 | Secure in safe, record closing balance |

#### Dispensing Protocol (Mandatory)
- Prescriber must have valid **narcotic license number**
- Patient must present valid **ID** (record number + issuing authority)
- CS Register entry: date/time · patient name & ID · prescriber name & license · drug/strength/quantity/batch · dispensing pharmacist signature · **witness pharmacist counter-sign**
- Generate **PPB-compliant daily report**
- Store records for **minimum 7 years**

---

## 3. Prescription Management Workflows

### ER Diagram
```
[prescription] ---1---*--- [prescription_item] ---*---1--- [drug]
[prescription] ---*---1--- [patient]
[prescription] ---*---1--- [prescriber]
[prescription] ---1---1--- [dispensing_record]
```

### RX-VER-001 — Prescription Validation Checklist

#### Mandatory Elements *(Reject if ANY missing)*
- [ ] Patient full name & age/signature
- [ ] Prescriber name, signature, registration number
- [ ] Date of prescription (<6 months standard / <30 days controlled)
- [ ] Drug name (generic or brand)
- [ ] Strength & dosage form
- [ ] Quantity (in words **and** figures)
- [ ] Directions for use

#### Warning Flags *(Pharmacist review required)*
- **Drug-drug interaction** — system checks database
- **Drug-allergy** — matched against patient profile
- **Duplicate therapy** — same drug class from different prescriber
- **High-dose alert** — exceeds standard maximum
- **Off-label use** — non-approved indication

#### Validation Decision Flow
```
validatePrescription(prescription, patientProfile)
          │
          ├── Missing prescriber license? ──► ERROR, isValid = false
          │
          ├── Prescription >6 months old? ──► ERROR, isValid = false
          │
          ├── Drug-drug interactions?     ──► WARNING, pharmacistOverride = true
          │
          └── Patient allergy match?      ──► ERROR, isValid = false
                        │
                   return result { isValid, errors[], warnings[], pharmacistOverrideRequired }
```

---

### RX-REP-001 — Refill Management

| Refill | Action | Verification |
|--------|--------|-------------|
| 1st | Full verification | Original prescription or digital authorization |
| 2nd–5th | Reduced verification | Check remaining refills, patient ID only |
| 6th | Flag for review | Contact prescriber for renewal |
| Default | Auto-remind patient 7 days before due | SMS: "Your [drug] refill is ready" |
| Missed >14 days | Flag inactive | Require new prescription |

#### Chronic Disease Auto-Tagging
- Categories: Hypertension · Diabetes · Asthma · Epilepsy · HIV/AIDS · TB · Mental Health
- **Trigger:** prescription duration >90 days **OR** chronic medication category
- **Actions on trigger:**
  - Set `patient.chronic_disease_tag = true`
  - Schedule refill reminders (7-day lead)
  - Enroll in **Chronic Care Loyalty Tier**
  - Generate adherence plan

---

## 4. Customer Management Workflows

### ER Diagram
```
[customer] ---1---*--- [loyalty_points]
[customer] ---1---*--- [credit_account]
[customer] ---1---*--- [allergy_record]
[customer] ---1---*--- [chronic_condition]
[customer] ---1---*--- [visit_history]
```

### CUST-REG-001 — New Patient Enrollment

#### Minimum Required Data
- Full name (as per ID)
- National ID / Passport number
- Date of birth (for pediatric dosing calculation)
- Mobile number (SMS alerts)
- Residential area (delivery)

#### Workflow Steps
```
Present ID document
        │
        ▼
Scan / capture ID photo (store securely)
        │
        ▼
Enter data into system
        │
        ▼
Check for duplicate ID in customers table
        │
  Duplicate?──YES──► SIGNAL: "Patient with this ID already exists"
        │
       NO
        │
        ▼
Generate patient ID: PAT-{YYYY}-{000001}
        │
        ▼
INSERT into customers table
        │
        ▼
Queue welcome SMS: "Welcome! Your patient ID is PAT-YYYY-XXXXXX"
        │
        ▼
Print loyalty card (optional)
        │
  Credit account requested?──YES──► Attach credit limit & signed terms
        │
       END
```

---

### CUST-CREDIT-001 — Credit Workflow

| Step | Action | Limit | Authorization |
|------|--------|-------|---------------|
| 1 | Customer requests credit | N/A | Initial interview |
| 2 | Credit check (internal history) | Past 12 months | System auto-score |
| 3 | Set credit limit | KES 0–50,000 | Pharmacist |
| 4 | Set credit limit | KES 50,001–200,000 | Store Manager |
| 5 | Set credit limit | >KES 200,000 | GM + Deposit required |
| 6 | Issue credit terms | 30 days net | Signed agreement |
| 7 | Monitor utilization | Alert at 80% of limit | SMS to customer |
| 8 | Payment due | Invoice + monthly statement | Late fee: 5% after 30 days |
| 9 | Default handling | Suspend at 60 days overdue | Collection agency at 90 days |

#### Credit Sale Authorization Flow
```
processCreditSale(sale, customerId)
        │
  Credit account exists? ──NO──► ERROR: "No credit account"
        │
       YES
        │
        ▼
currentUtilization = balance + sale.total
        │
  > credit limit? ──YES──► ERROR: "Credit limit exceeded"
        │
       NO
        │
  ≥ 80% utilized? ──YES──► sendCreditAlert() via SMS
        │
        ▼
Create CreditTransaction (DEBIT, due in 30 days)
        │
        ▼
creditAccount.balance += sale.total  →  SAVE
        │
       END
```

**Late Fee Rule:** 5% of balance applied after 30 days overdue (automated daily job).

---

## 5. Insurance & SHA/NHIF Workflows

### ER Diagram
```
[insurance_scheme]  ---1---*--- [insurance_member]
[insurance_member]  ---1---*--- [insurance_claim]
[insurance_claim]   ---1---*--- [claim_item]
[sale]              ---1---1--- [insurance_claim]
```

### INS-CLM-001 — Real-time Claim Submission

#### Pre-authorization Matrix

| Drug Cost | Pre-auth Required | Turnaround | Escalation |
|-----------|-------------------|------------|------------|
| <KES 10,000 | No | Instant | — |
| KES 10,000–50,000 | Yes — pharmacist approval | 15 min | Store Manager |
| KES 50,001–200,000 | Yes — insurer approval | 2–4 hours | Clinical Pharmacist |
| >KES 200,000 | Full medical review | 24–48 hours | GM + Insurer Medical Officer |

#### Claim Processing Flow
```
processClaim(sale, insuranceMemberId)
        │
        ▼
checkEligibility(member)
  └── NOT eligible? ──► return { approved: false, reason }
        │
        ▼
checkBenefitLimits(member, sale.total)
  └── EXCEEDS limit? ──► return { approved: true, partialApproval: true,
                                   insuranceAmount: remainingLimit,
                                   patientAmount: difference }
        │
        ▼
sale.total > preAuthThreshold?
  └── YES ──► requestPreAuthorization()
               └── DENIED? ──► return { approved: false }
        │
        ▼
calculateCoPayment()
  ├── PERCENTAGE type: total × (coPayValue / 100)
  └── FIXED type:      min(coPayValue, total)
        │
        ▼
Create InsuranceClaim (status: SUBMITTED)
        │
        ▼
submitToInsurer(claim)
        │
        ▼
return { approved: true, insuranceAmount, patientAmount, claimReference }
```

---

### INS-REC-001 — Monthly Reconciliation

**Frequency:** Every 5th working day of month

**Steps:**
1. Extract all claims from previous month
2. Group by insurer scheme
3. Generate summary per scheme (submitted / value / paid / pending / rejected with codes)
4. Investigate rejections → correct coding errors or write off invalid claims
5. Generate statement of account per insurer
6. Follow up: unpaid claims >45 days → escalate >90 days to credit control
7. Adjust accounting system for reconciled amounts

---

## 6. Financial & Accounting Workflows

### FIN-CASH-001 — Daily Cash Reconciliation

| Time | Activity | Responsible | Documentation |
|------|----------|-------------|---------------|
| 08:00 | Float setup (KES 5,000 standard) | Cashier + Supervisor | Float form signed by both |
| 08:30 | First shift begins | Cashier | Log in with credentials |
| 12:00 | Mid-day count (high-volume optional) | Supervisor | Interim slip |
| 16:00 | Shift change count | Cashier Out + Cashier In | Handover form |
| 20:00 | End-of-day closure | Cashier + Manager | EOD report |
| 20:15 | Count cash by denomination | Two-person count | Cash count sheet |
| 20:30 | Compare system total vs physical | Cashier | Variance report |
| 20:45 | Investigate variance >KES 200 | Store Manager | Incident report |
| 21:00 | Prepare deposit | Manager | Bank deposit slip |
| 21:15 | Secure cash in safe | Manager | Safe log entry |

#### Variance Handling Matrix

| Variance | Status | Action |
|----------|--------|--------|
| ≤ KES 200 | LOG | Log and adjust in system |
| KES 201–1,000 | WARNING | Written warning + training |
| > KES 1,000 | INVESTIGATION | Formal investigation, possible termination |
| >3 variances in 30 days | RETRAINING | Mandatory retraining |

---

### FIN-ETIMS-001 — Real-time KRA Tax Compliance

#### eTIMS Invoice Flow
```
processTaxInvoice(sale)
        │
        ▼
Map items → { item_name, qty, unit_price, total,
               vat_rate: VAT_EXEMPT? 0 : 16%,
               vat_amount }
        │
        ▼
Build invoice:
  invoiceNumber  = INV{YYYYMMDD}{SEQ:6}
  supplierTIN    = P123456789Z
  invoiceType    = E1
  grandTotal     = subtotal + vatTotal
        │
        ▼
POST https://etims.kra.go.ke/api/v1/invoice  (3 retries, 10s timeout)
        │
  status=ACCEPTED? ──YES──► attachQRCode() → markSaleAsTaxCompliant()
        │
       NO (all retries exhausted)
        │
        ▼
queueTaxInvoice() → markForManualVerification()
return { success: false, queued: true }
```

---

## 7. Reporting Schedules

### Mandatory Report Generation

| Report Name | Frequency | Trigger | Required By | Format |
|-------------|-----------|---------|-------------|--------|
| Daily Sales Summary | Daily | EOD close | Store Manager | PDF + Excel |
| Cash Reconciliation | Daily | After count | Accountant | Signed hard copy |
| Controlled Substances Log | Daily | End of shift | PPB | Bound register + digital |
| Expiry Report | Weekly | Every Monday | Pharmacist | PDF |
| Stock Valuation | Weekly | Every Friday | Inventory Manager | Excel |
| Insurance Claims Summary | Bi-weekly | 1st & 15th | Claims Officer | Excel + CSV |
| Monthly P&L | Monthly | 1st of month | GM + Accountant | PDF (audit-ready) |
| PPB Compliance Report | Monthly | 5th of month | PPB | Prescribed format |
| KRA VAT Report | Monthly | 20th of month | KRA | eTIMS export |
| Slow Movers Report | Monthly | Last day | Purchasing Manager | Excel |

---

### Alert & Escalation Matrix

#### Critical Alerts (Immediate action required)

| Event | Alert | Escalation 1 | Escalation 2 |
|-------|-------|-------------|-------------|
| Stock below reorder level | In-system popup + email → Inventory Manager | 12 hrs: Store Manager | 24 hrs: GM |
| Expiry <30 days | Daily email + dashboard highlight | 7 days no action: Quarantine order | — |
| System offline >5 min | SMS → IT Support | 15 min: Regional Manager | 30 min: Emergency backup |
| Failed eTIMS >10 invoices | Real-time flag → Finance | 2 hrs: Compliance Officer | EOD: KRA liaison |

#### Security Alerts

| Event | Action |
|-------|--------|
| >5 failed login attempts | Lock account 15 min · SMS to user + Admin · Log for audit |
| After-hours access (outside 06:00–22:00) | Require manager override · Log reason · Daily report to GM |

---

## 8. System Maintenance Protocols

### Maintenance Schedule

#### Daily (EOD after closure)
- [ ] Verify all transactions synced (if offline mode used)
- [ ] Run database integrity check
- [ ] Backup transaction logs locally
- [ ] Clear temporary cache files
- [ ] Generate daily operational report

#### Weekly (Every Sunday 02:00)
- [ ] Full database backup to cloud (AWS S3)
- [ ] Rotate logs (keep 30 days)
- [ ] Update drug interaction database
- [ ] Re-index database tables
- [ ] Test restore from backup (random sample)

#### Monthly (1st of month 01:00)
- [ ] Archive transactions >12 months to cold storage
- [ ] Purge expired patient tokens/sessions
- [ ] Update KRA tax rates if changed
- [ ] Review system performance metrics
- [ ] Generate audit trail report for all users
- [ ] Rotate API keys (M-Pesa, eTIMS, SMS gateway)

---

### SYS-DR-001 — Disaster Recovery Matrix

| Incident | RTO | RPO | Recovery Steps |
|----------|-----|-----|----------------|
| Internet outage | 5 min | 0 min | 1. Switch to offline mode queue 2. Enable local backup connection 3. Resume with sync pending |
| Local server crash | 30 min | 15 min | 1. Switch to hot standby 2. Restore last backup 3. Resume operations |
| Database corruption | 2 hours | 1 hour | 1. Restore from last good backup 2. Apply transaction logs 3. Verify integrity 4. Resume |
| Complete system failure | 4 hours | 1 hour | 1. Deploy from backup image 2. Restore DB from cloud 3. Download queued transactions 4. Verify with last cash count |
| Fire / theft (hardware) | 24 hours | 24 hours | 1. Activate cloud POS (temp) 2. Restore from offsite backup 3. Resume basic ops 4. Full recovery within 1 week |

---

## 9. Compliance & Audit Preparation

### Audit Trail Schema
```sql
CREATE TABLE audit_log (
  log_id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id             INT NOT NULL,
  action_type         VARCHAR(50),
  table_name          VARCHAR(50),
  record_id           VARCHAR(100),
  old_value           JSON,
  new_value           JSON,
  ip_address          VARCHAR(45),
  device_id           VARCHAR(100),
  timestamp           DATETIME(3),
  reason              TEXT,
  supervisor_approval VARCHAR(50)
);
-- Requirements:
-- 1. Immutable (append-only)
-- 2. Cryptographic signing of entries
-- 3. 5-year retention minimum
-- 4. Monthly review by compliance officer
```

### PPB Inspection Preparation

#### 24 Hours Before Inspection
- [ ] Print controlled substances register (bound book + digital)
- [ ] Export all dispensing records for last 90 days
- [ ] Verify all prescriptions on file (no missing documents)
- [ ] Check quarantine area for expired drugs
- [ ] Verify safe log and access records
- [ ] Prepare staff license copies (Pharmacist, Dispensers)
- [ ] Generate premises license and renewal receipts
- [ ] Document any incidents, losses, or thefts
- [ ] Ensure all labels printed correctly (no manual labels)
- [ ] Verify temperature logs for cold chain drugs

#### During Inspection
- Assign one staff member to accompany inspector
- Provide requested reports within **15 minutes**
- Be transparent about any system limitations
- Document every request and response
- Do **not** offer unsolicited information
- Escalate legal questions to management immediately
- Request copy of any citations or observations

---

## 10. Roles & Responsibilities Matrix

| Role | System Access | Key Responsibilities | Escalation Path |
|------|--------------|---------------------|-----------------|
| **Cashier** | POS, Customer search, Basic returns | Process sales, handle cash, issue receipts | Senior Cashier → Dispenser |
| **Dispenser** | All Cashier + Prescription intake, Stock checking | Fill prescriptions, label drugs, manage queue | Pharmacist |
| **Pharmacist** | Full clinical + Inventory adjustments, Returns approval | Verify prescriptions, drug interactions, controlled substances | Store Manager |
| **Inventory Manager** | Stock management, PO creation, Supplier mgmt | Ordering, expiry tracking, stock counts | Store Manager |
| **Store Manager** | All operational + Credit approvals, Staff mgmt | Daily operations, cash reconciliation, reporting | Regional Manager / GM |
| **Accountant** | Financial reports, eTIMS, Payables/Receivables | Tax compliance, reconciliation, payments | Finance Manager |
| **Claims Officer** | Insurance schemes, Claims generation | Claim submission, reconciliation, follow-up | Store Manager |
| **Admin / IT** | User management, System configuration | User accounts, backups, integration maintenance | GM |
| **Auditor** | Read-only all tables, Audit log viewer | Compliance verification, internal audits | Board / GM |
| **GM** | All operational + System configuration override | Strategic decisions, major approvals, policy | Owner / Board |

---

## 11. Standard Response Times

| Activity | Standard | Acceptable Range | Escalation |
|----------|----------|-----------------|------------|
| Item scanning at POS | 2 sec | 1–5 sec | >10 sec → check scanner |
| Payment processing (M-Pesa) | 15 sec | 10–30 sec | >60 sec → use alternative |
| Prescription verification | 3 min | 2–5 min | >10 min → assist pharmacist |
| Drug interaction check | 1 sec | <2 sec | >5 sec → manual check |
| Receipt printing | 5 sec | 3–10 sec | >30 sec → use SMS/email |
| Customer registration | 2 min | 1–3 min | >5 min → supervisor assist |
| Stock lookup | 2 sec | 1–3 sec | >10 sec → manual count |
| Claims submission | 30 sec | 15–60 sec | >2 min → record and manual submit |
| End-of-day reconciliation | 15 min | 10–20 min | >30 min → double count |
| Backup verification | 1 min | <2 min | >5 min → IT alert |

---

*End of Master Workflow Document — v1.0 — 2026-04-27*

# 💊 Pharmacy POS System — Complete Workflow Manual

> **Version:** 1.0 | **Status:** APPROVED | **Date:** 2026-04-27 | **Author:** System Architect — Mutuma

A comprehensive, production-ready Pharmacy Point-of-Sale system covering all operational workflows, compliance requirements, SQL schemas, business logic, and emergency procedures for a KRA/PPB-compliant Kenyan pharmacy.

---

## 📁 Repository Structure

```
pharmacy-pos-system/
├── README.md                        ← You are here
├── WORKFLOW.md                      ← Master workflow index (one-sprint overview)
├── docs/
│   ├── 01-sales-billing.md
│   ├── 02-inventory-management.md
│   ├── 03-prescription-management.md
│   ├── 04-customer-management.md
│   ├── 05-insurance-nhif.md
│   ├── 06-financial-accounting.md
│   ├── 07-reporting-schedules.md
│   ├── 08-system-maintenance.md
│   ├── 09-compliance-audit.md
│   ├── 10-roles-responsibilities.md
│   └── 11-response-times.md
├── sql/
│   ├── audit_log.sql
│   ├── controlled_substances_register.sql
│   └── stored_procedures/
│       ├── GetFEFOBatch.sql
│       ├── RegisterNewPatient.sql
│       └── PartialDispensing.sql
├── src/
│   ├── billing/splitPayment.js
│   ├── inventory/grnProcessor.js
│   ├── prescription/validator.js
│   ├── customer/creditAccountManager.js
│   ├── insurance/claimProcessor.js
│   └── finance/
│       ├── cashReconciliation.js
│       └── kraCompliance.js
└── quick-guides/
    ├── POS_DESK_CARD.md
    ├── PHARMACIST_QUICK_GUIDE.md
    └── EOD_CLOSE_CARD.md
```

---

## 🗺️ Workflow Sections

| # | Section | Procedure Codes |
|---|---------|----------------|
| 1 | [Sales & Billing](docs/01-sales-billing.md) | POS-STD-001, POS-STD-002, POS-PRS-001 |
| 2 | [Inventory Management](docs/02-inventory-management.md) | INV-GRN-001, INV-FEFO-001, INV-CONT-001 |
| 3 | [Prescription Management](docs/03-prescription-management.md) | RX-VER-001, RX-REP-001 |
| 4 | [Customer Management](docs/04-customer-management.md) | CUST-REG-001, CUST-CREDIT-001 |
| 5 | [Insurance & SHA/NHIF](docs/05-insurance-nhif.md) | INS-CLM-001, INS-REC-001 |
| 6 | [Financial & Accounting](docs/06-financial-accounting.md) | FIN-CASH-001, FIN-ETIMS-001 |
| 7 | [Reporting Schedules](docs/07-reporting-schedules.md) | Alert & Escalation Matrix |
| 8 | [System Maintenance](docs/08-system-maintenance.md) | SYS-DR-001 |
| 9 | [Compliance & Audit](docs/09-compliance-audit.md) | PPB Inspection Protocol |
| 10 | [Roles & Responsibilities](docs/10-roles-responsibilities.md) | RBAC Matrix |
| 11 | [Standard Response Times](docs/11-response-times.md) | SLA Table |

---

## ⚡ Quick Start

### For Cashiers
→ See [`quick-guides/POS_DESK_CARD.md`](quick-guides/POS_DESK_CARD.md)

### For Pharmacists
→ See [`quick-guides/PHARMACIST_QUICK_GUIDE.md`](quick-guides/PHARMACIST_QUICK_GUIDE.md)

### For End-of-Day Close
→ See [`quick-guides/EOD_CLOSE_CARD.md`](quick-guides/EOD_CLOSE_CARD.md)

---

## 🔗 Regulatory Compliance

| Body | Requirement | Procedure |
|------|-------------|-----------|
| **KRA** | eTIMS real-time invoicing | `FIN-ETIMS-001` |
| **PPB** | Controlled substances register | `INV-CONT-001` |
| **PPB** | Monthly compliance report | Section 7 Reporting |
| **SHA/NHIF** | Real-time claim submission | `INS-CLM-001` |
| **Data Protection** | Audit trail & immutable logs | Section 9 |

---

## 📋 Document Control

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Effective Date | 2026-04-27 |
| Author | System Architect — Mutuma |
| Status | APPROVED |
| Review Cycle | Quarterly |
| Retention | 7 years (controlled records) |

> All staff must sign an acknowledgment of receipt and completion of training before accessing the system.

# Pharmacy POS System - Detailed User Flows

This document outlines the step-by-step workflows for each user role in the Pharmacy POS System. These flows guide the UI design and implementation.

## 1. Cashier Workflow

**Primary Goal:** Process sales transactions quickly and accurately.

**Flow Steps:**

1. **Login:** Cashier enters credentials → System validates → Redirects to POS Terminal
2. **Start Transaction:** Cashier clicks "New Sale" → Empty cart displayed
3. **Add Items:** Cashier scans/searches for product → Selects quantity → Item added to cart with real-time total
4. **Apply Discount (if needed):** Cashier enters discount code or percentage → System validates → Total recalculated
5. **Select Payment Method:** System presents options: Cash, M-Pesa, Card, Insurance, or Split Payment
6. **Process Payment:** 
   - If Cash: Enter amount → Calculate change → Display change due
   - If M-Pesa: Enter phone → Initiate payment → Wait for confirmation
   - If Card: Display card reader prompt → Wait for card processing
   - If Insurance: Select insurance scheme → Calculate co-payment → Process
   - If Split: Combine multiple payment methods → Validate total
7. **Generate Receipt:** System generates KRA-compliant receipt → Display on screen and printer
8. **Complete Sale:** Sale recorded in database → Cart cleared → Ready for next transaction
9. **End of Day:** Cashier initiates EOD closure → System calculates total sales → Prepares for reconciliation
10. **Logout:** Cashier clicks logout → Session terminated

**UI Components Needed:** POS terminal interface, product search, cart display, payment selection, receipt preview.

---

## 2. Dispenser Workflow

**Primary Goal:** Fill prescriptions accurately and efficiently.

**Flow Steps:**

1. **Login:** Dispenser enters credentials → System validates → Redirects to Dispensing Dashboard
2. **View Prescription Queue:** System displays pending prescriptions sorted by priority
3. **Select Prescription:** Dispenser clicks on prescription → Full prescription details displayed
4. **Verify Patient:** System shows patient name, ID, allergies → Dispenser confirms identity
5. **Check Stock:** Dispenser searches for drug → System shows available batches (FEFO sorted)
6. **Pick Drug:** Dispenser selects batch → Scans barcode → Quantity adjusted
7. **Label Drug:** System generates label with patient name, drug name, dosage, directions → Dispenser prints and applies
8. **Verify Quantity:** Dispenser confirms correct quantity picked
9. **Complete Dispensing:** Dispenser marks prescription as dispensed → Stock updated
10. **Hand to Patient:** Dispenser provides drug and counseling notes to patient
11. **Logout:** Dispenser clicks logout → Session terminated

**UI Components Needed:** Prescription queue, patient verification, stock checker, labeling interface, dispensing confirmation.

---

## 3. Pharmacist Workflow

**Primary Goal:** Ensure clinical safety, manage inventory, and approve complex transactions.

**Flow Steps:**

1. **Login:** Pharmacist enters credentials → System validates → Redirects to Pharmacist Dashboard
2. **Review Pending Prescriptions:** System displays prescriptions awaiting verification
3. **Validate Prescription:** 
   - Check mandatory elements (patient, prescriber, drug, dosage, directions)
   - Check drug interactions against patient medication history
   - Check patient allergies
   - Verify prescriber credentials
4. **Approve/Reject:** If valid, approve → If issues, reject with reason
5. **Manage Inventory:**
   - View stock levels
   - Create stock adjustments (damage, expiry, loss)
   - Approve GRN batches
   - Flag short-dated drugs
6. **Approve Returns:** Review returned items → Verify condition → Approve or reject
7. **Access Controlled Substances Register:** View and update controlled substance logs
8. **Generate Reports:** Create clinical reports (drug interactions, chronic disease tracking)
9. **Logout:** Pharmacist clicks logout → Session terminated

**UI Components Needed:** Prescription verification interface, drug interaction checker, inventory dashboard, returns approval, controlled substances register.

---

## 4. Inventory Manager Workflow

**Primary Goal:** Maintain optimal stock levels and manage supplier relationships.

**Flow Steps:**

1. **Login:** Inventory Manager enters credentials → System validates → Redirects to Inventory Dashboard
2. **Monitor Stock Levels:** View real-time inventory → Identify low-stock items
3. **Create Purchase Order:**
   - Search for supplier
   - Select products and quantities
   - Set delivery date
   - Submit PO → Awaits approval
4. **Receive Goods:**
   - Scan PO barcode → System displays expected items
   - For each item: Scan batch barcode, verify quantity, check expiry date
   - System flags any discrepancies (tolerance check)
   - Accept or reject batch
5. **Process GRN:** System generates GRN → Records in database → Updates stock
6. **Manage Expiry:**
   - View expiring stock
   - Flag short-dated items for markdown
   - Plan disposal for expired items
7. **Conduct Stock Count:**
   - Initiate physical count
   - Enter counted quantities
   - System reconciles with system stock
   - Investigate discrepancies
8. **Create Transfer Request:** (For multi-branch)
   - Select destination branch
   - Add items and quantities
   - Submit for approval
9. **Logout:** Inventory Manager clicks logout → Session terminated

**UI Components Needed:** Stock dashboard, PO creation form, GRN receiving interface, expiry tracker, stock count interface, transfer request form.

---

## 5. Branch Manager Workflow

**Primary Goal:** Oversee branch operations, approve transactions, and manage staff.

**Flow Steps:**

1. **Login:** Branch Manager enters credentials → System validates → Redirects to Branch Manager Dashboard
2. **View Dashboard:** See branch KPIs (sales, inventory, cash, pending approvals)
3. **Approve Credit:** 
   - View pending credit requests
   - Check customer credit history
   - Approve or reject with reason
   - Set credit limit
4. **Approve Returns:** Review complex returns → Approve or reject
5. **Daily Cash Reconciliation:**
   - View expected cash total
   - Enter physical cash count
   - System calculates variance
   - If variance acceptable, approve → If not, investigate
6. **Manage Staff:** View staff list → Create/edit/deactivate users → Assign roles
7. **Approve Transfers:** (For multi-branch)
   - View transfer requests from other branches
   - Review transfer details
   - Approve or reject
8. **Generate Reports:** Access sales, inventory, and financial reports
9. **Logout:** Branch Manager clicks logout → Session terminated

**UI Components Needed:** Manager dashboard, credit approval interface, cash reconciliation form, staff management, transfer approval workflow, reporting interface.

---

## 6. Regional Manager Workflow

**Primary Goal:** Oversee multi-branch operations and handle escalations.

**Flow Steps:**

1. **Login:** Regional Manager enters credentials → System validates → Redirects to Regional Dashboard
2. **View Regional Dashboard:** See aggregated KPIs across all branches in region
3. **Monitor Transfers:** 
   - View all inter-branch transfers in region
   - Track transfer status (pending, approved, dispatched, received)
   - Monitor transfer costs
4. **Handle Escalations:**
   - View escalated issues (high-value transfers, disputes)
   - Review details and supporting documents
   - Approve or reject escalations
5. **Generate Regional Reports:** Access consolidated reports across branches
6. **Logout:** Regional Manager clicks logout → Session terminated

**UI Components Needed:** Regional dashboard, transfer monitoring interface, escalation handler, regional reporting.

---

## 7. Accountant Workflow

**Primary Goal:** Manage financial records, ensure compliance, and generate reports.

**Flow Steps:**

1. **Login:** Accountant enters credentials → System validates → Redirects to Accounting Dashboard
2. **View Financial Dashboard:** See cash position, receivables, payables
3. **Reconcile Transactions:**
   - View daily transactions
   - Reconcile with bank statements
   - Flag discrepancies
4. **Generate Financial Reports:**
   - P&L Statement
   - Balance Sheet
   - Cash Flow Report
   - Tax Report
5. **Manage Payables:**
   - View supplier invoices
   - Approve payments
   - Record payments
6. **Manage Receivables:**
   - View customer invoices
   - Track payments
   - Follow up on overdue amounts
7. **KRA eTIMS Submission:**
   - View daily sales summary
   - Verify tax calculations
   - Submit to KRA
   - Monitor submission status
8. **Logout:** Accountant clicks logout → Session terminated

**UI Components Needed:** Accounting dashboard, reconciliation interface, financial reporting, payables/receivables management, eTIMS submission interface.

---

## 8. Claims Officer Workflow

**Primary Goal:** Process insurance claims and ensure timely reimbursement.

**Flow Steps:**

1. **Login:** Claims Officer enters credentials → System validates → Redirects to Claims Dashboard
2. **View Pending Claims:** System displays claims awaiting submission
3. **Verify Claim Details:**
   - Check member eligibility
   - Verify co-payment calculation
   - Review itemized services/products
4. **Submit Claim:**
   - Generate claim document
   - Attach supporting documents
   - Submit to insurance scheme
   - Record submission date
5. **Track Claim Status:**
   - Monitor claim progress with insurer
   - Receive approval/rejection notifications
   - Update claim status in system
6. **Reconcile Payments:**
   - Receive insurer payment
   - Match with submitted claims
   - Record payment
   - Reconcile discrepancies
7. **Handle Rejections:**
   - Review rejection reason
   - Gather additional documentation if needed
   - Resubmit or escalate
8. **Generate Reports:** Create claim submission and reconciliation reports
9. **Logout:** Claims Officer clicks logout → Session terminated

**UI Components Needed:** Claims dashboard, claim submission form, claim tracker, payment reconciliation interface, rejection handler.

---

## 9. Admin/IT Workflow

**Primary Goal:** Maintain system integrity, manage users, and ensure security.

**Flow Steps:**

1. **Login:** Admin enters credentials → System validates → Redirects to Admin Dashboard
2. **Manage Users:**
   - View user list
   - Create new user account
   - Edit user details
   - Assign/modify roles
   - Deactivate user
   - Reset user password
3. **Configure System:**
   - Set system parameters
   - Configure integrations (SMS, Email, KRA)
   - Manage branches
   - Set approval thresholds
4. **Backup & Restore:**
   - Initiate system backup
   - Monitor backup progress
   - Restore from backup if needed
5. **View Audit Log:**
   - Filter audit entries by user, action, date
   - Review system changes
   - Export audit report
6. **Monitor System Health:**
   - Check database status
   - Monitor API performance
   - Review error logs
7. **Logout:** Admin clicks logout → Session terminated

**UI Components Needed:** Admin dashboard, user management interface, system configuration, backup interface, audit log viewer.

---

## 10. Auditor Workflow

**Primary Goal:** Verify compliance and review system integrity.

**Flow Steps:**

1. **Login:** Auditor enters credentials → System validates → Redirects to Audit Dashboard (read-only)
2. **View Audit Trail:**
   - Filter by user, action, date range
   - Review all system changes
   - Verify authorization levels
3. **Generate Audit Reports:**
   - User access report
   - Transaction audit report
   - Compliance report
   - Data integrity report
4. **Verify Transactions:**
   - Sample review of sales transactions
   - Verify calculations
   - Check approvals
5. **Review Financial Records:**
   - Verify reconciliations
   - Check for anomalies
   - Validate compliance with policies
6. **Export Reports:** Generate and download audit reports in PDF/Excel format
7. **Logout:** Auditor clicks logout → Session terminated

**UI Components Needed:** Audit dashboard, audit log viewer, report generator, read-only transaction viewer.

---

## 11. General Manager (GM) Workflow

**Primary Goal:** Strategic oversight and high-level approvals.

**Flow Steps:**

1. **Login:** GM enters credentials → System validates → Redirects to Executive Dashboard
2. **View Executive Dashboard:** See company-wide KPIs and metrics
3. **Approve High-Value Transactions:**
   - View escalated transfers (>threshold)
   - Review transfer details
   - Approve or reject
4. **Approve Major Credit Limits:** Review and authorize large customer credit limits
5. **Policy Management:** Update system policies and approval thresholds
6. **Generate Strategic Reports:** Access consolidated reports for decision-making
7. **Logout:** GM clicks logout → Session terminated

**UI Components Needed:** Executive dashboard, high-value approval interface, policy management, strategic reporting.

---

## Cross-Functional Flows

### Multi-Branch Transfer Flow (Inventory Manager → Branch Manager → Regional Manager)

1. **Inventory Manager** creates transfer request (source branch, destination, items, quantities)
2. **Source Branch Manager** approves transfer request
3. **Destination Branch Manager** receives and approves transfer
4. **Regional Manager** monitors transfer and handles any escalations
5. **System** calculates costs, generates waybill, and records settlement

### Insurance Claim Flow (Cashier → Pharmacist → Claims Officer → Accountant)

1. **Cashier** processes sale with insurance payment
2. **Pharmacist** verifies prescription and eligibility
3. **Claims Officer** submits claim to insurance scheme
4. **Accountant** reconciles payment when received
5. **System** updates financial records

### Credit Approval Flow (Cashier → Branch Manager → Accountant)

1. **Cashier** initiates credit sale for new customer
2. **System** checks credit limit and flags for approval
3. **Branch Manager** reviews and approves credit limit
4. **Accountant** monitors credit account and follows up on payments

---

*This document is part of the Pharmacy POS System Procedures Manual.*

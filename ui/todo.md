# Pharmacy POS System UI - Project TODO

## Phase 1: Core Architecture & Reusable Components

### DRY Component Library
- [x] Create base button component with variants (primary, secondary, danger, ghost)
- [x] Create form input component (text, email, password, number)
- [x] Create select/dropdown component
- [x] Create modal/dialog component
- [x] Create data table component with sorting, filtering, pagination
- [x] Create card component with variants
- [x] Create alert/notification component
- [x] Create badge/tag component
- [x] Create loading skeleton component
- [x] Create breadcrumb navigation component
- [x] Create tabs component
- [x] Create sidebar navigation component
- [x] Create top navigation bar component
- [x] Create search/filter bar component
- [x] Create date picker component
- [x] Create time picker component
- [x] Create checkbox/radio component
- [x] Create switch/toggle component
- [x] Create progress bar component
- [x] Create avatar component

### Layout Components
- [x] Create DashboardLayout component (sidebar + main content)
- [x] Create AuthLayout component (login/register pages)
- [ ] Create PageLayout component (header + content + footer)
- [x] Create ProtectedRoute wrapper with role-based access
- [x] Create RoleGuard component for conditional rendering

### Authentication & RBAC
- [x] Implement JWT token storage and refresh logic
- [x] Create useAuth hook for accessing user state
- [x] Create usePermission hook for checking user permissions
- [x] Implement role-based route protection
- [ ] Create permission matrix in database
- [ ] Implement API middleware for RBAC validation

## Phase 2: User Authentication & Authorization

### Login/Register
- [x] Create LoginPage component
- [ ] Create RegisterPage component
- [ ] Create password reset flow
- [ ] Create MFA setup (SMS OTP, Authenticator)
- [x] Implement session management

### User Management (Admin)
- [ ] Create UserManagementPage
- [ ] Create user creation form
- [ ] Create user editing form
- [ ] Create user role assignment
- [ ] Create user deactivation
- [ ] Create user list with search/filter

## Phase 3: Sales & Billing Module

### POS Terminal
- [x] Create POSPage component
- [ ] Create product search/scan interface
- [ ] Create shopping cart component
- [ ] Create discount application logic
- [ ] Create payment method selection (cash, M-Pesa, card, insurance)
- [ ] Create split payment interface
- [ ] Create receipt generation
- [ ] Create KRA compliance integration
- [ ] Create sales history view

### Customer Management
- [ ] Create CustomerRegistrationPage
- [ ] Create CustomerSearchPage
- [ ] Create CustomerProfilePage
- [ ] Create customer credit account view
- [ ] Create customer transaction history

## Phase 4: Inventory Management

### Stock Management
- [ ] Create StockOverviewPage
- [ ] Create stock level dashboard
- [ ] Create low stock alerts
- [ ] Create expiry tracking view
- [ ] Create FEFO batch selection interface

### GRN Processing
- [ ] Create GRNProcessingPage
- [ ] Create PO creation form
- [ ] Create GRN receiving form
- [ ] Create batch management interface
- [ ] Create tolerance validation view
- [ ] Create short-dated drug flagging

### Stock Adjustments
- [ ] Create StockAdjustmentPage
- [ ] Create adjustment reason selection
- [ ] Create quantity adjustment form
- [ ] Create approval workflow

## Phase 5: Prescription Management

### Prescription Processing
- [ ] Create PrescriptionIntakePage
- [ ] Create prescription validation interface
- [ ] Create drug interaction checker
- [ ] Create prescription verification workflow
- [ ] Create controlled substances register

### Dispensing
- [ ] Create DispensingPage
- [ ] Create prescription queue view
- [ ] Create drug labeling interface
- [ ] Create dispensing confirmation

## Phase 6: Insurance & Claims

### Claims Processing
- [ ] Create ClaimsProcessingPage
- [ ] Create member eligibility checker
- [ ] Create co-payment calculator
- [ ] Create claim submission form
- [ ] Create pre-authorization workflow

### Claims Reconciliation
- [ ] Create ClaimsReconciliationPage
- [ ] Create submitted claims view
- [ ] Create claim status tracker
- [ ] Create rejection resolution interface

## Phase 7: Financial Management

### Cash Reconciliation
- [ ] Create CashReconciliationPage
- [ ] Create daily reconciliation form
- [ ] Create variance analysis
- [ ] Create reconciliation approval workflow

### Financial Reporting
- [ ] Create FinancialReportingPage
- [ ] Create P&L statement view
- [ ] Create balance sheet view
- [ ] Create cash flow report
- [ ] Create KRA eTIMS submission status

### Payments & Receivables
- [ ] Create PayablesPage
- [ ] Create ReceivablesPage
- [ ] Create payment tracking
- [ ] Create invoice management

## Phase 8: Multi-Branch Reallocation

### Transfer Requests
- [ ] Create TransferRequestsPage
- [ ] Create transfer request creation form
- [ ] Create transfer request approval workflow
- [ ] Create transfer request history

### Transfer Orders
- [ ] Create TransferOrdersPage
- [ ] Create dispatch interface
- [ ] Create waybill generation
- [ ] Create receiving interface
- [ ] Create reconciliation interface

### Auto-Reallocation
- [ ] Create AutoReallocationConfigPage
- [ ] Create reallocation rules configuration
- [ ] Create overstock/understock dashboard
- [ ] Create automatic transfer monitoring

### Transfer Costs & Settlement
- [ ] Create TransferCostsPage
- [ ] Create cost allocation view
- [ ] Create InterBranchSettlementPage
- [ ] Create settlement calculation view
- [ ] Create settlement approval workflow

## Phase 9: Reporting & Analytics

### Dashboards
- [ ] Create AdminDashboard (executive overview)
- [ ] Create BranchManagerDashboard (branch performance)
- [ ] Create PharmacistDashboard (clinical metrics)
- [ ] Create InventoryManagerDashboard (stock metrics)
- [ ] Create AccountantDashboard (financial metrics)

### Reports
- [ ] Create SalesReportPage
- [ ] Create InventoryReportPage
- [ ] Create FinancialReportPage
- [ ] Create ComplianceReportPage
- [ ] Create AuditReportPage

## Phase 10: System Administration

### Settings
- [ ] Create SystemSettingsPage
- [ ] Create branch configuration
- [ ] Create integration settings (SMS, Email, KRA)
- [ ] Create backup/restore interface

### Audit & Compliance
- [ ] Create AuditLogPage
- [ ] Create audit trail viewer
- [ ] Create compliance report generator

## User Flows Documentation
- [ ] Document Cashier workflow (login → POS → payment → logout)
- [ ] Document Dispenser workflow (prescription intake → dispensing → verification)
- [ ] Document Pharmacist workflow (prescription validation → stock management → returns)
- [ ] Document Inventory Manager workflow (stock management → PO creation → GRN processing)
- [ ] Document Branch Manager workflow (dashboard → approvals → reporting)
- [ ] Document Regional Manager workflow (transfer oversight → escalation handling)
- [ ] Document Accountant workflow (reconciliation → reporting → eTIMS)
- [ ] Document Claims Officer workflow (claim submission → reconciliation)
- [ ] Document Admin workflow (user management → system configuration)
- [ ] Document Auditor workflow (audit trail review → reporting)
- [ ] Document GM workflow (strategic approvals → policy management)

## Testing & QA
- [ ] Create component unit tests
- [ ] Create integration tests for user flows
- [ ] Create E2E tests for critical paths
- [ ] Test RBAC enforcement
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (keyboard navigation, screen readers)
- [ ] Performance testing and optimization

## Deployment & Documentation
- [ ] Create UI deployment guide
- [ ] Create user manual for each role
- [ ] Create troubleshooting guide
- [ ] Create API documentation
- [ ] Create component library documentation

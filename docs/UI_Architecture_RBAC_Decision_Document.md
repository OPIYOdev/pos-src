# UI Architecture & Role-Based Access Control (RBAC) Decision Document

## 1. Introduction

This document outlines the proposed UI architecture and Role-Based Access Control (RBAC) strategy for the Pharmacy POS System. The goal is to define user roles, their associated workflows, authentication mechanisms, and how access to various UI components and routes will be managed. This document serves as a decision-making guide before any UI code development commences.

## 2. Identified User Roles and Responsibilities

Based on the `PHARMACYPOSSYSTEM.docx` and `docs/10-roles-responsibilities.md`, the following key user roles have been identified within the Pharmacy POS System:

| Role | Key Responsibilities | System Access Level (High-Level) |
|---|---|---|
| **Cashier** | Process sales, handle cash, basic returns, issue receipts | POS, Customer Search, Basic Returns |
| **Dispenser** | Fill prescriptions, label drugs, manage queue, stock checking | All Cashier + Prescription Intake, Stock Checking |
| **Pharmacist** | Verify prescriptions, drug interactions, controlled substances, inventory adjustments, returns approval | Full Clinical + Inventory Adjustments, Returns Approval, Controlled Substances Register |
| **Inventory Manager** | Stock management, purchase order creation, supplier management, expiry tracking, stock counts | Stock Management, PO Creation, Supplier Mgmt, Expiry Tracking |
| **Branch Manager** | Daily operations, cash reconciliation, credit approvals, staff management, reporting | All Operational + Credit Approvals, Staff Mgmt, Reporting |
| **Regional Manager** | Oversee inter-branch transfers, handle escalation for transfers | Inter-Branch Transfer Oversight, Escalation Handling |
| **Accountant** | Financial reports, eTIMS, reconciliation, payments | Financial Reporting, eTIMS, Payables/Receivables |
| **Claims Officer** | Insurance claim submission, reconciliation, follow-up | Insurance Schemes, Claims Generation, Reconciliation |
| **Admin/IT** | User accounts, backups, integration maintenance, system configuration | User Management, System Configuration, Backups, Integrations |
| **Auditor** | Audit verification, internal audits | Read-only access to all tables, Audit Log Viewer |
| **General Manager (GM)** | Strategic decisions, major approvals, policy decisions | All Operational + System Configuration Override, Policy |

## 3. Core Workflows per Role (UI Perspective)

This section outlines the primary UI interactions and workflows for each role.

### 3.1. Cashier
*   **Login/Logout:** Secure access to the POS system.
*   **Sales Transaction:** Scan/add items, apply discounts, process various payment types (cash, M-Pesa, card, insurance), generate receipts.
*   **Customer Search:** Look up existing customer profiles.
*   **Basic Returns:** Process simple product returns.
*   **End-of-Day (EOD) Closure:** Initiate cash reconciliation process.

### 3.2. Dispenser
*   **All Cashier Workflows.**
*   **Prescription Intake:** Receive and log new prescriptions.
*   **Stock Checking:** View basic stock levels for dispensing.

### 3.3. Pharmacist
*   **All Dispenser Workflows.**
*   **Prescription Validation:** Verify mandatory elements, check drug interactions, patient allergies.
*   **Controlled Substances Management:** Access and update the controlled substances register.
*   **Inventory Adjustments:** Approve and perform minor stock adjustments.
*   **Returns Approval:** Authorize complex product returns.

### 3.4. Inventory Manager
*   **Login/Logout.**
*   **Stock Overview:** View real-time inventory levels across branches.
*   **Purchase Order (PO) Management:** Create, edit, and track purchase orders.
*   **Goods Received Note (GRN) Processing:** Record incoming stock, manage batches, handle short-dated items.
*   **Supplier Management:** Maintain supplier information.
*   **Expiry Tracking:** Monitor and manage expiring stock.
*   **Stock Counts:** Initiate and reconcile physical stock counts.
*   **Transfer Request Creation:** Initiate inter-branch transfer requests.

### 3.5. Branch Manager
*   **Login/Logout.**
*   **Dashboard:** Overview of branch performance (sales, inventory, cash).
*   **Cash Reconciliation Approval:** Review and approve daily cash reconciliation reports.
*   **Credit Approval:** Authorize customer credit limits within their authority.
*   **Staff Management:** Basic user management for their branch.
*   **Reporting:** Access various operational reports.
*   **Transfer Request Approval/Rejection:** Approve or reject transfer requests from their branch or other branches.

### 3.6. Regional Manager
*   **Login/Logout.**
*   **Regional Dashboard:** Aggregated view of all branches in their region.
*   **Inter-Branch Transfer Oversight:** Monitor transfer activities across their region.
*   **Escalation Handling:** Resolve escalated issues related to transfers or branch operations.

### 3.7. Accountant
*   **Login/Logout.**
*   **Financial Reporting:** Generate P&L, balance sheets, and other financial statements.
*   **eTIMS Management:** Monitor KRA eTIMS submissions and resolve issues.
*   **Reconciliation:** Perform various financial reconciliations.
*   **Payables/Receivables:** Manage invoices and payments.

### 3.8. Claims Officer
*   **Login/Logout.**
*   **Insurance Claim Submission:** Process and submit insurance claims.
*   **Claim Reconciliation:** Reconcile submitted claims with insurer payments.
*   **Follow-up:** Track pending claims and resolve rejections.

### 3.9. Admin/IT
*   **Login/Logout.**
*   **User Management:** Create, modify, and deactivate user accounts; assign roles.
*   **System Configuration:** Manage system settings, integrations (SMS, Email, KRA).
*   **Backup/Restore:** Initiate and monitor system backups.
*   **Audit Log Viewer:** Access and review system audit trails.

### 3.10. Auditor
*   **Login/Logout.**
*   **Read-Only Access:** View all system data without modification capabilities.
*   **Audit Log Viewer:** Specifically designed interface for reviewing audit trails.
*   **Reporting:** Generate compliance and audit-specific reports.

### 3.11. General Manager (GM)
*   **Login/Logout.**
*   **Executive Dashboard:** High-level overview of entire business performance.
*   **Strategic Approvals:** Authorize high-value transfers, major credit limits, policy changes.
*   **System Configuration Override:** Highest level of system configuration access.

## 4. Authentication Strategy

### 4.1. User Authentication

*   **Method:** Username/Password authentication will be the primary method.
*   **Security:** Passwords will be hashed and salted. Secure token-based authentication (e.g., JWT - JSON Web Tokens) will be used for API access, ensuring stateless sessions and protecting against CSRF attacks.
*   **Multi-Factor Authentication (MFA):** Optional MFA (e.g., SMS OTP, Authenticator App) for sensitive roles (e.g., Pharmacist, Branch Manager, Admin/IT, GM) to enhance security.
*   **Session Management:** Secure session cookies with appropriate expiry and renewal mechanisms.

### 4.2. Password Policies

*   Minimum length (e.g., 12 characters).
*   Complexity requirements (uppercase, lowercase, numbers, special characters).
*   Password expiry (e.g., every 90 days).
*   Account lockout after multiple failed login attempts.

## 5. Role-Based Access Control (RBAC) Design

RBAC will be implemented to restrict system access based on the user's role. This ensures that users can only perform actions and view information relevant to their job functions.

### 5.1. Access Control Granularity

*   **Route-Level Protection:** Each API endpoint and UI route will be protected based on required roles. For example, only `Inventory Manager` and `Pharmacist` can access `/inventory/adjustments`.
*   **Component-Level Guarding:** UI components (e.g., buttons, forms, data tables) will be conditionally rendered or disabled based on the logged-in user's role. For instance, the 
`Approve Transfer` button will only be visible to `Branch Manager` or higher roles.
*   **Data-Level Filtering:** Data displayed in tables or reports will be filtered based on the user's branch or regional scope.

### 5.2. RBAC Implementation Strategy

*   **Backend (API):** Middleware will intercept API requests, verify the JWT token, extract user roles, and check if the role has permission to access the requested resource/action. Unauthorized requests will receive a `403 Forbidden` response.
*   **Frontend (UI):** Frontend routes will be guarded using route guards that check user roles before rendering components. UI elements will be dynamically rendered or disabled based on the user's permissions, preventing unauthorized actions from being attempted.

### 5.3. Example RBAC Matrix (Partial)

| Feature/Route | Cashier | Dispenser | Pharmacist | Inventory Manager | Branch Manager | Regional Manager | Accountant | Claims Officer | Admin/IT | Auditor | GM |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Sales Module** | | | | | | | | | | | |
| POS Terminal | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Apply Discount (>10%) | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Process Split Payment | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Inventory Module** | | | | | | | | | | | |
| View Stock Levels | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Create Purchase Order | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Process GRN | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Adjust Stock | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Prescription Module** | | | | | | | | | | | |
| Dispense Prescription | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Validate Prescription | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Controlled Substances Register | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Customer Module** | | | | | | | | | | | |
| Register New Patient | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve Credit Limit | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Insurance Module** | | | | | | | | | | | |
| Process Claim | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Reconcile Claims | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Financial Module** | | | | | | | | | | | |
| Daily Cash Reconciliation | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| KRA eTIMS Submission | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Reallocation Module** | | | | | | | | | | | |
| Create Transfer Request | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve Transfer Request | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Dispatch Transfer Order | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Receive Transfer Order | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Auto-Reallocation Config | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| View Transfer Costs | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Generate Inter-Branch Settlement | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **System Admin** | | | | | | | | | | | |
| User Management | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| View Audit Log | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

## 6. UI Folder Structure (Proposed)

To support the modularity and role-based access, the UI will adopt a feature-driven folder structure. A new `ui/` directory will be created at the root of the project.

```
ui/
├── public/             # Static assets (index.html, favicon, etc.)
├── src/
│   ├── assets/         # Images, icons, global styles
│   ├── components/     # Reusable UI components (buttons, forms, modals)
│   ├── layouts/        # Layouts for different user roles/sections
│   ├── pages/          # Top-level pages/views
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── dashboard/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── BranchManagerDashboard.jsx
│   │   │   └── PharmacistDashboard.jsx
│   │   ├── sales/
│   │   │   ├── POSPage.jsx
│   │   │   └── SalesHistoryPage.jsx
│   │   ├── inventory/
│   │   │   ├── StockOverviewPage.jsx
│   │   │   └── GRNProcessingPage.jsx
│   │   ├── reallocation/
│   │   │   ├── TransferRequestsPage.jsx
│   │   │   └── AutoReallocationConfigPage.jsx
│   │   └── ... (other feature-specific pages)
│   ├── services/       # API client, authentication service
│   ├── store/          # State management (e.g., Redux, Zustand)
│   ├── utils/          # Utility functions, helpers
│   ├── App.jsx         # Main application component
│   ├── main.jsx        # Entry point (React rendering)
│   └── router.jsx      # React Router configuration with route guards
├── .env                # Environment variables for UI
├── package.json        # UI dependencies and scripts
└── README.md           # UI-specific README
```

## 7. Technology Stack (Proposed)

*   **Frontend Framework:** React.js (with Vite for fast development)
*   **Styling:** Tailwind CSS (for utility-first styling and rapid UI development)
*   **State Management:** Zustand (lightweight and flexible alternative to Redux)
*   **Routing:** React Router DOM
*   **API Client:** Axios

## 8. Decision Summary

This document proposes a robust UI architecture with a clear definition of user roles, their workflows, and a granular RBAC strategy. The chosen technology stack (React, Vite, Tailwind, Zustand) provides a modern, efficient, and scalable foundation for the Pharmacy POS System UI. Implementing these guidelines will ensure a secure, user-friendly, and maintainable frontend application.

---

*This document is part of the Pharmacy POS System Procedures Manual.*

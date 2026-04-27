# Pharmacy POS System - API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints (except `/auth/login`) require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

All responses follow this format:

```json
{
  "data": {},
  "error": null,
  "requestId": "uuid",
  "timestamp": "2026-04-27T12:00:00Z"
}
```

---

## Authentication Endpoints

### Login

**POST** `/auth/login`

Create a new session and get JWT token.

**Request:**
```json
{
  "email": "user@pharmacy.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "user": {
    "id": 1,
    "email": "user@pharmacy.com",
    "role": "pharmacist"
  }
}
```

### Logout

**POST** `/auth/logout`

Invalidate current session.

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

## Sales Endpoints

### Create Sale

**POST** `/sales`

Create a new sale transaction.

**Required Role:** `cashier`, `pharmacist`

**Request:**
```json
{
  "customerId": 1,
  "items": [
    {
      "productId": 10,
      "quantity": 2,
      "price": 500
    }
  ],
  "discountAmount": 0,
  "paymentMethods": [
    {
      "method": "cash",
      "amount": 1000
    }
  ]
}
```

**Response:**
```json
{
  "saleId": "SALE-001",
  "total": 1000,
  "status": "completed",
  "receiptNumber": "REC-001"
}
```

### List Sales

**GET** `/sales?page=1&limit=20&status=completed`

List all sales with pagination.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20)
- `status` (string): Filter by status

**Response:**
```json
{
  "data": [
    {
      "saleId": "SALE-001",
      "customerId": 1,
      "total": 1000,
      "status": "completed",
      "createdAt": "2026-04-27T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Get Sale Details

**GET** `/sales/:id`

Get details of a specific sale.

**Response:**
```json
{
  "saleId": "SALE-001",
  "customerId": 1,
  "items": [...],
  "total": 1000,
  "status": "completed",
  "receiptNumber": "REC-001"
}
```

### Process Refund

**POST** `/sales/:id/refund`

Process a refund for a sale.

**Required Role:** `cashier`, `pharmacist`, `manager`

**Request:**
```json
{
  "reason": "Customer request",
  "amount": 500
}
```

**Response:**
```json
{
  "refundId": "REF-001",
  "amount": 500,
  "status": "processed"
}
```

---

## Inventory Endpoints

### Get Stock Levels

**GET** `/inventory/stock?branchId=1&page=1&limit=20`

Get current stock levels.

**Query Parameters:**
- `branchId` (int): Filter by branch
- `page` (int): Page number
- `limit` (int): Items per page

**Response:**
```json
{
  "data": [
    {
      "productId": 10,
      "productName": "Paracetamol",
      "quantity": 100,
      "reorderLevel": 20,
      "expiryDate": "2026-12-31"
    }
  ],
  "pagination": {...}
}
```

### Get Inventory Alerts

**GET** `/inventory/alerts?branchId=1`

Get low stock and expiry alerts.

**Response:**
```json
{
  "lowStockAlerts": [...],
  "expiryAlerts": [...],
  "reorderAlerts": [...]
}
```

### Create GRN

**POST** `/inventory/grn`

Create a Goods Received Note.

**Required Role:** `inventory_manager`, `pharmacist`

**Request:**
```json
{
  "supplierId": 5,
  "invoiceNumber": "INV-001",
  "items": [
    {
      "productId": 10,
      "quantity": 100,
      "costPrice": 50,
      "expiryDate": "2026-12-31"
    }
  ]
}
```

**Response:**
```json
{
  "grnId": "GRN-001",
  "status": "pending_verification",
  "createdAt": "2026-04-27T12:00:00Z"
}
```

### Verify GRN

**POST** `/inventory/grn/:id/verify`

Verify and accept a GRN.

**Required Role:** `pharmacist`, `inventory_manager`

**Request:**
```json
{
  "discrepancies": []
}
```

**Response:**
```json
{
  "grnId": "GRN-001",
  "status": "verified",
  "verifiedAt": "2026-04-27T12:00:00Z"
}
```

---

## Prescription Endpoints

### Create Prescription

**POST** `/prescriptions`

Create a new prescription.

**Required Role:** `pharmacist`, `dispenser`

**Request:**
```json
{
  "patientId": 1,
  "drugs": [
    {
      "drugId": 10,
      "quantity": 2,
      "frequency": "twice daily",
      "duration": "7 days"
    }
  ],
  "instructions": "Take with food"
}
```

**Response:**
```json
{
  "prescriptionId": "RX-001",
  "status": "active",
  "createdAt": "2026-04-27T12:00:00Z"
}
```

### List Prescriptions

**GET** `/prescriptions?page=1&limit=20`

List all prescriptions.

**Response:**
```json
{
  "data": [...],
  "pagination": {...}
}
```

### Dispense Prescription

**POST** `/prescriptions/:id/dispense`

Mark prescription as dispensed.

**Required Role:** `dispenser`

**Response:**
```json
{
  "prescriptionId": "RX-001",
  "status": "dispensed",
  "dispensedAt": "2026-04-27T12:00:00Z"
}
```

---

## Insurance Endpoints

### Create Claim

**POST** `/insurance/claims`

Create an insurance claim.

**Required Role:** `claims_officer`

**Request:**
```json
{
  "patientId": 1,
  "claimAmount": 5000,
  "insuranceProvider": "NHIF",
  "items": [...]
}
```

**Response:**
```json
{
  "claimId": "CLM-001",
  "status": "pending",
  "createdAt": "2026-04-27T12:00:00Z"
}
```

### List Claims

**GET** `/insurance/claims?page=1&limit=20`

List all claims.

**Response:**
```json
{
  "data": [...],
  "pagination": {...}
}
```

### Approve Claim

**POST** `/insurance/claims/:id/approve`

Approve an insurance claim.

**Required Role:** `claims_officer`

**Response:**
```json
{
  "claimId": "CLM-001",
  "status": "approved",
  "approvedAt": "2026-04-27T12:00:00Z"
}
```

---

## Finance Endpoints

### Get Financial Reports

**GET** `/finance/reports?startDate=2026-01-01&endDate=2026-04-27`

Get financial reports.

**Required Role:** `accountant`, `manager`

**Query Parameters:**
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)

**Response:**
```json
{
  "totalSales": 100000,
  "totalRefunds": 5000,
  "netRevenue": 95000,
  "period": {
    "start": "2026-01-01",
    "end": "2026-04-27"
  }
}
```

### Get Reconciliation

**GET** `/finance/reconciliation`

Get cash reconciliation data.

**Required Role:** `accountant`

**Response:**
```json
{
  "reconciliations": [...]
}
```

### Create Reconciliation

**POST** `/finance/reconciliation`

Create a new reconciliation record.

**Required Role:** `accountant`

**Request:**
```json
{
  "expectedAmount": 100000,
  "actualAmount": 99500,
  "variance": 500
}
```

**Response:**
```json
{
  "reconciliationId": "REC-001",
  "status": "completed"
}
```

---

## Customer Endpoints

### Create Customer

**POST** `/customers`

Create a new customer.

**Required Role:** `cashier`, `pharmacist`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "creditLimit": 10000
}
```

**Response:**
```json
{
  "customerId": "CUST-001",
  "name": "John Doe",
  "createdAt": "2026-04-27T12:00:00Z"
}
```

### List Customers

**GET** `/customers?page=1&limit=20`

List all customers.

**Response:**
```json
{
  "data": [...],
  "pagination": {...}
}
```

### Update Credit Limit

**POST** `/customers/:id/credit-limit`

Update customer credit limit.

**Required Role:** `manager`

**Request:**
```json
{
  "creditLimit": 20000
}
```

**Response:**
```json
{
  "customerId": "CUST-001",
  "creditLimit": 20000,
  "updatedAt": "2026-04-27T12:00:00Z"
}
```

---

## Transfer Endpoints

### Create Transfer Request

**POST** `/transfers/requests`

Create an inter-branch transfer request.

**Request:**
```json
{
  "sourceBranchId": 1,
  "destinationBranchId": 2,
  "items": [
    {
      "productId": 10,
      "quantity": 50
    }
  ],
  "priority": "normal"
}
```

**Response:**
```json
{
  "transferId": "TRANS-001",
  "status": "pending_approval"
}
```

### List Transfer Orders

**GET** `/transfers/orders?page=1&limit=20`

List all transfer orders.

**Response:**
```json
{
  "data": [...],
  "pagination": {...}
}
```

### Create Settlement

**POST** `/transfers/settlements`

Create inter-branch settlement.

**Request:**
```json
{
  "branchId": 1,
  "settlementMonth": "2026-04"
}
```

**Response:**
```json
{
  "settlementId": "SETTLE-001",
  "status": "completed"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation Error",
  "message": "Items array is required",
  "requestId": "uuid"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "No token provided",
  "requestId": "uuid"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions",
  "requestId": "uuid"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Resource not found",
  "requestId": "uuid"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "requestId": "uuid"
}
```

---

## Rate Limiting

- **General API:** 100 requests per 15 minutes
- **Authentication:** 5 requests per 15 minutes
- **Sensitive Operations:** 10 requests per hour

---

*Last Updated: April 27, 2026*

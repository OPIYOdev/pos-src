# DRY Principles Implementation Guide

## Overview

This guide provides best practices for maintaining DRY (Don't Repeat Yourself) principles throughout the Pharmacy POS System codebase. All developers should follow these guidelines when adding new features or modifying existing code.

---

## 1. Error Handling - DRY Approach

### ❌ Don't: Repeat error handling

```javascript
// Bad - Error handling repeated in multiple files
try {
  const result = await db.query(sql);
} catch (err) {
  console.error('Database error:', err);
  throw new Error('Database operation failed');
}

try {
  const result = await api.call();
} catch (err) {
  console.error('API error:', err);
  throw new Error('API call failed');
}
```

### ✅ Do: Use centralized error classes

```javascript
// Good - Use centralized error classes
import { DatabaseError, ExternalServiceError, asyncHandler } from '../utils/index.js';

// In route handler
router.get('/data', asyncHandler(async (req, res) => {
  try {
    const result = await db.query(sql);
  } catch (err) {
    throw new DatabaseError('Failed to fetch data', 'DB_QUERY_ERROR', { query: sql });
  }
}));

// Error middleware handles all errors consistently
app.use(errorHandler);
```

### Usage Examples

```javascript
import { 
  ValidationError, 
  BusinessLogicError, 
  DatabaseError,
  AuthorizationError,
  NotFoundError,
  asyncHandler
} from '../utils/index.js';

// Validation error
throw new ValidationError('Invalid email format', 'INVALID_EMAIL');

// Business logic error
throw new BusinessLogicError('Credit limit exceeded', 'CREDIT_LIMIT_EXCEEDED');

// Database error
throw new DatabaseError('Query failed', 'DB_QUERY_ERROR', { query });

// Authorization error
throw new AuthorizationError('User cannot approve transfers');

// Not found error
throw new NotFoundError('Customer not found', 'CUSTOMER_NOT_FOUND', 'customer');
```

---

## 2. Validation - DRY Approach

### ❌ Don't: Repeat validation logic

```javascript
// Bad - Validation logic repeated in multiple files
// In prescriptionController.js
if (!prescription.patient_name) throw new Error('Patient name required');
if (!prescription.prescriber_name) throw new Error('Prescriber name required');

// In prescriptionService.js
if (!prescription.patient_name) throw new Error('Patient name required');
if (!prescription.prescriber_name) throw new Error('Prescriber name required');
```

### ✅ Do: Use centralized validators

```javascript
// Good - Use centralized validators
import { validators } from '../utils/index.js';

// In prescriptionController.js
validators.prescription(prescription, patientProfile);

// In prescriptionService.js
validators.prescription(prescription, patientProfile);
```

### Available Validators

```javascript
import { validators } from '../utils/index.js';

// Prescription validation
validators.prescription(rxData, patientProfile);

// GRN validation
validators.grn(grnData, purchaseOrder);

// Payment validation
validators.payment(paymentData, saleData);

// Credit validation
validators.credit(creditAccount, saleData);

// Transfer validation
validators.transfer(transferData);

// Insurance claim validation
validators.claim(claimData);
```

---

## 3. Logging - DRY Approach

### ❌ Don't: Repeat logging patterns

```javascript
// Bad - Logging repeated with different formats
console.log('User login at ' + new Date());
console.error('Error occurred: ' + err.message);
console.log('Sale processed: ' + JSON.stringify(sale));
```

### ✅ Do: Use centralized logger

```javascript
// Good - Use centralized logger
import { logger } from '../utils/index.js';

logger.info('User logged in', { userId: user.id, timestamp: new Date() });
logger.error('Sale processing failed', error, { saleId: sale.id });
logger.warn('Low stock alert', { productId: product.id, quantity: 5 });
logger.debug('Query executed', { query: sql, duration: '150ms' });
```

### Logger Methods

```javascript
import { logger } from '../utils/index.js';

// Info level
logger.info('User action', { userId: 123, action: 'login' });

// Warning level
logger.warn('Warning message', { context: 'value' });

// Error level
logger.error('Error occurred', error, { additionalContext: 'value' });

// Debug level
logger.debug('Debug information', { details: 'value' });

// Get logs
const recentLogs = logger.getLogs({ limit: 100 });
const errorLogs = logger.getLogs({ level: 'ERROR' });

// Export logs
const jsonLogs = logger.exportLogs('json');
const csvLogs = logger.exportLogs('csv');
```

---

## 4. Component Reusability - DRY Approach (Frontend)

### ❌ Don't: Create duplicate components

```tsx
// Bad - Duplicated form input components
// In SalesPage.tsx
<div>
  <label>Customer Name</label>
  <input type="text" />
  {error && <p className="text-red-500">{error}</p>}
</div>

// In CustomerPage.tsx
<div>
  <label>Customer Name</label>
  <input type="text" />
  {error && <p className="text-red-500">{error}</p>}
</div>
```

### ✅ Do: Use reusable components

```tsx
// Good - Use FormInput component
import { FormInput } from '@/components/common';

// In SalesPage.tsx
<FormInput
  label="Customer Name"
  name="customerName"
  value={name}
  onChange={setName}
  error={nameError}
/>

// In CustomerPage.tsx
<FormInput
  label="Customer Name"
  name="customerName"
  value={name}
  onChange={setName}
  error={nameError}
/>
```

### Reusable Components

```tsx
import {
  FormInput,
  FormSelect,
  DataTable,
  RoleGuard,
  ProtectedRoute,
  PageCard,
  useHasRole,
  useHasPermission,
} from '@/components/common';

// Form components
<FormInput label="Email" name="email" type="email" />
<FormSelect label="Role" name="role" options={roles} />

// Data display
<DataTable columns={columns} data={data} pageSize={10} />

// RBAC components
<RoleGuard roles={['admin']}>
  <AdminPanel />
</RoleGuard>

<ProtectedRoute requiredRoles={['manager']}>
  <ManagerPage />
</ProtectedRoute>

// Layout
<PageCard title="Sales Report">
  <div>Report content</div>
</PageCard>

// Hooks
const isAdmin = useHasRole(['admin']);
const canApprove = useHasPermission('approve_transfer');
```

---

## 5. Database Queries - DRY Approach

### ❌ Don't: Repeat query logic

```javascript
// Bad - Query logic repeated
// In inventoryService.js
const products = await db.query('SELECT * FROM products WHERE status = ?', ['active']);

// In reportService.js
const products = await db.query('SELECT * FROM products WHERE status = ?', ['active']);
```

### ✅ Do: Use centralized query helpers

```javascript
// Good - Use centralized query helpers
import { db } from '../db.js';

// In db.js
export const getActiveProducts = async () => {
  return await db.query('SELECT * FROM products WHERE status = ?', ['active']);
};

// In inventoryService.js
const products = await db.getActiveProducts();

// In reportService.js
const products = await db.getActiveProducts();
```

---

## 6. Constants - DRY Approach

### ❌ Don't: Hardcode values

```javascript
// Bad - Hardcoded values repeated
if (user.role === 'admin') { /* ... */ }
if (user.role === 'admin') { /* ... */ }

if (status === 'pending') { /* ... */ }
if (status === 'pending') { /* ... */ }
```

### ✅ Do: Use centralized constants

```javascript
// Good - Use centralized constants
// In constants.js
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  PHARMACIST: 'pharmacist',
};

export const STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// In code
import { ROLES, STATUSES } from '../constants.js';

if (user.role === ROLES.ADMIN) { /* ... */ }
if (status === STATUSES.PENDING) { /* ... */ }
```

---

## 7. Hooks - DRY Approach (Frontend)

### ❌ Don't: Repeat state logic

```tsx
// Bad - State logic repeated in multiple components
// In SalesPage.tsx
const [sales, setSales] = useState([]);
const [loading, setLoading] = useState(false);
const fetchSales = async () => { /* ... */ };

// In SalesReportPage.tsx
const [sales, setSales] = useState([]);
const [loading, setLoading] = useState(false);
const fetchSales = async () => { /* ... */ };
```

### ✅ Do: Create custom hooks

```tsx
// Good - Create custom hook
// In hooks/useSales.ts
export const useSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSales = async (filters) => {
    setLoading(true);
    const data = await trpc.sales.list.useQuery(filters);
    setSales(data);
    setLoading(false);
  };

  return { sales, loading, fetchSales };
};

// In SalesPage.tsx
const { sales, loading, fetchSales } = useSales();

// In SalesReportPage.tsx
const { sales, loading, fetchSales } = useSales();
```

---

## 8. Testing - DRY Approach

### ❌ Don't: Repeat test setup

```javascript
// Bad - Test setup repeated
describe('Sales', () => {
  it('should process sale', () => {
    const sale = { items: [], total: 0 };
    const result = processSale(sale);
    expect(result).toBeDefined();
  });
});

describe('Inventory', () => {
  it('should update stock', () => {
    const sale = { items: [], total: 0 };
    const result = updateStock(sale);
    expect(result).toBeDefined();
  });
});
```

### ✅ Do: Use test utilities

```javascript
// Good - Use test utilities
// In testUtils.js
export const createMockSale = (overrides = {}) => ({
  items: [],
  total: 0,
  ...overrides,
});

// In tests
import { createMockSale } from './testUtils.js';

describe('Sales', () => {
  it('should process sale', () => {
    const sale = createMockSale();
    const result = processSale(sale);
    expect(result).toBeDefined();
  });
});

describe('Inventory', () => {
  it('should update stock', () => {
    const sale = createMockSale();
    const result = updateStock(sale);
    expect(result).toBeDefined();
  });
});
```

---

## 9. Code Review Checklist for DRY

When reviewing code, check for:

- [ ] No duplicate error handling - use centralized error classes
- [ ] No duplicate validation logic - use centralized validators
- [ ] No duplicate logging - use centralized logger
- [ ] No duplicate components (frontend) - use reusable components
- [ ] No duplicate query logic - use centralized query helpers
- [ ] No hardcoded values - use constants
- [ ] No duplicate state logic (frontend) - use custom hooks
- [ ] Consistent naming conventions across modules
- [ ] Proper use of inheritance and composition
- [ ] Exported utilities from index files for easy importing

---

## 10. DRY Refactoring Checklist

When refactoring for DRY:

- [ ] Identify repeated code patterns
- [ ] Extract into reusable functions/components
- [ ] Create centralized utilities
- [ ] Update imports in all files using the pattern
- [ ] Remove duplicate code
- [ ] Add tests for extracted utilities
- [ ] Document usage in this guide
- [ ] Update code review checklist if needed

---

## Summary

Key principles for maintaining DRY in the Pharmacy POS System:

1. **Centralize** - Create utilities for common patterns
2. **Reuse** - Import and use utilities instead of duplicating
3. **Document** - Add examples in this guide
4. **Test** - Ensure utilities work correctly
5. **Review** - Check for DRY violations during code review

By following these guidelines, we maintain a clean, maintainable, and scalable codebase.

---

*This guide is part of the Pharmacy POS System development standards.*

# Pharmacy POS System - Reusable Component Library

This document outlines the reusable components built following the DRY (Don't Repeat Yourself) principle. These components are the building blocks for all UI pages and features in the Pharmacy POS System.

## Overview

The component library is organized into the following categories:

1. **Form Components** - Input fields, selects, and form utilities
2. **Data Display Components** - Tables, cards, and data visualization
3. **RBAC Components** - Role-based access control and route protection
4. **Layout Components** - Page layouts and structure

All components are located in `client/src/components/common/` and exported from `client/src/components/common/index.ts`.

---

## Form Components

### FormInput

A reusable input component that combines label, input field, and error message.

**Props:**
- `label?: string` - Label text displayed above input
- `name: string` - Input name attribute
- `type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'time'` - Input type
- `placeholder?: string` - Placeholder text
- `value?: string | number` - Current value
- `onChange?: (e) => void` - Change handler
- `error?: string` - Error message to display
- `required?: boolean` - Show required indicator
- `disabled?: boolean` - Disable input
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { FormInput } from '@/components/common';

<FormInput
  label="Email Address"
  name="email"
  type="email"
  placeholder="user@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  required
/>
```

### FormSelect

A reusable select component that combines label, dropdown, and error message.

**Props:**
- `label?: string` - Label text
- `name: string` - Select name attribute
- `options: Array<{ value: string | number; label: string }>` - Available options
- `value?: string | number` - Current value
- `onChange?: (value: string) => void` - Change handler
- `placeholder?: string` - Placeholder text
- `error?: string` - Error message
- `required?: boolean` - Show required indicator
- `disabled?: boolean` - Disable select
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { FormSelect } from '@/components/common';

<FormSelect
  label="User Role"
  name="role"
  options={[
    { value: 'cashier', label: 'Cashier' },
    { value: 'pharmacist', label: 'Pharmacist' },
    { value: 'manager', label: 'Branch Manager' },
  ]}
  value={selectedRole}
  onChange={(value) => setSelectedRole(value)}
  required
/>
```

---

## Data Display Components

### DataTable

A powerful, reusable table component with sorting, pagination, and custom rendering.

**Props:**
- `columns: Array<Column<T>>` - Column definitions
  - `key: keyof T` - Data key
  - `header: string` - Column header text
  - `render?: (value, row) => ReactNode` - Custom render function
  - `sortable?: boolean` - Enable sorting
  - `width?: string` - Column width
- `data: T[]` - Table data
- `pageSize?: number` - Items per page (default: 10)
- `onRowClick?: (row: T) => void` - Row click handler
- `loading?: boolean` - Show loading state
- `emptyMessage?: string` - Message when no data
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { DataTable, Column } from '@/components/common';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const columns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  {
    key: 'role',
    header: 'Role',
    render: (value) => <span className="capitalize">{value}</span>,
  },
];

<DataTable
  columns={columns}
  data={users}
  pageSize={15}
  onRowClick={(user) => navigateToUserDetail(user.id)}
  loading={isLoading}
/>
```

### PageCard

A reusable card component for sections and pages with optional header and action.

**Props:**
- `title?: string` - Card title
- `description?: string` - Card description
- `children: ReactNode` - Card content
- `className?: string` - Additional CSS classes
- `headerAction?: ReactNode` - Action element in header (e.g., button)

**Usage:**
```tsx
import { PageCard } from '@/components/common';

<PageCard
  title="Sales Report"
  description="Daily sales summary"
  headerAction={<Button onClick={handleExport}>Export</Button>}
>
  <div>Report content here</div>
</PageCard>
```

---

## RBAC Components

### RoleGuard

A component that conditionally renders content based on user role.

**Props:**
- `roles: string[]` - Required roles
- `children: ReactNode` - Content to render if user has role
- `fallback?: ReactNode` - Fallback content if user doesn't have role

**Usage:**
```tsx
import { RoleGuard } from '@/components/common';

<RoleGuard roles={['admin', 'branch_manager']}>
  <Button>Approve Transfer</Button>
</RoleGuard>

<RoleGuard
  roles={['admin']}
  fallback={<p>You don't have permission</p>}
>
  <AdminPanel />
</RoleGuard>
```

### useHasRole Hook

A hook to check if the current user has a specific role.

**Usage:**
```tsx
import { useHasRole } from '@/components/common';

const hasAdminRole = useHasRole(['admin']);

if (hasAdminRole) {
  // Show admin features
}
```

### useHasPermission Hook

A hook to check if the current user has permission for a specific action.

**Supported Permissions:**
- `view_dashboard` - View dashboards
- `process_sale` - Process sales
- `manage_inventory` - Manage inventory
- `approve_transfer` - Approve transfers
- `approve_credit` - Approve credit
- `manage_users` - Manage users
- `view_reports` - View reports
- `process_claims` - Process insurance claims

**Usage:**
```tsx
import { useHasPermission } from '@/components/common';

const canApprovTransfer = useHasPermission('approve_transfer');

if (canApproveTransfer) {
  // Show approve button
}
```

### ProtectedRoute

A component that protects routes and ensures user is authenticated and has required role.

**Props:**
- `children: ReactNode` - Route content
- `requiredRoles?: string[]` - Required roles
- `fallback?: ReactNode` - Fallback if access denied

**Usage:**
```tsx
import { ProtectedRoute } from '@/components/common';

<Route path="/admin">
  <ProtectedRoute requiredRoles={['admin']}>
    <AdminPage />
  </ProtectedRoute>
</Route>
```

---

## Layout Components

### DashboardLayout

A pre-built dashboard layout with sidebar navigation (already provided by template).

**Features:**
- Responsive sidebar navigation
- User profile section
- Logout functionality
- Main content area

**Usage:**
```tsx
import { DashboardLayout } from '@/components/DashboardLayout';

<DashboardLayout>
  <div>Dashboard content</div>
</DashboardLayout>
```

---

## Best Practices

### 1. Component Composition

Compose larger components from smaller reusable ones:

```tsx
// ❌ Bad - Repeating form structure
<div>
  <Label>Name</Label>
  <Input />
  <p className="text-red-500">Error</p>
</div>

// ✅ Good - Using FormInput component
<FormInput label="Name" name="name" error={error} />
```

### 2. Prop Naming

Keep prop names consistent across components:

```tsx
// ✅ Good - Consistent naming
<FormInput value={name} onChange={setName} />
<FormSelect value={role} onChange={setRole} />
```

### 3. Error Handling

All form components support error display:

```tsx
<FormInput
  label="Email"
  name="email"
  value={email}
  onChange={setEmail}
  error={errors.email}
/>
```

### 4. Accessibility

All components include proper accessibility attributes:

- Labels linked to inputs via `htmlFor`
- ARIA attributes where needed
- Keyboard navigation support
- Focus management

### 5. Styling

Use Tailwind CSS classes for consistency:

```tsx
// ✅ Good - Using Tailwind
<div className="space-y-4 p-6">
  <FormInput label="Name" name="name" />
</div>

// ❌ Bad - Custom CSS
<div style={{ padding: '24px' }}>
  <FormInput label="Name" name="name" />
</div>
```

---

## Adding New Components

When adding new reusable components:

1. Create component file in `client/src/components/common/`
2. Export from `client/src/components/common/index.ts`
3. Document in this file with props and usage examples
4. Use TypeScript for type safety
5. Include JSDoc comments in code
6. Follow existing component patterns

---

## Component Library Maintenance

To keep the component library clean and maintainable:

- Review components regularly for unused props
- Consolidate similar components
- Keep components focused on a single responsibility
- Test components thoroughly
- Document changes in this file

---

*This document is part of the Pharmacy POS System Procedures Manual.*

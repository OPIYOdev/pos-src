/**
 * Common Reusable Components Library
 * DRY principle - All components exported from this index for easy importing
 */

export { FormInput } from './FormInput';
export { FormSelect } from './FormSelect';
export { DataTable } from './DataTable';
export type { Column } from './DataTable';
export { RoleGuard, useHasRole, useHasPermission } from './RoleGuard';
export { ProtectedRoute } from './ProtectedRoute';
export { PageCard } from './PageCard';

import { useAuth } from '@/contexts/AuthContext';

/**
 * Permission matrix - maps roles to permissions
 * This should be synced with backend permission system
 */
const PERMISSION_MATRIX: Record<string, string[]> = {
  admin: [
    'view_dashboard',
    'manage_users',
    'manage_branches',
    'view_reports',
    'approve_transfers',
    'approve_claims',
    'manage_settings',
    'view_audit_logs',
    'create_pos_sale',
    'process_grn',
    'manage_inventory',
    'process_prescription',
    'dispense_drug',
    'process_insurance_claim',
    'reconcile_cash',
    'view_financials',
  ],
  user: [
    'view_dashboard',
    'create_pos_sale',
    'process_grn',
    'manage_inventory',
    'process_prescription',
    'dispense_drug',
    'process_insurance_claim',
    'reconcile_cash',
  ],
};

/**
 * Hook to check if user has a specific permission
 */
export const useHasPermission = (permission: string): boolean => {
  const { user } = useAuth();

  if (!user) return false;

  const userPermissions = PERMISSION_MATRIX[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * Hook to check if user has any of the specified permissions
 */
export const useHasAnyPermission = (permissions: string[]): boolean => {
  const { user } = useAuth();

  if (!user) return false;

  const userPermissions = PERMISSION_MATRIX[user.role] || [];
  return permissions.some(permission => userPermissions.includes(permission));
};

/**
 * Hook to check if user has all of the specified permissions
 */
export const useHasAllPermissions = (permissions: string[]): boolean => {
  const { user } = useAuth();

  if (!user) return false;

  const userPermissions = PERMISSION_MATRIX[user.role] || [];
  return permissions.every(permission => userPermissions.includes(permission));
};

/**
 * Hook to check if user has a specific role
 */
export const useHasRole = (roles: string[]): boolean => {
  const { user } = useAuth();

  if (!user) return false;

  return roles.includes(user.role);
};

/**
 * Hook to get all permissions for current user
 */
export const useUserPermissions = (): string[] => {
  const { user } = useAuth();

  if (!user) return [];

  return PERMISSION_MATRIX[user.role] || [];
};

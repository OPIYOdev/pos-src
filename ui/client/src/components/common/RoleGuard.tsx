import React from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGuard component - DRY principle for RBAC
 * Conditionally renders content based on user role
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children, fallback = null }) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook to check if user has permission for a specific role
 */
export const useHasRole = (requiredRoles: string[]): boolean => {
  const { user } = useAuth();
  return user ? requiredRoles.includes(user.role) : false;
};

/**
 * Hook to check multiple permissions
 */
export const useHasPermission = (permission: string): boolean => {
  const { user } = useAuth();
  if (!user) return false;

  // Permission mapping based on roles
  const permissionMap: Record<string, string[]> = {
    'view_dashboard': ['admin', 'branch_manager', 'regional_manager', 'gm'],
    'process_sale': ['cashier', 'dispenser', 'pharmacist', 'branch_manager'],
    'manage_inventory': ['inventory_manager', 'pharmacist', 'branch_manager'],
    'approve_transfer': ['branch_manager', 'regional_manager', 'gm'],
    'approve_credit': ['branch_manager', 'gm'],
    'manage_users': ['admin', 'gm'],
    'view_reports': ['branch_manager', 'accountant', 'regional_manager', 'gm', 'auditor'],
    'process_claims': ['claims_officer', 'pharmacist', 'branch_manager'],
  };

  const allowedRoles = permissionMap[permission] || [];
  return allowedRoles.includes(user.role);
};

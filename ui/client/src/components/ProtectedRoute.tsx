import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHasRole } from '@/hooks/usePermissions';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
}) => {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const hasRequiredRole = useHasRole(requiredRoles);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    useEffect(() => {
      navigate('/login');
    }, [navigate]);
    return null;
  }

  // Authenticated but no required role
  if (requiredRoles.length > 0 && !hasRequiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
};

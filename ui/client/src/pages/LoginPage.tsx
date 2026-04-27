import React, { useEffect } from 'react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { getLoginUrl } from '@/const';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <AuthLayout title="Loading...">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Login"
      subtitle="Sign in to your Pharmacy POS account"
    >
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground text-center">
          Use your Manus credentials to log in to the Pharmacy POS System.
        </p>

        <Button
          onClick={() => {
            window.location.href = getLoginUrl();
          }}
          className="w-full"
          size="lg"
        >
          Sign In with Manus
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          <p>Don't have an account? Contact your administrator.</p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;

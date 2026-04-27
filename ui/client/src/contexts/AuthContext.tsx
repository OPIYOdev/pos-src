import React, { createContext, useContext, useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch current user
  const { data: currentUser, isLoading: isFetching } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (!isFetching) {
      setUser(currentUser || null);
      setLoading(false);
    }
  }, [currentUser, isFetching]);

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Pharmacy POS</h1>
          {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
          {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
        </div>

        {/* Card */}
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>&copy; 2026 Pharmacy POS System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

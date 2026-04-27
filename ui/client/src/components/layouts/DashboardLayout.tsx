import React, { useState } from 'react';
import { Menu, X, LogOut, Settings, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHasRole } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: Array<{
    label: string;
    href: string;
    icon: React.ReactNode;
    roles?: string[];
  }>;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, sidebarItems }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="font-bold text-lg">Pharmacy POS</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {sidebarItems.map((item) => {
            // Check if item is visible for current user role
            if (item.roles && user && !item.roles.includes(user.role)) {
              return null;
            }

            const isActive = location === item.href;

            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-border p-4 space-y-2">
          {sidebarOpen && (
            <div className="text-sm">
              <p className="font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-sm"
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Dashboard</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="p-2 hover:bg-accent rounded-lg transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

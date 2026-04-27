import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  BarChart3,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

const sidebarItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <BarChart3 size={20} />,
  },
  {
    label: 'POS',
    href: '/pos',
    icon: <ShoppingCart size={20} />,
    roles: ['admin', 'user'],
  },
  {
    label: 'Inventory',
    href: '/inventory',
    icon: <Package size={20} />,
  },
  {
    label: 'Prescriptions',
    href: '/prescriptions',
    icon: <FileText size={20} />,
  },
  {
    label: 'Users',
    href: '/users',
    icon: <Users size={20} />,
    roles: ['admin'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings size={20} />,
    roles: ['admin'],
  },
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || 'User'}!</h1>
            <p className="text-muted-foreground">
              Here's your pharmacy dashboard. Role: <span className="font-semibold capitalize">{user?.role}</span>
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">KES 125,430</p>
                </div>
                <TrendingUp className="text-green-500" size={32} />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inventory Items</p>
                  <p className="text-2xl font-bold">2,450</p>
                </div>
                <Package className="text-blue-500" size={32} />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <AlertCircle className="text-orange-500" size={32} />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <ShoppingCart className="text-purple-500" size={32} />
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Sale #12345</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <span className="text-green-600 font-semibold">+KES 5,230</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">GRN #98765</p>
                  <p className="text-sm text-muted-foreground">4 hours ago</p>
                </div>
                <span className="text-blue-600 font-semibold">Received</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Transfer #54321</p>
                  <p className="text-sm text-muted-foreground">6 hours ago</p>
                </div>
                <span className="text-purple-600 font-semibold">In Transit</span>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage;

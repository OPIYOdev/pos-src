import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Download,
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  type: 'sale' | 'expense' | 'refund';
  description: string;
  amount: number;
  balance: number;
}

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <BarChart3 size={20} /> },
  { label: 'POS', href: '/pos', icon: <ShoppingCart size={20} /> },
  { label: 'Inventory', href: '/inventory', icon: <Package size={20} /> },
  { label: 'Prescriptions', href: '/prescriptions', icon: <FileText size={20} /> },
  { label: 'Users', href: '/users', icon: <Users size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

export const FinanceReportingPage: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('2026-04-01');
  const [dateTo, setDateTo] = useState('2026-04-27');
  const [reportType, setReportType] = useState('daily');

  const transactions: Transaction[] = [
    {
      id: '1',
      date: '2026-04-27',
      type: 'sale',
      description: 'Sales - POS Terminal 1',
      amount: 125430,
      balance: 125430,
    },
    {
      id: '2',
      date: '2026-04-27',
      type: 'expense',
      description: 'Supplier Payment - Pharma Ltd',
      amount: -45000,
      balance: 80430,
    },
    {
      id: '3',
      date: '2026-04-26',
      type: 'sale',
      description: 'Sales - POS Terminal 2',
      amount: 98500,
      balance: 178930,
    },
    {
      id: '4',
      date: '2026-04-26',
      type: 'refund',
      description: 'Customer Refund',
      amount: -2500,
      balance: 176430,
    },
  ];

  // Calculate totals
  const totalSales = transactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const totalRefunds = Math.abs(
    transactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const netProfit = totalSales - totalExpenses - totalRefunds;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <TrendingUp className="text-green-500" size={20} />;
      case 'expense':
        return <TrendingDown className="text-red-500" size={20} />;
      case 'refund':
        return <TrendingDown className="text-orange-500" size={20} />;
      default:
        return <DollarSign size={20} />;
    }
  };

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Finance & Reporting</h1>
            <p className="text-muted-foreground">View financial reports and transaction history</p>
          </div>

          {/* Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Sales</p>
              <p className="text-2xl font-bold text-green-600">KES {totalSales.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">+12.5% from last period</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">KES {totalExpenses.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">-5.2% from last period</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Refunds</p>
              <p className="text-2xl font-bold text-orange-600">KES {totalRefunds.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">0.8% of sales</p>
            </Card>
            <Card className="p-6 border-green-200 bg-green-50">
              <p className="text-sm text-green-800 mb-2">Net Profit</p>
              <p className="text-2xl font-bold text-green-900">KES {netProfit.toLocaleString()}</p>
              <p className="text-xs text-green-700 mt-2">+18.3% from last period</p>
            </Card>
          </div>

          {/* Report Filters */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Generate Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full">
                  <Download size={18} className="mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </Card>

          {/* Transaction History */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
            <div className="space-y-3">
              {transactions.map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}KES {Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Balance: KES {transaction.balance.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* KRA Compliance */}
          <Card className="p-6 border-blue-200 bg-blue-50">
            <h2 className="text-lg font-semibold mb-4 text-blue-900">KRA eTIMS Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-800 mb-2">Last Sync</p>
                <p className="font-semibold text-blue-900">2026-04-27 14:30</p>
              </div>
              <div>
                <p className="text-sm text-blue-800 mb-2">Receipts Submitted</p>
                <p className="font-semibold text-blue-900">1,245</p>
              </div>
              <div>
                <p className="text-sm text-blue-800 mb-2">Status</p>
                <p className="font-semibold text-green-600">✓ Compliant</p>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default FinanceReportingPage;

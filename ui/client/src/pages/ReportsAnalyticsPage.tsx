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
  BarChart3,
  Download,
  Calendar,
} from 'lucide-react';

interface ReportData {
  date: string;
  sales: number;
  transactions: number;
  avgTransactionValue: number;
  topProduct: string;
  topProductSales: number;
}

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <BarChart3 size={20} /> },
  { label: 'POS', href: '/pos', icon: <ShoppingCart size={20} /> },
  { label: 'Inventory', href: '/inventory', icon: <Package size={20} /> },
  { label: 'Prescriptions', href: '/prescriptions', icon: <FileText size={20} /> },
  { label: 'Users', href: '/users', icon: <Users size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

export const ReportsAnalyticsPage: React.FC = () => {
  const [reportType, setReportType] = useState('sales');
  const [dateFrom, setDateFrom] = useState('2026-04-01');
  const [dateTo, setDateTo] = useState('2026-04-27');

  const reportData: ReportData[] = [
    {
      date: '2026-04-27',
      sales: 245000,
      transactions: 85,
      avgTransactionValue: 2882,
      topProduct: 'Paracetamol 500mg',
      topProductSales: 45000,
    },
    {
      date: '2026-04-26',
      sales: 198500,
      transactions: 72,
      avgTransactionValue: 2757,
      topProduct: 'Amoxicillin 250mg',
      topProductSales: 38000,
    },
    {
      date: '2026-04-25',
      sales: 212300,
      transactions: 78,
      avgTransactionValue: 2722,
      topProduct: 'Ibuprofen 400mg',
      topProductSales: 42000,
    },
  ];

  // Calculate metrics
  const totalSales = reportData.reduce((sum, d) => sum + d.sales, 0);
  const totalTransactions = reportData.reduce((sum, d) => sum + d.transactions, 0);
  const avgTransactionValue = Math.round(totalSales / totalTransactions);
  const growthRate = ((reportData[0].sales - reportData[2].sales) / reportData[2].sales * 100).toFixed(1);

  const topProducts = [
    { name: 'Paracetamol 500mg', sales: 125000, units: 450 },
    { name: 'Amoxicillin 250mg', sales: 98000, units: 320 },
    { name: 'Ibuprofen 400mg', sales: 87500, units: 280 },
    { name: 'Aspirin 100mg', sales: 65000, units: 210 },
    { name: 'Metformin 500mg', sales: 52000, units: 180 },
  ];

  const topBranches = [
    { name: 'Nairobi Main', sales: 450000, growth: 12.5 },
    { name: 'Westlands', sales: 320000, growth: 8.3 },
    { name: 'Mombasa', sales: 280000, growth: -2.1 },
    { name: 'Kisumu', sales: 195000, growth: 15.2 },
  ];

  return (
    <ProtectedRoute requiredRoles={['admin', 'manager']}>
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">View comprehensive business analytics and reports</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Sales</p>
              <p className="text-2xl font-bold">KES {totalSales.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-2">
                <TrendingUp className="inline mr-1" size={14} />
                +{growthRate}% from start
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Transactions</p>
              <p className="text-2xl font-bold">{totalTransactions}</p>
              <p className="text-xs text-muted-foreground mt-2">Last 3 days</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Avg Transaction Value</p>
              <p className="text-2xl font-bold">KES {avgTransactionValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">Per transaction</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Inventory Value</p>
              <p className="text-2xl font-bold">KES 2.5M</p>
              <p className="text-xs text-green-600 mt-2">
                <TrendingUp className="inline mr-1" size={14} />
                +8.5% from last month
              </p>
            </Card>
          </div>

          {/* Report Filters */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Generate Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                >
                  <option value="sales">Sales Report</option>
                  <option value="inventory">Inventory Report</option>
                  <option value="customers">Customer Report</option>
                  <option value="products">Product Report</option>
                </select>
              </div>
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
              <div className="flex items-end">
                <Button className="w-full">
                  <Download size={18} className="mr-2" />
                  Export PDF
                </Button>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Download size={18} className="mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </Card>

          {/* Daily Sales Report */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Daily Sales Summary</h2>
            <div className="space-y-3">
              {reportData.map((data, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-4">
                    <Calendar size={20} className="text-muted-foreground" />
                    <div>
                      <p className="font-medium">{data.date}</p>
                      <p className="text-sm text-muted-foreground">{data.transactions} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">KES {data.sales.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      Avg: KES {data.avgTransactionValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Products */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Top Products</h2>
              <div className="space-y-3">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.units} units sold</p>
                    </div>
                    <p className="font-semibold">KES {product.sales.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Branches */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Top Branches</h2>
              <div className="space-y-3">
                {topBranches.map((branch, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-sm">{branch.name}</p>
                      <p className={`text-xs ${branch.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {branch.growth > 0 ? '+' : ''}{branch.growth}% growth
                      </p>
                    </div>
                    <p className="font-semibold">KES {branch.sales.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default ReportsAnalyticsPage;

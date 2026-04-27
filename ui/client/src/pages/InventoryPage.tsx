import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormInput } from '@/components/common/FormInput';
import { DataTable } from '@/components/common/DataTable';
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  Search,
  Plus,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  expiryDate: string;
  unitPrice: number;
  status: 'ok' | 'low' | 'expired';
}

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
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings size={20} />,
  },
];

export const InventoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Paracetamol 500mg',
      sku: 'PARA-500',
      quantity: 150,
      reorderLevel: 50,
      expiryDate: '2027-12-31',
      unitPrice: 50,
      status: 'ok',
    },
    {
      id: '2',
      name: 'Amoxicillin 250mg',
      sku: 'AMOX-250',
      quantity: 25,
      reorderLevel: 50,
      expiryDate: '2026-08-15',
      unitPrice: 120,
      status: 'low',
    },
    {
      id: '3',
      name: 'Ibuprofen 400mg',
      sku: 'IBUP-400',
      quantity: 200,
      reorderLevel: 100,
      expiryDate: '2026-06-30',
      unitPrice: 75,
      status: 'ok',
    },
    {
      id: '4',
      name: 'Aspirin 100mg',
      sku: 'ASPI-100',
      quantity: 5,
      reorderLevel: 50,
      expiryDate: '2025-12-31',
      unitPrice: 40,
      status: 'expired',
    },
  ]);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && item.status === filterStatus;
  });

  // Calculate metrics
  const lowStockCount = inventory.filter(i => i.status === 'low').length;
  const expiredCount = inventory.filter(i => i.status === 'expired').length;
  const totalValue = inventory.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const columns = [
    { header: 'Product Name', accessor: 'name', key: 'name' },
    { header: 'SKU', accessor: 'sku', key: 'sku' },
    {
      header: 'Quantity',
      accessor: 'quantity',
      key: 'quantity',
      render: (row: InventoryItem) => (
        <div>
          <p className="font-semibold">{row.quantity}</p>
          <p className="text-xs text-muted-foreground">Reorder: {row.reorderLevel}</p>
        </div>
      ),
    },
    { header: 'Unit Price', accessor: 'unitPrice', key: 'unitPrice', render: (row: InventoryItem) => `KES ${row.unitPrice}` },
    { header: 'Expiry Date', accessor: 'expiryDate', key: 'expiryDate' },
    {
      header: 'Status',
      accessor: 'status',
      key: 'status',
      render: (row: InventoryItem) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium flex items-center gap-1 w-fit ${
            row.status === 'ok'
              ? 'bg-green-100 text-green-800'
              : row.status === 'low'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {row.status === 'low' || row.status === 'expired' ? (
            <AlertTriangle size={14} />
          ) : null}
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
              <p className="text-muted-foreground">Monitor stock levels and manage products</p>
            </div>
            <Button>
              <Plus size={18} className="mr-2" />
              Add Product
            </Button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Items</p>
              <p className="text-2xl font-bold">{inventory.length}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Value</p>
              <p className="text-2xl font-bold">KES {totalValue.toLocaleString()}</p>
            </Card>
            <Card className="p-6 border-yellow-200 bg-yellow-50">
              <p className="text-sm text-yellow-800 mb-2">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-900">{lowStockCount}</p>
            </Card>
            <Card className="p-6 border-red-200 bg-red-50">
              <p className="text-sm text-red-800 mb-2">Expired</p>
              <p className="text-2xl font-bold text-red-900">{expiredCount}</p>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
                <Input
                  placeholder="Search by product name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="ok">OK</option>
                <option value="low">Low Stock</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </Card>

          {/* Inventory Table */}
          <Card className="p-6">
            <DataTable
              columns={columns}
              data={filteredInventory}
              pageSize={10}
            />
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default InventoryPage;

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
  Edit,
  Eye,
  BarChart3,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  creditLimit: number;
  creditUsed: number;
  status: 'active' | 'suspended';
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

export const CustomerPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    creditLimit: 50000,
  });

  // Mock customers
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '0712345678',
      creditLimit: 50000,
      creditUsed: 15000,
      status: 'active',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '0787654321',
      creditLimit: 75000,
      creditUsed: 45000,
      status: 'active',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '0798765432',
      creditLimit: 30000,
      creditUsed: 30000,
      status: 'suspended',
    },
  ]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleAddCustomer = () => {
    const newCustomer: Customer = {
      id: String(customers.length + 1),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      creditLimit: formData.creditLimit,
      creditUsed: 0,
      status: 'active',
    };

    setCustomers([...customers, newCustomer]);
    setFormData({ name: '', email: '', phone: '', creditLimit: 50000 });
    setShowForm(false);
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Credit',
      accessor: 'creditUsed',
      render: (row: Customer) => (
        <div>
          <p className="text-sm">
            KES {row.creditUsed.toLocaleString()} / {row.creditLimit.toLocaleString()}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className={`h-2 rounded-full ${
                row.creditUsed / row.creditLimit > 0.8 ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${(row.creditUsed / row.creditLimit) * 100}%` }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row: Customer) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            row.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row: Customer) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Eye size={16} />
          </Button>
          <Button size="sm" variant="outline">
            <Edit size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Customer Management</h1>
              <p className="text-muted-foreground">Manage customer accounts and credit</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus size={18} className="mr-2" />
              New Customer
            </Button>
          </div>

          {/* Add Customer Form */}
          {showForm && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Add New Customer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                />
                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
                <FormInput
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
                <FormInput
                  label="Credit Limit (KES)"
                  name="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, creditLimit: parseInt(e.target.value) })
                  }
                  placeholder="Enter credit limit"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleAddCustomer}>Save Customer</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Search */}
          <Card className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* Customers Table */}
          <Card className="p-6">
            <DataTable
              columns={columns}
              data={filteredCustomers}
              pageSize={10}
            />
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default CustomerPage;

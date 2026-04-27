import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormInput } from '@/components/common/FormInput';
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'dispenser' | 'pharmacist';
  branch: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <BarChart3 size={20} /> },
  { label: 'POS', href: '/pos', icon: <ShoppingCart size={20} /> },
  { label: 'Inventory', href: '/inventory', icon: <Package size={20} /> },
  { label: 'Prescriptions', href: '/prescriptions', icon: <FileText size={20} /> },
  { label: 'Users', href: '/users', icon: <Users size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

export const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@pharmacy.com',
      role: 'admin',
      branch: 'Nairobi Main',
      status: 'active',
      lastLogin: '2026-04-27 10:30',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@pharmacy.com',
      role: 'manager',
      branch: 'Westlands',
      status: 'active',
      lastLogin: '2026-04-27 09:15',
    },
    {
      id: '3',
      name: 'Bob Wilson',
      email: 'bob@pharmacy.com',
      role: 'cashier',
      branch: 'Nairobi Main',
      status: 'active',
      lastLogin: '2026-04-26 16:45',
    },
    {
      id: '4',
      name: 'Alice Brown',
      email: 'alice@pharmacy.com',
      role: 'dispenser',
      branch: 'Mombasa',
      status: 'inactive',
      lastLogin: '2026-04-20 14:20',
    },
    {
      id: '5',
      name: 'Dr. Charles',
      email: 'charles@pharmacy.com',
      role: 'pharmacist',
      branch: 'Nairobi Main',
      status: 'active',
      lastLogin: '2026-04-27 11:00',
    },
  ]);

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'pharmacist':
        return 'bg-green-100 text-green-800';
      case 'dispenser':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? (
      <CheckCircle className="text-green-500" size={20} />
    ) : (
      <AlertCircle className="text-red-500" size={20} />
    );
  };

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">User Management</h1>
              <p className="text-muted-foreground">Manage system users and permissions</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus size={18} className="mr-2" />
              Add User
            </Button>
          </div>

          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'active').length}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Admins</p>
              <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Pharmacists</p>
              <p className="text-2xl font-bold">{users.filter(u => u.role === 'pharmacist').length}</p>
            </Card>
          </div>

          {/* Add User Form */}
          {showForm && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Add New User</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Full Name" name="name" placeholder="Enter full name" />
                <FormInput label="Email" name="email" type="email" placeholder="Enter email" />
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg">
                    <option>Select role</option>
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>Pharmacist</option>
                    <option>Dispenser</option>
                    <option>Cashier</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Branch</label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg">
                    <option>Select branch</option>
                    <option>Nairobi Main</option>
                    <option>Westlands</option>
                    <option>Mombasa</option>
                    <option>Kisumu</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button>Create User</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Filters */}
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="dispenser">Dispenser</option>
                <option value="cashier">Cashier</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="p-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Branch</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Last Login</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{user.branch}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(user.status)}
                        <span className={user.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{user.lastLogin}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit size={16} />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default UsersPage;

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
  CheckCircle,
  Clock,
  Truck,
  BarChart3,
} from 'lucide-react';

interface TransferRequest {
  id: string;
  requestNumber: string;
  fromBranch: string;
  toBranch: string;
  items: Array<{ product: string; quantity: number }>;
  status: 'pending' | 'approved' | 'in_transit' | 'received';
  requestDate: string;
  expectedDelivery: string;
}

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <BarChart3 size={20} /> },
  { label: 'POS', href: '/pos', icon: <ShoppingCart size={20} /> },
  { label: 'Inventory', href: '/inventory', icon: <Package size={20} /> },
  { label: 'Prescriptions', href: '/prescriptions', icon: <FileText size={20} /> },
  { label: 'Users', href: '/users', icon: <Users size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

export const TransferRequestPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const [transfers, setTransfers] = useState<TransferRequest[]>([
    {
      id: '1',
      requestNumber: 'TR-2026-001',
      fromBranch: 'Nairobi Main',
      toBranch: 'Westlands Branch',
      items: [
        { product: 'Paracetamol 500mg', quantity: 100 },
        { product: 'Amoxicillin 250mg', quantity: 50 },
      ],
      status: 'approved',
      requestDate: '2026-04-20',
      expectedDelivery: '2026-04-25',
    },
    {
      id: '2',
      requestNumber: 'TR-2026-002',
      fromBranch: 'Mombasa Branch',
      toBranch: 'Kisumu Branch',
      items: [
        { product: 'Ibuprofen 400mg', quantity: 200 },
      ],
      status: 'in_transit',
      requestDate: '2026-04-22',
      expectedDelivery: '2026-04-27',
    },
    {
      id: '3',
      requestNumber: 'TR-2026-003',
      fromBranch: 'Nairobi Main',
      toBranch: 'Karen Branch',
      items: [
        { product: 'Aspirin 100mg', quantity: 150 },
      ],
      status: 'pending',
      requestDate: '2026-04-25',
      expectedDelivery: '2026-04-28',
    },
  ]);

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch =
      t.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.fromBranch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.toBranch.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && t.status === filterStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'in_transit':
        return <Truck className="text-blue-500" size={20} />;
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Calculate metrics
  const totalRequests = transfers.length;
  const pendingRequests = transfers.filter(t => t.status === 'pending').length;
  const inTransitRequests = transfers.filter(t => t.status === 'in_transit').length;

  return (
    <ProtectedRoute>
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Multi-Branch Transfers</h1>
              <p className="text-muted-foreground">Manage stock transfers between branches</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus size={18} className="mr-2" />
              New Transfer
            </Button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Transfers</p>
              <p className="text-2xl font-bold">{totalRequests}</p>
            </Card>
            <Card className="p-6 border-yellow-200 bg-yellow-50">
              <p className="text-sm text-yellow-800 mb-2">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingRequests}</p>
            </Card>
            <Card className="p-6 border-blue-200 bg-blue-50">
              <p className="text-sm text-blue-800 mb-2">In Transit</p>
              <p className="text-2xl font-bold text-blue-900">{inTransitRequests}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Completed</p>
              <p className="text-2xl font-bold">{transfers.filter(t => t.status === 'received').length}</p>
            </Card>
          </div>

          {/* New Transfer Form */}
          {showForm && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Create Transfer Request</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="From Branch"
                  name="fromBranch"
                  placeholder="Select source branch"
                />
                <FormInput
                  label="To Branch"
                  name="toBranch"
                  placeholder="Select destination branch"
                />
                <FormInput
                  label="Product"
                  name="product"
                  placeholder="Select product"
                />
                <FormInput
                  label="Quantity"
                  name="quantity"
                  type="number"
                  placeholder="Enter quantity"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <Button>Create Transfer</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Filters */}
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by request number or branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in_transit">In Transit</option>
                <option value="received">Received</option>
              </select>
            </div>
          </Card>

          {/* Transfer Requests List */}
          <div className="space-y-4">
            {filteredTransfers.map(transfer => (
              <Card key={transfer.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(transfer.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{transfer.requestNumber}</h3>
                      <p className="text-sm text-muted-foreground">
                        {transfer.fromBranch} → {transfer.toBranch}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transfer.status)}`}>
                    {transfer.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Request Date</p>
                    <p className="font-medium">{transfer.requestDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Expected Delivery</p>
                    <p className="font-medium">{transfer.expectedDelivery}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Items</p>
                    <p className="font-medium">{transfer.items.length} products</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Items:</p>
                  <div className="space-y-1">
                    {transfer.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground pl-4">
                        • {item.product} - {item.quantity} units
                      </div>
                    ))}
                  </div>
                </div>

                {transfer.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm">Approve</Button>
                    <Button size="sm" variant="outline">
                      Reject
                    </Button>
                  </div>
                )}

                {transfer.status === 'approved' && (
                  <Button size="sm">Dispatch</Button>
                )}

                {transfer.status === 'in_transit' && (
                  <Button size="sm">Mark as Received</Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default TransferRequestPage;

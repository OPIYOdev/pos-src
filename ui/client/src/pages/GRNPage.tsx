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
  BarChart3,
} from 'lucide-react';

interface GRNItem {
  id: string;
  poNumber: string;
  supplier: string;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  batchNumber: string;
  expiryDate: string;
  status: 'pending' | 'received' | 'verified';
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

export const GRNPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [grns, setGrns] = useState<GRNItem[]>([
    {
      id: '1',
      poNumber: 'PO-2026-001',
      supplier: 'Pharma Supplies Ltd',
      productName: 'Paracetamol 500mg',
      quantity: 500,
      receivedQuantity: 500,
      batchNumber: 'BATCH-001',
      expiryDate: '2027-12-31',
      status: 'verified',
    },
    {
      id: '2',
      poNumber: 'PO-2026-002',
      supplier: 'Med Distributors',
      productName: 'Amoxicillin 250mg',
      quantity: 200,
      receivedQuantity: 190,
      batchNumber: 'BATCH-002',
      expiryDate: '2026-08-15',
      status: 'received',
    },
    {
      id: '3',
      poNumber: 'PO-2026-003',
      supplier: 'Health Plus',
      productName: 'Ibuprofen 400mg',
      quantity: 300,
      receivedQuantity: 0,
      batchNumber: '',
      expiryDate: '',
      status: 'pending',
    },
  ]);

  const [formData, setFormData] = useState({
    poNumber: '',
    supplier: '',
    productName: '',
    quantity: 0,
  });

  const handleAddGRN = () => {
    const newGRN: GRNItem = {
      id: String(grns.length + 1),
      poNumber: formData.poNumber,
      supplier: formData.supplier,
      productName: formData.productName,
      quantity: formData.quantity,
      receivedQuantity: 0,
      batchNumber: '',
      expiryDate: '',
      status: 'pending',
    };

    setGrns([...grns, newGRN]);
    setFormData({ poNumber: '', supplier: '', productName: '', quantity: 0 });
    setShowForm(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'received':
        return <Clock className="text-blue-500" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'received':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">GRN Processing</h1>
              <p className="text-muted-foreground">Manage goods received notes and inventory</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus size={18} className="mr-2" />
              New GRN
            </Button>
          </div>

          {/* Add GRN Form */}
          {showForm && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Create Purchase Order</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="PO Number"
                  name="poNumber"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  placeholder="e.g., PO-2026-001"
                />
                <FormInput
                  label="Supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Enter supplier name"
                />
                <FormInput
                  label="Product Name"
                  name="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="Enter product name"
                />
                <FormInput
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleAddGRN}>Create PO</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* GRN List */}
          <div className="space-y-4">
            {grns.map(grn => (
              <Card key={grn.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(grn.status)}
                    <div>
                      <h3 className="font-semibold">{grn.poNumber}</h3>
                      <p className="text-sm text-muted-foreground">{grn.supplier}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      grn.status
                    )}`}
                  >
                    {grn.status.charAt(0).toUpperCase() + grn.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Product</p>
                    <p className="font-medium">{grn.productName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Expected Qty</p>
                    <p className="font-medium">{grn.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Received Qty</p>
                    <p className="font-medium">{grn.receivedQuantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Batch Number</p>
                    <p className="font-medium">{grn.batchNumber || '-'}</p>
                  </div>
                </div>

                {grn.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm">Receive Goods</Button>
                    <Button size="sm" variant="outline">
                      Cancel PO
                    </Button>
                  </div>
                )}

                {grn.status === 'received' && (
                  <div className="flex gap-2">
                    <Button size="sm">Verify & Accept</Button>
                    <Button size="sm" variant="outline">
                      Report Discrepancy
                    </Button>
                  </div>
                )}

                {grn.status === 'verified' && (
                  <div className="text-sm text-green-600">✓ Goods verified and added to inventory</div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default GRNPage;

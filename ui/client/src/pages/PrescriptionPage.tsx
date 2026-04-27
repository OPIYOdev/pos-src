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
  Eye,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

interface Prescription {
  id: string;
  patientName: string;
  prescribedBy: string;
  prescriptionDate: string;
  expiryDate: string;
  status: 'pending' | 'dispensed' | 'expired';
  items: Array<{ drug: string; dosage: string; quantity: number }>;
}

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <BarChart3 size={20} /> },
  { label: 'POS', href: '/pos', icon: <ShoppingCart size={20} /> },
  { label: 'Inventory', href: '/inventory', icon: <Package size={20} /> },
  { label: 'Prescriptions', href: '/prescriptions', icon: <FileText size={20} /> },
  { label: 'Users', href: '/users', icon: <Users size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

export const PrescriptionPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: '1',
      patientName: 'John Doe',
      prescribedBy: 'Dr. Smith',
      prescriptionDate: '2026-04-20',
      expiryDate: '2026-07-20',
      status: 'pending',
      items: [
        { drug: 'Paracetamol 500mg', dosage: '1 tablet x 3 daily', quantity: 30 },
        { drug: 'Amoxicillin 250mg', dosage: '1 capsule x 3 daily', quantity: 21 },
      ],
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      prescribedBy: 'Dr. Johnson',
      prescriptionDate: '2026-04-15',
      expiryDate: '2026-07-15',
      status: 'dispensed',
      items: [
        { drug: 'Ibuprofen 400mg', dosage: '1 tablet x 2 daily', quantity: 60 },
      ],
    },
    {
      id: '3',
      patientName: 'Bob Wilson',
      prescribedBy: 'Dr. Brown',
      prescriptionDate: '2025-12-20',
      expiryDate: '2026-03-20',
      status: 'expired',
      items: [
        { drug: 'Aspirin 100mg', dosage: '1 tablet daily', quantity: 30 },
      ],
    },
  ]);

  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesSearch = p.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && p.status === filterStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'dispensed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'expired':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <FileText className="text-blue-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dispensed':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Prescription Management</h1>
              <p className="text-muted-foreground">Manage and dispense prescriptions</p>
            </div>
            <Button>
              <Plus size={18} className="mr-2" />
              New Prescription
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by patient name..."
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
                <option value="dispensed">Dispensed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </Card>

          {/* Prescriptions List */}
          <div className="space-y-4">
            {filteredPrescriptions.map(prescription => (
              <Card key={prescription.id} className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(prescription.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{prescription.patientName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Prescribed by: {prescription.prescribedBy}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prescription.status)}`}>
                    {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Prescription Date</p>
                    <p className="font-medium">{prescription.prescriptionDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Expiry Date</p>
                    <p className="font-medium">{prescription.expiryDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Items</p>
                    <p className="font-medium">{prescription.items.length} drugs</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Prescribed Drugs:</p>
                  <div className="space-y-2">
                    {prescription.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground pl-4">
                        • {item.drug} - {item.dosage} ({item.quantity} units)
                      </div>
                    ))}
                  </div>
                </div>

                {prescription.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setSelectedPrescription(prescription)}>
                      <Eye size={16} className="mr-2" />
                      Dispense
                    </Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                )}

                {prescription.status === 'dispensed' && (
                  <Button size="sm" variant="outline">
                    <Eye size={16} className="mr-2" />
                    View Receipt
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default PrescriptionPage;

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
  AlertCircle,
  BarChart3,
} from 'lucide-react';

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  patientName: string;
  provider: string;
  claimAmount: number;
  approvedAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  submissionDate: string;
}

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <BarChart3 size={20} /> },
  { label: 'POS', href: '/pos', icon: <ShoppingCart size={20} /> },
  { label: 'Inventory', href: '/inventory', icon: <Package size={20} /> },
  { label: 'Prescriptions', href: '/prescriptions', icon: <FileText size={20} /> },
  { label: 'Users', href: '/users', icon: <Users size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
];

export const InsuranceClaimsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [claims, setClaims] = useState<InsuranceClaim[]>([
    {
      id: '1',
      claimNumber: 'CLM-2026-001',
      patientName: 'John Doe',
      provider: 'NHIF',
      claimAmount: 5000,
      approvedAmount: 4500,
      status: 'approved',
      submissionDate: '2026-04-20',
    },
    {
      id: '2',
      claimNumber: 'CLM-2026-002',
      patientName: 'Jane Smith',
      provider: 'AAR',
      claimAmount: 8000,
      approvedAmount: 0,
      status: 'pending',
      submissionDate: '2026-04-22',
    },
    {
      id: '3',
      claimNumber: 'CLM-2026-003',
      patientName: 'Bob Wilson',
      provider: 'Britam',
      claimAmount: 3000,
      approvedAmount: 0,
      status: 'rejected',
      submissionDate: '2026-04-15',
    },
    {
      id: '4',
      claimNumber: 'CLM-2026-004',
      patientName: 'Alice Brown',
      provider: 'NHIF',
      claimAmount: 6000,
      approvedAmount: 6000,
      status: 'paid',
      submissionDate: '2026-04-10',
    },
  ]);

  const filteredClaims = claims.filter(c => {
    const matchesSearch =
      c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.claimNumber.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && c.status === filterStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'paid':
        return <CheckCircle className="text-blue-500" size={20} />;
      case 'rejected':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Calculate metrics
  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const totalClaimAmount = claims.reduce((sum, c) => sum + c.claimAmount, 0);
  const totalApprovedAmount = claims.reduce((sum, c) => sum + c.approvedAmount, 0);

  return (
    <ProtectedRoute>
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Insurance Claims</h1>
              <p className="text-muted-foreground">Manage and track insurance claims</p>
            </div>
            <Button>
              <Plus size={18} className="mr-2" />
              New Claim
            </Button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Claims</p>
              <p className="text-2xl font-bold">{totalClaims}</p>
            </Card>
            <Card className="p-6 border-yellow-200 bg-yellow-50">
              <p className="text-sm text-yellow-800 mb-2">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingClaims}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Claimed</p>
              <p className="text-2xl font-bold">KES {totalClaimAmount.toLocaleString()}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Approved</p>
              <p className="text-2xl font-bold text-green-600">KES {totalApprovedAmount.toLocaleString()}</p>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by patient name or claim number..."
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
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </Card>

          {/* Claims List */}
          <div className="space-y-4">
            {filteredClaims.map(claim => (
              <Card key={claim.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(claim.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{claim.claimNumber}</h3>
                      <p className="text-sm text-muted-foreground">{claim.patientName}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(claim.status)}`}>
                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Provider</p>
                    <p className="font-medium">{claim.provider}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Claimed Amount</p>
                    <p className="font-medium">KES {claim.claimAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Approved Amount</p>
                    <p className="font-medium text-green-600">KES {claim.approvedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submission Date</p>
                    <p className="font-medium">{claim.submissionDate}</p>
                  </div>
                </div>

                {claim.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm">View Details</Button>
                    <Button size="sm" variant="outline">
                      Follow Up
                    </Button>
                  </div>
                )}

                {claim.status === 'approved' && (
                  <Button size="sm">Mark as Paid</Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default InsuranceClaimsPage;

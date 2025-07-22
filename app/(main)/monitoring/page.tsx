// app/businesses/monitoring/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Input,
  Chip,
  Select,
  SelectItem,
  Accordion,
  AccordionItem,
  CardBody,
  Progress,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@nextui-org/react";
import { Search, Building2, Eye, ShoppingCart, DollarSign, ChevronDown, AlertTriangle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface BusinessMonitoring {
  id: string;
  name: string;
  owner: {
    name: string | null;
    email: string;
  };
  subscription: {
    status: string;
    plan: {
      name: string;
      maxOffers: number;
    };
  } | null;
  _count: {
    monitoredOffers: number;
  };
  monitoringStats: {
    totalMonitored: number;
    inBuyBox: number;
    notInBuyBox: number;
    reachedMinPrice: number;
    planUtilization: number; // percentage of plan limit used
  };
  lastActivity: string | null;
  createdAt: string;
}

const subscriptionStatusColors: Record<string, "primary" | "success" | "danger" | "warning" | "default"> = {
  TRIAL: "primary",
  ACTIVE: "success",
  CANCELLED: "danger",
  PAST_DUE: "warning",
  EXPIRED: "danger",
  PENDING: "default"
};

interface EditBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessMonitoring | null;
  onUpdate: (businessId: string, data: { name: string; ownerEmail: string }) => Promise<void>;
}

const EditBusinessModal = ({ isOpen, onClose, business, onUpdate }: EditBusinessModalProps) => {
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (business) {
      setName(business.name);
      setOwnerEmail(business.owner.email);
    }
  }, [business]);

  const handleSubmit = async () => {
    if (!business) return;

    setIsLoading(true);
    try {
      await onUpdate(business.id, { name, ownerEmail });
      onClose();
    } catch (error) {
      console.error('Error updating business:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>Edit Business</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Business Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter business name"
            />
            <Input
              label="Owner Email"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="Enter owner email"
            />
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p><strong>Note:</strong> Changing the owner email will transfer the business to that user account. Make sure the email exists in the system.</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!name.trim() || !ownerEmail.trim()}
          >
            Update Business
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface DeleteBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessMonitoring | null;
  onDelete: (businessId: string) => Promise<void>;
}

const DeleteBusinessModal = ({ isOpen, onClose, business, onDelete }: DeleteBusinessModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (!business) return;

    setIsLoading(true);
    try {
      await onDelete(business.id);
      onClose();
      setConfirmText('');
    } catch (error) {
      console.error('Error deleting business:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDeleteEnabled = confirmText === business?.name;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="text-danger">Delete Business</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <h4 className="font-medium text-danger-800 mb-2">⚠️ This action cannot be undone!</h4>
              <p className="text-danger-700 text-sm">
                Deleting this business will permanently remove:
              </p>
              <ul className="list-disc list-inside text-danger-700 text-sm mt-2 ml-2">
                <li>All monitored offers ({business?.monitoringStats.totalMonitored || 0} offers)</li>
                <li>All price adjustments</li>
                <li>Subscription data</li>
                <li>Payment history</li>
                <li>All associated data</li>
              </ul>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">
                To confirm deletion, type the business name: <strong>{business?.name}</strong>
              </p>
              <Input
                placeholder={`Type "${business?.name}" to confirm`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                variant="bordered"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="danger" 
            onPress={handleDelete}
            isLoading={isLoading}
            isDisabled={!isDeleteEnabled}
          >
            Delete Business
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const BusinessCard = ({ 
  business, 
  onEdit, 
  onDelete 
}: { 
  business: BusinessMonitoring;
  onEdit: (business: BusinessMonitoring) => void;
  onDelete: (business: BusinessMonitoring) => void;
}) => {
  const stats = business.monitoringStats;
  const subscription = business.subscription;
  const utilizationColor = stats.planUtilization >= 90 ? 'danger' : 
                          stats.planUtilization >= 70 ? 'warning' : 'success';

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between p-2">
        {/* Action Menu - positioned outside accordion */}
        <div className="flex-1">
          <Accordion>
            <AccordionItem
              key={business.id}
              aria-label={`Business monitoring for ${business.name}`}
              startContent={
                <div className="flex items-center gap-2">
                  {subscription && (
                    <Chip
                      color={subscriptionStatusColors[subscription.status]}
                      variant="flat"
                      size="sm"
                    >
                      {subscription.status}
                    </Chip>
                  )}
                  {stats.planUtilization >= 90 && (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  )}
                </div>
              }
              title={
                <div className="flex flex-col">
                  <span className="text-md font-semibold">{business.name}</span>
                  <span className="text-sm text-gray-500">
                    {business.owner.name || business.owner.email}
                  </span>
                </div>
              }
              subtitle={
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                  <span>{stats.totalMonitored} monitored offers</span>
                  <span>•</span>
                  <span>{stats.inBuyBox} in buy box</span>
                  <span>•</span>
                  <span>{stats.reachedMinPrice} at min price</span>
                </div>
              }
              indicator={<ChevronDown className="w-4 h-4" />}
            >
              <CardBody className="px-2 py-4">
                {/* Plan Utilization */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Plan Utilization</span>
                    <span className="text-sm text-gray-500">
                      {stats.totalMonitored + stats.reachedMinPrice} / {subscription?.plan.maxOffers || 'No limit'}
                    </span>
                  </div>
                  <Progress
                    value={stats.planUtilization}
                    color={utilizationColor}
                    size="sm"
                    className="mb-1"
                  />
                  <p className="text-xs text-gray-500">
                    {stats.planUtilization.toFixed(1)}% of {subscription?.plan.name || 'plan'} limit used
                  </p>
                </div>

                {/* Monitoring Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Eye className="w-4 h-4 text-blue-600 mr-1" />
                    </div>
                    <p className="text-lg font-semibold text-blue-600">{stats.totalMonitored}</p>
                    <p className="text-xs text-gray-600">Monitored</p>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <ShoppingCart className="w-4 h-4 text-green-600 mr-1" />
                    </div>
                    <p className="text-lg font-semibold text-green-600">{stats.inBuyBox}</p>
                    <p className="text-xs text-gray-600">In Buy Box</p>
                  </div>

                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <ShoppingCart className="w-4 h-4 text-red-600 mr-1" />
                    </div>
                    <p className="text-lg font-semibold text-red-600">{stats.notInBuyBox}</p>
                    <p className="text-xs text-gray-600">Not in Buy Box</p>
                  </div>

                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="w-4 h-4 text-amber-600 mr-1" />
                    </div>
                    <p className="text-lg font-semibold text-amber-600">{stats.reachedMinPrice}</p>
                    <p className="text-xs text-gray-600">At Min Price</p>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                  <div>
                    <p className="text-gray-500 mb-1">Owner Email</p>
                    <p className="font-medium">{business.owner.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Plan</p>
                    <p className="font-medium">
                      {subscription?.plan.name || 'No subscription'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Created</p>
                    <p className="font-medium">
                      {format(new Date(business.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Last Activity</p>
                    <p className="font-medium">
                      {business.lastActivity 
                        ? format(new Date(business.lastActivity), 'MMM d, yyyy')
                        : 'No activity'
                      }
                    </p>
                  </div>
                </div>

                {/* Performance Insights */}
                {stats.totalMonitored > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Performance Insights</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>
                        • Buy Box Success: {stats.totalMonitored > 0 ? (stats.inBuyBox / stats.totalMonitored * 100).toFixed(1) : 0}% of monitored offers
                      </p>
                      <p>
                        • Min Price Reached: {stats.reachedMinPrice} offers no longer being optimized
                      </p>
                      <p>
                        • Total Offers: {stats.totalMonitored + stats.reachedMinPrice} ({stats.totalMonitored} monitored + {stats.reachedMinPrice} at min price)
                      </p>
                      {stats.planUtilization >= 90 && (
                        <p className="text-warning">
                          • ⚠️ Approaching plan limit - consider upgrading
                        </p>
                      )}
                      {stats.totalMonitored === 0 && subscription?.status === 'ACTIVE' && (
                        <p className="text-warning">
                          • ⚠️ Active subscription but no monitored offers
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </AccordionItem>
          </Accordion>
        </div>
        
        {/* Action Menu - positioned outside accordion to avoid button nesting */}
        <div className="flex-shrink-0 ml-2">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="z-10"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Business actions">
              <DropdownItem
                key="edit"
                startContent={<Edit className="w-4 h-4" />}
                onClick={() => onEdit(business)}
              >
                Edit Business
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<Trash2 className="w-4 h-4" />}
                onClick={() => onDelete(business)}
              >
                Delete Business
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </Card>
  );
};

export default function BusinessMonitoringPage() {
  const [businesses, setBusinesses] = useState<BusinessMonitoring[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessMonitoring[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessMonitoring | null>(null);
  
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  useEffect(() => {
    fetchBusinessMonitoring();
  }, []);

  useEffect(() => {
    filterAndSortBusinesses();
  }, [searchQuery, statusFilter, sortBy, businesses]);

  const fetchBusinessMonitoring = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/businesses/monitoring');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch business monitoring data');
      }
      
      const data = await response.json();
      setBusinesses(data);
    } catch (error) {
      console.error('Error fetching business monitoring:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBusinesses = () => {
    const filtered = businesses.filter(business => {
      // Search filter
      const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           business.owner.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        switch (statusFilter) {
          case 'active_monitoring':
            matchesStatus = business.monitoringStats.totalMonitored > 0;
            break;
          case 'inactive_monitoring':
            matchesStatus = business.monitoringStats.totalMonitored === 0;
            break;
          case 'high_utilization':
            matchesStatus = business.monitoringStats.planUtilization >= 80;
            break;
          case 'good_buybox_performance':
            matchesStatus = business.monitoringStats.totalMonitored > 0 && 
                          (business.monitoringStats.inBuyBox / business.monitoringStats.totalMonitored) >= 0.7;
            break;
          default:
            matchesStatus = business.subscription?.status === statusFilter;
        }
      }
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'monitored_desc':
          return b.monitoringStats.totalMonitored - a.monitoringStats.totalMonitored;
        case 'buybox_desc':
          return b.monitoringStats.inBuyBox - a.monitoringStats.inBuyBox;
        case 'utilization_desc':
          return b.monitoringStats.planUtilization - a.monitoringStats.planUtilization;
        case 'created_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredBusinesses(filtered);
  };

  const getFilterOptions = () => [
    { key: 'all', label: 'All Businesses' },
    { key: 'ACTIVE', label: 'Active Subscriptions' },
    { key: 'TRIAL', label: 'Trial Subscriptions' },
    { key: 'EXPIRED', label: 'Expired Subscriptions' },
    { key: 'active_monitoring', label: 'Actively Monitoring' },
    { key: 'inactive_monitoring', label: 'Not Monitoring' },
    { key: 'high_utilization', label: 'High Plan Utilization (80%+)' },
    { key: 'good_buybox_performance', label: 'Good Buy Box Performance (70%+)' }
  ];

  const handleEdit = (business: BusinessMonitoring) => {
    setSelectedBusiness(business);
    editModal.onOpen();
  };

  const handleDelete = (business: BusinessMonitoring) => {
    setSelectedBusiness(business);
    deleteModal.onOpen();
  };

  const handleUpdateBusiness = async (businessId: string, data: { name: string; ownerEmail: string }) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update business');
      }

      // Refresh the businesses list
      await fetchBusinessMonitoring();
    } catch (error) {
      console.error('Error updating business:', error);
      throw error;
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete business');
      }

      // Refresh the businesses list
      await fetchBusinessMonitoring();
    } catch (error) {
      console.error('Error deleting business:', error);
      throw error;
    }
  };

  const getSortOptions = () => [
    { key: 'name', label: 'Business Name' },
    { key: 'monitored_desc', label: 'Most Monitored Offers' },
    { key: 'buybox_desc', label: 'Most in Buy Box' },
    { key: 'utilization_desc', label: 'Highest Plan Utilization' },
    { key: 'created_desc', label: 'Newest First' }
  ];

  // Calculate summary stats
  const summaryStats = {
    totalBusinesses: businesses.length,
    activelyMonitoring: businesses.filter(b => b.monitoringStats.totalMonitored > 0).length,
    totalOffersMonitored: businesses.reduce((sum, b) => sum + b.monitoringStats.totalMonitored, 0),
    totalInBuyBox: businesses.reduce((sum, b) => sum + b.monitoringStats.inBuyBox, 0),
    averageBuyBoxRate: businesses.length > 0 
      ? (businesses.reduce((sum, b) => {
          return sum + (b.monitoringStats.totalMonitored > 0 
            ? (b.monitoringStats.inBuyBox / b.monitoringStats.totalMonitored) * 100 
            : 0);
        }, 0) / businesses.filter(b => b.monitoringStats.totalMonitored > 0).length)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="mb-4">
            <Building2 className="w-16 h-16 text-red-400 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Business Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>This could be due to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Database connection issues</li>
              <li>Server maintenance</li>
              <li>Temporary network problems</li>
            </ul>
          </div>
          <Button 
            color="primary" 
            className="mt-6"
            onClick={() => {
              setError(null);
              fetchBusinessMonitoring();
            }}
          >
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">
          Business Monitoring Overview
        </h1>
        <p className="text-gray-600">
          Monitor business engagement and offer tracking performance
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Total Businesses</p>
              <p className="text-xl font-semibold">{summaryStats.totalBusinesses}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Eye className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Actively Monitoring</p>
              <p className="text-xl font-semibold">{summaryStats.activelyMonitoring}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <ShoppingCart className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Total in Buy Box</p>
              <p className="text-xl font-semibold">{summaryStats.totalInBuyBox}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 text-amber-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Avg Buy Box Rate</p>
              <p className="text-xl font-semibold">
                {summaryStats.averageBuyBoxRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search businesses or owners..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="w-4 h-4 text-gray-400" />}
          className="flex-1"
        />
        <Select
          placeholder="Filter by status"
          selectedKeys={statusFilter ? [statusFilter] : []}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-64"
        >
          {getFilterOptions().map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
        <Select
          placeholder="Sort by"
          selectedKeys={sortBy ? [sortBy] : []}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full sm:w-48"
        >
          {getSortOptions().map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Business Cards */}
      <div className="space-y-4">
        {filteredBusinesses.map((business) => (
          <BusinessCard 
            key={business.id} 
            business={business}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        {filteredBusinesses.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No businesses have been created yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditBusinessModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        business={selectedBusiness}
        onUpdate={handleUpdateBusiness}
      />

      {/* Delete Modal */}
      <DeleteBusinessModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        business={selectedBusiness}
        onDelete={handleDeleteBusiness}
      />
    </div>
  );
}
// app/subscriptions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Input,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Accordion,
  AccordionItem,
  Select,
  SelectItem,
  CardBody
} from "@nextui-org/react";
import { Search, Calendar, Edit2, ChevronDown } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { Plan, SubscriptionStatus } from '@prisma/client';
import { Subscription } from '@/types/subscription';

const statusColorMap: Record<SubscriptionStatus, "primary" | "success" | "danger" | "warning"> = {
  [SubscriptionStatus.TRIAL]: "primary",
  [SubscriptionStatus.ACTIVE]: "success",
  [SubscriptionStatus.CANCELLED]: "danger",
  [SubscriptionStatus.PAST_DUE]: "warning",
  [SubscriptionStatus.EXPIRED]: "danger",
  [SubscriptionStatus.PENDING]: "warning"
};

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onUpdate: (id: string, status: SubscriptionStatus, nextBillingDate: string, planId: string) => void;
}

const EditModal = ({ isOpen, onClose, subscription, onUpdate }: EditModalProps) => {
  const [status, setStatus] = useState<SubscriptionStatus>(subscription?.status || SubscriptionStatus.ACTIVE);
  const [nextBillingDate, setNextBillingDate] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subscription) {
      setStatus(subscription.status);
      setNextBillingDate(subscription.nextBillingDate || new Date().toISOString().split('T')[0]);
      setSelectedPlanId(subscription.plan.id);
    }
  }, [subscription]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleUpdate = async () => {
    if (subscription) {
      setIsLoading(true);
      try {
        if (selectedPlanId !== subscription.plan.id) {
          const selectedPlan = plans.find(p => p.id === selectedPlanId);
          if (selectedPlan && selectedPlan.maxOffers < subscription.plan.maxOffers) {
            await adjustMonitoredOffers(subscription.businessId, selectedPlan.maxOffers);
          }
        }

        onUpdate(subscription.id, status, nextBillingDate, selectedPlanId);
        onClose();
      } catch (error) {
        console.error('Error updating subscription:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSetNextMonth = () => {
    setNextBillingDate(prev => {
      const currentDate = prev ? new Date(prev) : new Date();
      const nextMonth = addMonths(currentDate, 1);
      return nextMonth.toISOString().split('T')[0];
    });
  };

  const adjustMonitoredOffers = async (businessId: string, newMaxOffers: number) => {
    const response = await fetch(`/api/businesses/${businessId}/adjust-offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxOffers: newMaxOffers })
    });

    if (!response.ok) {
      throw new Error('Failed to adjust monitored offers');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      classNames={{
        base: "max-h-[90vh] overflow-y-auto"
      }}
    >
      <ModalContent>
        <ModalHeader>Edit Subscription</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Business</p>
              <p className="font-medium">{subscription?.business.name}</p>
            </div>

            <Select
              label="Plan"
              selectedKeys={selectedPlanId ? [selectedPlanId] : []}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} ({plan.maxOffers} offers - ${plan.price})
                </SelectItem>
              ))}
            </Select>
            {selectedPlanId !== subscription?.plan.id && (
              <p className="text-sm text-warning">
                Note: Downgrading will remove excess monitored offers.
              </p>
            )}

            <Select
              label="Status"
              selectedKeys={[status]}
              onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
            >
              {Object.values(SubscriptionStatus).map((statusOption) => (
                <SelectItem key={statusOption} value={statusOption}>
                  {statusOption}
                </SelectItem>
              ))}
            </Select>

            <div>
              <p className="text-sm text-gray-600 mb-2">Next Billing Date</p>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 p-2 border rounded-lg"
                  value={nextBillingDate}
                  onChange={(e) => setNextBillingDate(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={handleSetNextMonth}
                  startContent={<Calendar className="w-4 h-4" />}
                >
                  Next Month
                </Button>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleUpdate}
            isLoading={isLoading}
          >
            Update
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const SubscriptionCard = ({
  subscription,
  onEdit
}: {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
}) => {
  const getDateDisplay = () => {
    if (subscription.status === 'TRIAL') {
      if (!subscription?.trialEndsAt) {
        return 'Trial end date unavailable';
      }
      return `Trial ends: ${format(new Date(subscription.trialEndsAt), 'MMM d, yyyy h:mm a')}`;
    }

    if (subscription.status === 'EXPIRED' && subscription.trialEndsAt) {
      return `Trial ended: ${format(new Date(subscription.trialEndsAt), 'MMM d, yyyy h:mm a')}`;
    }

    if (subscription.status === 'EXPIRED') {
      return subscription.nextBillingDate
        ? `Last billing: ${format(new Date(subscription.nextBillingDate), 'MMM d, yyyy h:mm a')}`
        : 'Last billing date unavailable';
    }

    return subscription.nextBillingDate
      ? `Next billing: ${format(new Date(subscription.nextBillingDate), 'MMM d, yyyy h:mm a')}`
      : 'N/A';
  };

  return (
    <Card className="mb-4">
      <Accordion>
        <AccordionItem
          key={subscription.id}
          aria-label={`Subscription for ${subscription.business.name}`}
          startContent={
            <div className="flex items-center gap-2">
              <Chip
                color={statusColorMap[subscription.status]}
                variant="flat"
                size="sm"
              >
                {subscription.status}
              </Chip>
            </div>
          }
          title={
            <div className="flex flex-col">
              <span className="text-md font-semibold">{subscription.business.name}</span>
              <span className="text-sm text-gray-500">{subscription.plan.name}</span>
            </div>
          }
          subtitle={
            <span className="text-xs text-gray-500">
              {getDateDisplay()}
            </span>
          }
          indicator={<ChevronDown className="w-4 h-4" />}
        >
          <CardBody className="px-2 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Start Date</p>
                <p className="font-medium">
                  {format(new Date(subscription.startDate), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">
                  {subscription.status === 'EXPIRED' ? 'Last Billing' : 'Next Billing'}
                </p>
                <p className="font-medium">
                  {subscription.nextBillingDate
                    ? format(new Date(subscription.nextBillingDate), 'MMM d, yyyy h:mm a')
                    : 'N/A'}
                </p>
              </div>
              {subscription.trialEndsAt && (
                <div>
                  <p className="text-gray-500">Trial {subscription.status === 'TRIAL' ? 'Ends' : 'Ended'}</p>
                  <p className="font-medium">
                    {format(new Date(subscription.trialEndsAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Plan</p>
                <p className="font-medium">{subscription.plan.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Chip
                  color={statusColorMap[subscription.status]}
                  variant="flat"
                  size="sm"
                >
                  {subscription.status}
                </Chip>
              </div>
            </div>

            <Button
              size="sm"
              color="primary"
              className="w-full mt-4"
              onPress={() => onEdit(subscription)}
              startContent={<Edit2 className="w-4 h-4" />}
            >
              Edit Subscription
            </Button>
          </CardBody>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    const filtered = subscriptions.filter(subscription =>
      subscription.business.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSubscriptions(filtered);
  }, [searchQuery, subscriptions]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      const data = await response.json();
      setSubscriptions(data);
      setFilteredSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    onOpen();
  };

  const handleUpdate = async (
    id: string,
    status: SubscriptionStatus,
    nextBillingDate: string,
    planId: string
  ) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, nextBillingDate, planId }),
      });

      if (!response.ok) throw new Error('Failed to update subscription');

      await fetchSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
          Subscriptions
        </h1>
        <Input
          placeholder="Search by business name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="w-4 h-4 text-gray-400" />}
          className="max-w-md"
        />
      </div>

      <div className="space-y-4">
        {filteredSubscriptions.map((subscription) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            onEdit={handleEdit}
          />
        ))}

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No subscriptions found
          </div>
        )}
      </div>

      <EditModal
        isOpen={isOpen}
        onClose={onClose}
        subscription={selectedSubscription}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
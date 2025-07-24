"use client"

import { useEffect, useState } from "react"
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
  DropdownItem,
} from "@nextui-org/react"
import {
  Search,
  Building2,
  Eye,
  ShoppingCart,
  DollarSign,
  ChevronDown,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  Activity,
  Users,
  Filter,
} from "lucide-react"
import { format } from "date-fns"

interface BusinessMonitoring {
  id: string
  name: string
  owner: {
    name: string | null
    email: string
  }
  subscription: {
    status: string
    plan: {
      name: string
      maxOffers: number
    }
  } | null
  _count: {
    monitoredOffers: number
  }
  monitoringStats: {
    totalMonitored: number
    inBuyBox: number
    notInBuyBox: number
    reachedMinPrice: number
    planUtilization: number
  }
  lastActivity: string | null
  createdAt: string
}

const subscriptionStatusColors: Record<string, "primary" | "success" | "danger" | "warning" | "default"> = {
  TRIAL: "primary",
  ACTIVE: "success",
  CANCELLED: "danger",
  PAST_DUE: "warning",
  EXPIRED: "danger",
  PENDING: "default",
}

interface EditBusinessModalProps {
  isOpen: boolean
  onClose: () => void
  business: BusinessMonitoring | null
  onUpdate: (businessId: string, data: { name: string; ownerEmail: string }) => Promise<void>
}

const EditBusinessModal = ({ isOpen, onClose, business, onUpdate }: EditBusinessModalProps) => {
  const [name, setName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (business) {
      setName(business.name)
      setOwnerEmail(business.owner.email)
    }
  }, [business])

  const handleSubmit = async () => {
    if (!business) return
    setIsLoading(true)
    try {
      await onUpdate(business.id, { name, ownerEmail })
      onClose()
    } catch (error) {
      console.error("Error updating business:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      classNames={{
        base: "mx-4",
        backdrop: "bg-black/50 backdrop-blur-sm",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 text-xl font-semibold">Edit Business</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <Input
              label="Business Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter business name"
              variant="bordered"
              classNames={{
                input: "text-sm",
                label: "text-sm font-medium",
              }}
            />
            <Input
              label="Owner Email"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="Enter owner email"
              variant="bordered"
              classNames={{
                input: "text-sm",
                label: "text-sm font-medium",
              }}
            />
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Changing the owner email will transfer the business to that user account. Make
                sure the email exists in the system.
              </p>
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
            className="font-medium"
          >
            Update Business
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

interface DeleteBusinessModalProps {
  isOpen: boolean
  onClose: () => void
  business: BusinessMonitoring | null
  onDelete: (businessId: string) => Promise<void>
}

const DeleteBusinessModal = ({ isOpen, onClose, business, onDelete }: DeleteBusinessModalProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  const handleDelete = async () => {
    if (!business) return
    setIsLoading(true)
    try {
      await onDelete(business.id)
      onClose()
      setConfirmText("")
    } catch (error) {
      console.error("Error deleting business:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isDeleteEnabled = confirmText === business?.name

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      classNames={{
        base: "mx-4",
        backdrop: "bg-black/50 backdrop-blur-sm",
      }}
    >
      <ModalContent>
        <ModalHeader className="text-danger text-xl font-semibold">Delete Business</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                This action cannot be undone!
              </h4>
              <p className="text-red-700 text-sm mb-3">Deleting this business will permanently remove:</p>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1 ml-2">
                <li>All monitored offers ({business?.monitoringStats.totalMonitored || 0} offers)</li>
                <li>All price adjustments</li>
                <li>Subscription data</li>
                <li>Payment history</li>
                <li>All associated data</li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-3">
                To confirm deletion, type the business name: <strong className="text-gray-900">{business?.name}</strong>
              </p>
              <Input
                placeholder={`Type "${business?.name}" to confirm`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                }}
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
            className="font-medium"
          >
            Delete Business
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const BusinessCard = ({
  business,
  onEdit,
  onDelete,
}: {
  business: BusinessMonitoring
  onEdit: (business: BusinessMonitoring) => void
  onDelete: (business: BusinessMonitoring) => void
}) => {
  const stats = business.monitoringStats
  const subscription = business.subscription
  const utilizationColor = stats.planUtilization >= 90 ? "danger" : stats.planUtilization >= 70 ? "warning" : "success"

  const isActivelyMonitored = subscription && ["ACTIVE", "TRIAL"].includes(subscription.status)
  const buyBoxRate = stats.totalMonitored > 0 ? (stats.inBuyBox / stats.totalMonitored) * 100 : 0

  return (
    <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
      <div className="flex items-start justify-between p-1">
        <div className="flex-1">
          <Accordion variant="light" className="px-0">
            <AccordionItem
              key={business.id}
              aria-label={`Business monitoring for ${business.name}`}
              startContent={
                <div className="flex flex-wrap items-center gap-2">
                  {subscription && (
                    <Chip
                      color={subscriptionStatusColors[subscription.status]}
                      variant="flat"
                      size="sm"
                      className="font-medium"
                    >
                      {subscription.status}
                    </Chip>
                  )}
                  {!isActivelyMonitored && (
                    <Chip color="warning" variant="flat" size="sm" className="font-medium">
                      INACTIVE
                    </Chip>
                  )}
                  {stats.planUtilization >= 90 && isActivelyMonitored && (
                    <Chip color="danger" variant="flat" size="sm" startContent={<AlertTriangle className="w-3 h-3" />}>
                      HIGH USAGE
                    </Chip>
                  )}
                </div>
              }
              title={
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold text-gray-900">{business.name}</span>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{business.owner.name || business.owner.email}</span>
                  </div>
                </div>
              }
              subtitle={
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{stats.totalMonitored} offers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="w-4 h-4" />
                    <span>{stats.inBuyBox} in buy box</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{buyBoxRate.toFixed(1)}% success</span>
                  </div>
                </div>
              }
              indicator={<ChevronDown className="w-5 h-5 text-gray-400" />}
              classNames={{
                trigger: "py-4",
                title: "text-left",
                subtitle: "text-left",
              }}
            >
              <CardBody className="px-0 py-6">
                {/* Status Alert */}
                {!isActivelyMonitored && stats.totalMonitored > 0 && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-amber-800">Monitoring Inactive</span>
                    </div>
                    <p className="text-sm text-amber-700">
                      Subscription is {subscription?.status || "missing"}. Offers are not being actively monitored.
                    </p>
                  </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Monitored</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{stats.totalMonitored}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <ShoppingCart className="w-5 h-5 text-green-600" />
                      <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Buy Box</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{stats.inBuyBox}</p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <ShoppingCart className="w-5 h-5 text-red-600" />
                      <span className="text-xs font-medium text-red-600 uppercase tracking-wide">Not in Box</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">{stats.notInBuyBox}</p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Min Price</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">{stats.reachedMinPrice}</p>
                  </div>
                </div>

                {/* Plan Utilization */}
                {isActivelyMonitored && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-900">Plan Utilization</span>
                      <span className="text-sm text-gray-600">
                        {stats.totalMonitored + stats.reachedMinPrice} / {subscription?.plan.maxOffers || "Unlimited"}
                      </span>
                    </div>
                    <Progress
                      value={stats.planUtilization}
                      color={utilizationColor}
                      size="md"
                      className="mb-2"
                      classNames={{
                        track: "bg-gray-200",
                        indicator: "bg-gradient-to-r",
                      }}
                    />
                    <p className="text-sm text-gray-600">
                      {stats.planUtilization.toFixed(1)}% of {subscription?.plan.name || "plan"} limit used
                    </p>
                  </div>
                )}

                {/* Business Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Owner Email</p>
                      <p className="text-sm font-medium text-gray-900">{business.owner.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Plan</p>
                      <p className="text-sm font-medium text-gray-900">
                        {subscription?.plan.name || "No subscription"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(business.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Activity</p>
                      <p className="text-sm font-medium text-gray-900">
                        {business.lastActivity ? format(new Date(business.lastActivity), "MMM d, yyyy") : "No activity"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Insights */}
                {stats.totalMonitored > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Performance Insights
                    </h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>• Buy Box Success Rate: {buyBoxRate.toFixed(1)}% of monitored offers</p>
                      <p>
                        • Total Offers: {stats.totalMonitored + stats.reachedMinPrice} ({stats.totalMonitored} monitored
                        + {stats.reachedMinPrice} at min price)
                      </p>
                      {stats.planUtilization >= 90 && isActivelyMonitored && (
                        <p className="text-amber-700 font-medium">• ⚠️ Approaching plan limit - consider upgrading</p>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Action Menu */}
        <div className="flex-shrink-0 ml-4 mt-4">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-gray-600">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Business actions">
              <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onClick={() => onEdit(business)}>
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
  )
}

export default function BusinessMonitoringPage() {
  const [businesses, setBusinesses] = useState<BusinessMonitoring[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessMonitoring[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessMonitoring | null>(null)

  const editModal = useDisclosure()
  const deleteModal = useDisclosure()

  useEffect(() => {
    fetchBusinessMonitoring()
  }, [])

  useEffect(() => {
    filterAndSortBusinesses()
  }, [searchQuery, statusFilter, sortBy, businesses])

  const fetchBusinessMonitoring = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/admin/businesses/monitoring")
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch business monitoring data")
      }
      const data = await response.json()
      setBusinesses(data)
    } catch (error) {
      console.error("Error fetching business monitoring:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortBusinesses = () => {
    const filtered = businesses.filter((business) => {
      const matchesSearch =
        business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.owner.email.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesStatus = true
      if (statusFilter !== "all") {
        switch (statusFilter) {
          case "active_monitoring":
            matchesStatus = Boolean(
              business.subscription &&
                ["ACTIVE", "TRIAL"].includes(business.subscription.status) &&
                business.monitoringStats.totalMonitored > 0,
            )
            break
          case "inactive_monitoring":
            matchesStatus = Boolean(
              !business.subscription ||
                !["ACTIVE", "TRIAL"].includes(business.subscription?.status || "") ||
                business.monitoringStats.totalMonitored === 0,
            )
            break
          case "high_utilization":
            matchesStatus = Boolean(
              business.monitoringStats.planUtilization >= 80 &&
                business.subscription &&
                ["ACTIVE", "TRIAL"].includes(business.subscription.status),
            )
            break
          case "good_buybox_performance":
            matchesStatus = Boolean(
              business.subscription &&
                ["ACTIVE", "TRIAL"].includes(business.subscription.status) &&
                business.monitoringStats.totalMonitored > 0 &&
                business.monitoringStats.inBuyBox / business.monitoringStats.totalMonitored >= 0.7,
            )
            break
          default:
            matchesStatus = Boolean(business.subscription && business.subscription.status === statusFilter)
        }
      }
      return matchesSearch && matchesStatus
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "monitored_desc":
          return b.monitoringStats.totalMonitored - a.monitoringStats.totalMonitored
        case "buybox_desc":
          return b.monitoringStats.inBuyBox - a.monitoringStats.inBuyBox
        case "utilization_desc":
          return b.monitoringStats.planUtilization - a.monitoringStats.planUtilization
        case "created_desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    setFilteredBusinesses(filtered)
  }

  const getFilterOptions = () => [
    { key: "all", label: "All Businesses" },
    { key: "ACTIVE", label: "Active Subscriptions" },
    { key: "TRIAL", label: "Trial Subscriptions" },
    { key: "EXPIRED", label: "Expired Subscriptions" },
    { key: "active_monitoring", label: "Actively Monitoring" },
    { key: "inactive_monitoring", label: "Not Actively Monitoring" },
    { key: "high_utilization", label: "High Plan Utilization (80%+)" },
    { key: "good_buybox_performance", label: "Good Buy Box Performance (70%+)" },
  ]

  const handleEdit = (business: BusinessMonitoring) => {
    setSelectedBusiness(business)
    editModal.onOpen()
  }

  const handleDelete = (business: BusinessMonitoring) => {
    setSelectedBusiness(business)
    deleteModal.onOpen()
  }

  const handleUpdateBusiness = async (businessId: string, data: { name: string; ownerEmail: string }) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error("Failed to update business")
      }
      await fetchBusinessMonitoring()
    } catch (error) {
      console.error("Error updating business:", error)
      throw error
    }
  }

  const handleDeleteBusiness = async (businessId: string) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete business")
      }
      await fetchBusinessMonitoring()
    } catch (error) {
      console.error("Error deleting business:", error)
      throw error
    }
  }

  const getSortOptions = () => [
    { key: "name", label: "Business Name" },
    { key: "monitored_desc", label: "Most Monitored Offers" },
    { key: "buybox_desc", label: "Most in Buy Box" },
    { key: "utilization_desc", label: "Highest Plan Utilization" },
    { key: "created_desc", label: "Newest First" },
  ]

  const activeBusinesses = businesses.filter(
    (b) => b.subscription && ["ACTIVE", "TRIAL"].includes(b.subscription.status),
  )

  const summaryStats = {
    totalBusinesses: businesses.length,
    activeSubscriptions: activeBusinesses.length,
    activelyMonitoring: activeBusinesses.filter((b) => b.monitoringStats.totalMonitored > 0).length,
    totalOffersMonitored: activeBusinesses.reduce((sum, b) => sum + b.monitoringStats.totalMonitored, 0),
    totalInBuyBox: activeBusinesses.reduce((sum, b) => sum + b.monitoringStats.inBuyBox, 0),
    averageBuyBoxRate: (() => {
      const eligibleBusinesses = activeBusinesses.filter((b) => b.monitoringStats.totalMonitored > 0)
      if (eligibleBusinesses.length === 0) return 0
      const totalRate = eligibleBusinesses.reduce((sum, b) => {
        return sum + (b.monitoringStats.inBuyBox / b.monitoringStats.totalMonitored) * 100
      }, 0)
      return totalRate / eligibleBusinesses.length
    })(),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Business Data</h3>
          <p className="text-gray-600">Please wait while we fetch the latest information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center shadow-lg border-0">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">Unable to Load Business Data</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <p className="font-medium">This could be due to:</p>
                <ul className="list-disc list-inside space-y-1 text-left max-w-xs mx-auto">
                  <li>Database connection issues</li>
                  <li>Server maintenance</li>
                  <li>Temporary network problems</li>
                </ul>
              </div>
              <Button
                color="primary"
                size="lg"
                onClick={() => {
                  setError(null)
                  fetchBusinessMonitoring()
                }}
                className="font-medium"
              >
                Retry Connection
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Business Monitoring</h1>
              <p className="text-gray-600 mt-1">Monitor business engagement and offer tracking performance</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 sm:p-6 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{summaryStats.totalBusinesses}</p>
            <p className="text-sm text-gray-600">Businesses</p>
          </Card>

          <Card className="p-4 sm:p-6 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Active</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{summaryStats.activelyMonitoring}</p>
            <p className="text-sm text-gray-600">Monitoring</p>
          </Card>

          <Card className="p-4 sm:p-6 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Buy Box</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{summaryStats.totalInBuyBox}</p>
            <p className="text-sm text-gray-600">In Buy Box</p>
          </Card>

          <Card className="p-4 sm:p-6 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Success</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {summaryStats.averageBuyBoxRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">Avg Rate</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 sm:p-6 mb-6 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search businesses or owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="w-4 h-4 text-gray-400" />}
                variant="bordered"
                classNames={{
                  input: "text-sm",
                  inputWrapper: "bg-white",
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                placeholder="Filter by status"
                selectedKeys={statusFilter ? [statusFilter] : []}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-64"
                variant="bordered"
                startContent={<Filter className="w-4 h-4 text-gray-400" />}
                classNames={{
                  trigger: "bg-white",
                }}
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
                variant="bordered"
                classNames={{
                  trigger: "bg-white",
                }}
              >
                {getSortOptions().map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Business Cards */}
        <div className="space-y-4">
          {filteredBusinesses.map((business) => (
            <BusinessCard key={business.id} business={business} onEdit={handleEdit} onDelete={handleDelete} />
          ))}

          {filteredBusinesses.length === 0 && !loading && (
            <Card className="p-12 text-center shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search criteria or filters to find what you're looking for."
                  : "No businesses have been created yet. They will appear here once users start signing up."}
              </p>
            </Card>
          )}
        </div>

        {/* Modals */}
        <EditBusinessModal
          isOpen={editModal.isOpen}
          onClose={editModal.onClose}
          business={selectedBusiness}
          onUpdate={handleUpdateBusiness}
        />

        <DeleteBusinessModal
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
          business={selectedBusiness}
          onDelete={handleDeleteBusiness}
        />
      </div>
    </div>
  )
}

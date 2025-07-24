"use client"

import { useEffect, useState } from "react"
import {
  Card,
  Input,
  Chip,
  Select,
  SelectItem,
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
  Textarea,
  Tabs,
  Tab,
} from "@nextui-org/react"
import {
  Search,
  Building2,
  Eye,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  Activity,
  Filter,
  Mail,
  Calendar,
  Send,
  CreditCard,
} from "lucide-react"
import { format, addMonths } from "date-fns"
import { Plan, SubscriptionStatus } from '@prisma/client'

interface BusinessMonitoring {
  id: string
  name: string
  owner: {
    name: string | null
    email: string
  }
  subscription: {
    id: string
    status: string
    nextBillingDate: string | null
    plan: {
      id: string
      name: string
      maxOffers: number
      price: number
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
  onUpdateSubscription: (businessId: string, data: { 
    status: SubscriptionStatus; 
    nextBillingDate: string; 
    planId: string 
  }) => Promise<void>
}

const EditBusinessModal = ({ isOpen, onClose, business, onUpdate, onUpdateSubscription }: EditBusinessModalProps) => {
  // Business Edit State
  const [name, setName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [isBusinessLoading, setIsBusinessLoading] = useState(false)

  // Subscription Edit State
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(SubscriptionStatus.ACTIVE)
  const [nextBillingDate, setNextBillingDate] = useState<string>('')
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [plans, setPlans] = useState<Plan[]>([])
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)

  // Tab State
  const [selectedTab, setSelectedTab] = useState("business")

  useEffect(() => {
    if (business) {
      // Initialize business data
      setName(business.name)
      setOwnerEmail(business.owner.email)
      
      // Initialize subscription data
      if (business.subscription) {
        setSubscriptionStatus(business.subscription.status as SubscriptionStatus)
        setSelectedPlanId(business.subscription.plan.id)
        setNextBillingDate(business.subscription.nextBillingDate ? 
          new Date(business.subscription.nextBillingDate).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0]
        )
      }
    }
  }, [business])

  useEffect(() => {
    if (isOpen) {
      fetchPlans()
    }
  }, [isOpen])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      if (!response.ok) throw new Error('Failed to fetch plans')
      const data = await response.json()
      setPlans(data)
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const handleBusinessUpdate = async () => {
    if (!business) return
    
    setIsBusinessLoading(true)
    try {
      await onUpdate(business.id, { name, ownerEmail })
    } catch (error) {
      console.error("Error updating business:", error)
    } finally {
      setIsBusinessLoading(false)
    }
  }

  const handleSubscriptionUpdate = async () => {
    if (!business || !business.subscription) return
    
    setIsSubscriptionLoading(true)
    try {
      await onUpdateSubscription(business.id, {
        status: subscriptionStatus,
        nextBillingDate,
        planId: selectedPlanId
      })
    } catch (error) {
      console.error("Error updating subscription:", error)
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

  const handleSetNextMonth = () => {
    setNextBillingDate(prev => {
      const currentDate = prev ? new Date(prev) : new Date()
      const nextMonth = addMonths(currentDate, 1)
      return nextMonth.toISOString().split('T')[0]
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      classNames={{
        base: "mx-4",
        backdrop: "bg-black/50 backdrop-blur-sm",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span className="text-xl font-semibold">Edit {business?.name}</span>
          <p className="text-sm text-default-500 font-normal">
            Manage business details and subscription settings
          </p>
        </ModalHeader>
        <ModalBody>
          <Tabs 
            selectedKey={selectedTab} 
            onSelectionChange={(key) => setSelectedTab(key.toString())}
            className="w-full"
          >
            <Tab 
              key="business" 
              title={
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Business Details</span>
                </div>
              }
            >
              <Card className="p-4 mt-4">
                <div className="space-y-6">
                  <Input
                    label="Business Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter business name"
                    variant="bordered"
                  />
                  
                  <Input
                    label="Owner Email"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="Enter owner email"
                    variant="bordered"
                  />
                  
                  <div className="p-4 bg-default-50 border border-default-200 rounded-xl">
                    <p className="text-sm text-default-700">
                      <strong>Note:</strong> Changing the owner email will transfer the business to that user account.
                    </p>
                  </div>

                  <Button
                    color="primary"
                    onPress={handleBusinessUpdate}
                    isLoading={isBusinessLoading}
                    isDisabled={!name.trim() || !ownerEmail.trim()}
                    className="w-full"
                  >
                    Update Business Details
                  </Button>
                </div>
              </Card>
            </Tab>

            <Tab 
              key="subscription" 
              title={
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Subscription</span>
                </div>
              }
            >
              <Card className="p-4 mt-4">
                <div className="space-y-6">
                  {!business?.subscription ? (
                    <div className="text-center p-6 bg-warning-50 border border-warning-200 rounded-xl">
                      <p className="text-warning-800 font-medium">No Subscription Found</p>
                      <p className="text-sm text-warning-700 mt-1">
                        This business doesn't have an active subscription.
                      </p>
                    </div>
                  ) : (
                    <>
                      <Select
                        label="Subscription Plan"
                        selectedKeys={selectedPlanId ? [selectedPlanId] : []}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        variant="bordered"
                      >
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} ({plan.maxOffers} offers - ${plan.price})
                          </SelectItem>
                        ))}
                      </Select>

                      {selectedPlanId !== business.subscription.plan.id && (
                        <div className="p-3 bg-warning-50 border border-warning-200 rounded-xl">
                          <p className="text-sm text-warning-800">
                            <strong>Warning:</strong> Changing plans may affect monitored offers.
                          </p>
                        </div>
                      )}

                      <Select
                        label="Subscription Status"
                        selectedKeys={[subscriptionStatus]}
                        onChange={(e) => setSubscriptionStatus(e.target.value as SubscriptionStatus)}
                        variant="bordered"
                      >
                        {Object.values(SubscriptionStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </Select>

                      <div>
                        <p className="text-sm text-default-600 mb-3">Next Billing Date</p>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            className="flex-1 p-3 border border-default-300 rounded-lg bg-default-50"
                            value={nextBillingDate}
                            onChange={(e) => setNextBillingDate(e.target.value)}
                          />
                          <Button
                            size="lg"
                            variant="bordered"
                            onClick={handleSetNextMonth}
                            startContent={<Calendar className="w-4 h-4" />}
                          >
                            Next Month
                          </Button>
                        </div>
                      </div>

                      {/* Current Subscription Info */}
                      <div className="p-4 bg-default-50 border border-default-200 rounded-xl">
                        <h4 className="font-medium text-default-800 mb-3">Current Subscription</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-default-600">Plan</p>
                            <p className="font-medium">{business.subscription.plan.name}</p>
                          </div>
                          <div>
                            <p className="text-default-600">Status</p>
                            <p className="font-medium">{business.subscription.status}</p>
                          </div>
                          <div>
                            <p className="text-default-600">Max Offers</p>
                            <p className="font-medium">{business.subscription.plan.maxOffers}</p>
                          </div>
                          <div>
                            <p className="text-default-600">Utilization</p>
                            <p className="font-medium">{business.monitoringStats.planUtilization.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>

                      <Button
                        color="primary"
                        onPress={handleSubscriptionUpdate}
                        isLoading={isSubscriptionLoading}
                        className="w-full"
                      >
                        Update Subscription
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Close
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
              <p className="text-red-700 text-sm mb-3">Deleting this business will permanently remove all data.</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Type <strong>{business?.name}</strong> to confirm:
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
          <Button color="danger" onPress={handleDelete} isLoading={isLoading} isDisabled={!isDeleteEnabled}>
            Delete Business
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

interface EmailBusinessModalProps {
  isOpen: boolean
  onClose: () => void
  business: BusinessMonitoring | null
  onSendEmail: (businessId: string, subject: string, body: string) => Promise<void>
}

const EmailBusinessModal = ({ isOpen, onClose, business, onSendEmail }: EmailBusinessModalProps) => {
  const [subject, setSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

  // Email templates
  const templates = {
    "start_monitoring": {
      subject: "Start Monitoring Your Offers with SalesPath",
      body: `<p>Hi {{name}},</p>

<p>Great news! Your SalesPath subscription for <strong>{{businessName}}</strong> is active, but we noticed you haven't started monitoring any offers yet.</p>

<p>Here's how to get started with offer monitoring:</p>

<h3 style="color: #374151; margin: 16px 0 8px 0;">👁️ Step 1: Enable Monitoring</h3>
<ul style="margin: 8px 0; padding-left: 20px;">
  <li style="margin: 4px 0;">Go to your <strong>"Offers"</strong> tab</li>
  <li style="margin: 4px 0;">Find the product you want to monitor</li>
  <li style="margin: 4px 0;"><strong>Click the eye icon</strong> next to the offer</li>
</ul>

<h3 style="color: #374151; margin: 16px 0 8px 0;">📝 Step 2: Set Minimum Price</h3>
<ul style="margin: 8px 0; padding-left: 20px;">
  <li style="margin: 4px 0;">A popup will appear asking for your minimum price</li>
  <li style="margin: 4px 0;">Set this to protect your profit margins</li>
  <li style="margin: 4px 0;"><strong>Click confirm</strong> to start monitoring</li>
</ul>

<h3 style="color: #374151; margin: 16px 0 8px 0;">🎯 How Offer Monitoring Works:</h3>
<ul style="margin: 8px 0; padding-left: 20px;">
  <li style="margin: 4px 0;">🟢 <strong>Monitoring is ON</strong> - we're tracking price changes</li>
  <li style="margin: 4px 0;">⚫ <strong>Monitoring is OFF</strong> - click the eye icon to enable automated tracking</li>
  <li style="margin: 4px 0;">🔒 <strong>Set a minimum price</strong> when first enabling monitoring to protect your margins</li>
</ul>

<p>Once you complete these steps, our system will automatically track price changes and help optimize your offers for better performance.</p>

<p>Need help getting started? Our support team is here to assist you!</p>`
    },
    "subscription_reminder": {
      subject: "Your SalesPath Subscription Status",
      body: `<p>Hi {{name}},</p>

<p>We're reaching out regarding your SalesPath subscription for <strong>{{businessName}}</strong>.</p>

<p><strong>Current Status:</strong> {{status}}</p>

<p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>`
    },
    "plan_upgrade": {
      subject: "Upgrade Your SalesPath Plan",
      body: `<p>Hi {{name}},</p>

<p>We noticed that <strong>{{businessName}}</strong> is approaching its plan limits.</p>

<p>You're currently using a high percentage of your plan's capacity. Consider upgrading to continue monitoring more offers without interruption.</p>`
    },
    "inactive_monitoring": {
      subject: "Reactivate Your SalesPath Monitoring",
      body: `<p>Hi {{name}},</p>

<p>We noticed that monitoring for <strong>{{businessName}}</strong> has been inactive.</p>

<p>Your subscription status is currently <strong>{{status}}</strong>. To resume price monitoring and optimization, please update your subscription.</p>`
    },
    "custom": {
      subject: "",
      body: ""
    }
  }

  useEffect(() => {
    if (business) {
      setSubject("")
      setEmailBody("")
      setShowSuccessAlert(false)
    }
  }, [business])

  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessAlert])

  const handleTemplateChange = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates]
    if (template) {
      setSubject(template.subject)
      setEmailBody(template.body)
    }
  }

  const handleSubmit = async () => {
    if (!business || !subject.trim() || !emailBody.trim()) return
    
    setIsLoading(true)
    try {
      await onSendEmail(business.id, subject, emailBody)
      setShowSuccessAlert(true)
      setSubject("")
      setEmailBody("")
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error sending email:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      classNames={{
        base: "mx-4",
        backdrop: "bg-black/50 backdrop-blur-sm",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <span className="text-xl font-semibold">Send Email to {business?.name}</span>
          </div>
          <p className="text-sm text-default-500 font-normal">
            Email will be sent to: {business?.owner.email}
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {showSuccessAlert && (
              <div className="p-4 bg-success-50 border border-success-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-success-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="font-medium text-success-800">Email sent successfully!</span>
                </div>
                <p className="text-sm text-success-700 mt-1">
                  The email has been delivered to {business?.owner.email}
                </p>
              </div>
            )}

            <Select
              label="Email Template"
              placeholder="Choose a template or create custom email"
              onChange={(e) => handleTemplateChange(e.target.value)}
              variant="bordered"
            >
              <SelectItem key="start_monitoring" value="start_monitoring">
                How to Start Monitoring (Active/Trial with no monitoring)
              </SelectItem>
              <SelectItem key="subscription_reminder" value="subscription_reminder">
                Subscription Reminder
              </SelectItem>
              <SelectItem key="plan_upgrade" value="plan_upgrade">
                Plan Upgrade Suggestion
              </SelectItem>
              <SelectItem key="inactive_monitoring" value="inactive_monitoring">
                Inactive Monitoring Alert
              </SelectItem>
              <SelectItem key="custom" value="custom">
                Custom Email
              </SelectItem>
            </Select>

            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              variant="bordered"
            />

            <Textarea
              label="Message"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Enter your message"
              minRows={8}
              variant="bordered"
            />

            <div className="p-4 bg-default-50 border border-default-200 rounded-xl">
              <p className="text-sm text-default-700 font-medium mb-2">Available Variables:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-default-600">
                <div>• <code className="bg-default-100 px-1 rounded">{"{{name}}"}</code> - Owner&apos;s name</div>
                <div>• <code className="bg-default-100 px-1 rounded">{"{{businessName}}"}</code> - Business name</div>
                <div>• <code className="bg-default-100 px-1 rounded">{"{{status}}"}</code> - Subscription status</div>
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
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!subject.trim() || !emailBody.trim() || showSuccessAlert}
            startContent={<Send className="w-4 h-4" />}
          >
            Send Email
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
  onEmail,
}: {
  business: BusinessMonitoring
  onEdit: (business: BusinessMonitoring) => void
  onDelete: (business: BusinessMonitoring) => void
  onEmail: (business: BusinessMonitoring) => void
}) => {
  const stats = business.monitoringStats
  const subscription = business.subscription
  const isActivelyMonitored = subscription && ["ACTIVE", "TRIAL"].includes(subscription.status)
  const buyBoxRate = stats.totalMonitored > 0 ? (stats.inBuyBox / stats.totalMonitored) * 100 : 0

  return (
    <Card className="p-6 shadow-sm border-0 bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{business.name}</h3>
            <Chip
              color={subscriptionStatusColors[subscription?.status || "default"]}
              variant="flat"
              size="sm"
              className="font-medium"
            >
              {subscription?.status || "NO SUB"}
            </Chip>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Mail className="w-4 h-4" />
            <span className="truncate">{business.owner.email}</span>
          </div>
        </div>

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button isIconOnly size="sm" variant="light" className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem 
              key="edit" 
              startContent={<Edit className="w-4 h-4" />} 
              onClick={() => onEdit(business)}
            >
              Edit Business & Subscription
            </DropdownItem>
            <DropdownItem 
              key="email" 
              startContent={<Mail className="w-4 h-4" />} 
              onClick={() => onEmail(business)}
            >
              Send Email
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

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1">
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.totalMonitored}</p>
          <p className="text-xs text-gray-600">Monitored</p>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
            <ShoppingCart className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.inBuyBox}</p>
          <p className="text-xs text-gray-600">Buy Box</p>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-1">
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.reachedMinPrice}</p>
          <p className="text-xs text-gray-600">Min Price</p>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{buyBoxRate.toFixed(0)}%</p>
          <p className="text-xs text-gray-600">Success</p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Building2 className="w-4 h-4" />
          <span>{subscription?.plan.name || "No Plan"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(business.createdAt), "MMM d, yyyy")}</span>
        </div>
      </div>

      {/* Alerts */}
      {!isActivelyMonitored && stats.totalMonitored > 0 && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800">Monitoring inactive</span>
          </div>
        </div>
      )}

      {stats.planUtilization >= 90 && isActivelyMonitored && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">Plan limit reached ({stats.planUtilization.toFixed(0)}%)</span>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function BusinessMonitoringPage() {
  const [businesses, setBusinesses] = useState<BusinessMonitoring[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessMonitoring[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("TRIAL") // Default to TRIAL
  const [sortBy, setSortBy] = useState("name")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessMonitoring | null>(null)

  const editModal = useDisclosure()
  const deleteModal = useDisclosure()
  const emailModal = useDisclosure()

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
    { key: "TRIAL", label: "Trial Subscriptions" },
    { key: "ACTIVE", label: "Active Subscriptions" },
    { key: "EXPIRED", label: "Expired Subscriptions" },
    { key: "active_monitoring", label: "Actively Monitoring" },
    { key: "inactive_monitoring", label: "Not Monitoring" },
    { key: "high_utilization", label: "High Usage (80%+)" },
  ]

  const handleEdit = (business: BusinessMonitoring) => {
    setSelectedBusiness(business)
    editModal.onOpen()
  }

  const handleDelete = (business: BusinessMonitoring) => {
    setSelectedBusiness(business)
    deleteModal.onOpen()
  }

  const handleEmail = (business: BusinessMonitoring) => {
    setSelectedBusiness(business)
    emailModal.onOpen()
  }

  const handleUpdateBusiness = async (businessId: string, data: { name: string; ownerEmail: string }) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to update business")
      await fetchBusinessMonitoring()
    } catch (error) {
      console.error("Error updating business:", error)
      throw error
    }
  }

  const handleUpdateSubscription = async (businessId: string, data: { 
    status: SubscriptionStatus; 
    nextBillingDate: string; 
    planId: string 
  }) => {
    try {
      const business = businesses.find(b => b.id === businessId)
      if (!business?.subscription?.id) {
        throw new Error("No subscription found for this business")
      }

      const response = await fetch(`/api/subscriptions/${business.subscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: data.status,
          nextBillingDate: data.nextBillingDate,
          planId: data.planId
        }),
      })
      if (!response.ok) throw new Error("Failed to update subscription")
      await fetchBusinessMonitoring()
    } catch (error) {
      console.error("Error updating subscription:", error)
      throw error
    }
  }

  const handleDeleteBusiness = async (businessId: string) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete business")
      await fetchBusinessMonitoring()
    } catch (error) {
      console.error("Error deleting business:", error)
      throw error
    }
  }

  const handleSendEmail = async (businessId: string, subject: string, body: string) => {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "businesses",
          recipientIds: [businessId],
          subject,
          body,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }

      console.log('Email sent successfully')
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  const getSortOptions = () => [
    { key: "name", label: "Business Name" },
    { key: "monitored_desc", label: "Most Monitored" },
    { key: "buybox_desc", label: "Most in Buy Box" },
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
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">Unable to Load Business Data</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button
              color="primary"
              size="lg"
              onClick={() => {
                setError(null)
                fetchBusinessMonitoring()
              }}
            >
              Retry Connection
            </Button>
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
              <p className="text-gray-600 mt-1">Monitor business engagement and performance</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalBusinesses}</p>
              <p className="text-sm text-gray-600">Total Businesses</p>
            </div>
          </Card>

          <Card className="p-4 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.activelyMonitoring}</p>
              <p className="text-sm text-gray-600">Active Monitoring</p>
            </div>
          </Card>

          <Card className="p-4 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalInBuyBox}</p>
              <p className="text-sm text-gray-600">In Buy Box</p>
            </div>
          </Card>

          <Card className="p-4 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.averageBuyBoxRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search businesses or owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="w-4 h-4 text-gray-400" />}
                variant="bordered"
                classNames={{ inputWrapper: "bg-white" }}
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
                classNames={{ trigger: "bg-white" }}
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
                classNames={{ trigger: "bg-white" }}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBusinesses.map((business) => (
            <BusinessCard 
              key={business.id} 
              business={business} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              onEmail={handleEmail}
            />
          ))}
        </div>

        {filteredBusinesses.length === 0 && !loading && (
          <Card className="p-12 text-center shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "No businesses have been created yet."}
            </p>
          </Card>
        )}

        {/* Modals */}
        <EditBusinessModal
          isOpen={editModal.isOpen}
          onClose={editModal.onClose}
          business={selectedBusiness}
          onUpdate={handleUpdateBusiness}
          onUpdateSubscription={handleUpdateSubscription}
        />

        <DeleteBusinessModal
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
          business={selectedBusiness}
          onDelete={handleDeleteBusiness}
        />

        <EmailBusinessModal
          isOpen={emailModal.isOpen}
          onClose={emailModal.onClose}
          business={selectedBusiness}
          onSendEmail={handleSendEmail}
        />
      </div>
    </div>
  )
}
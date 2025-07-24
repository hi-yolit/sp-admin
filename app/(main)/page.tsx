"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { type JSX, useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, Chip } from "@nextui-org/react"
import { Users, Eye, Building2, Activity, Database, Clock, AlertCircle } from "lucide-react"

interface DashboardStats {
  userCount: number
  totalBusinessCount: number
  activeSubscriptions: number
  activelyMonitoringBusinessCount: number
  totalOfferCount: number
  actuallyMonitoredOfferCount: number
  activeBusinessCount: number
  trialBusinessCount: number
  inactiveBusinessCount: number
  recentSubscriptionChanges: {
    business: { name: string }
    status: string
    updatedAt: string
  }[]
}

interface SystemHealth {
  status: string
  database: string
  timestamp: string
}

const statusColorMap: Record<string, "primary" | "success" | "danger" | "warning" | "default"> = {
  ACTIVE: "success",
  TRIAL: "primary",
  CANCELLED: "danger",
  PAST_DUE: "warning",
  EXPIRED: "warning",
  PENDING: "default",
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, healthResponse] = await Promise.all([fetch("/api/dashboard/stats"), fetch("/api/health")])

        if (!statsResponse.ok || !healthResponse.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const statsData = await statsResponse.json()
        const healthData = await healthResponse.json()

        setStats(statsData.stats)
        setHealth(healthData)
      } catch (err) {
        setError("Failed to load dashboard data")
        console.error("Dashboard fetch error:", err)
      }
    }

    if (session) {
      fetchDashboardData()
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Please wait while we prepare your admin panel...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 text-lg mt-1">Welcome back, {session.user?.name ?? "Admin"}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<Users className="h-6 w-6 text-blue-600" />}
            title="Total Users"
            value={stats?.userCount}
            bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
            iconBg="bg-blue-100"
          />
          <MetricCard
            icon={<Building2 className="h-6 w-6 text-green-600" />}
            title="Active Subscriptions"
            value={stats?.activeSubscriptions}
            subtitle={`${stats?.totalBusinessCount} total businesses`}
            bgColor="bg-gradient-to-br from-green-50 to-green-100"
            iconBg="bg-green-100"
          />
          <MetricCard
            icon={<Activity className="h-6 w-6 text-purple-600" />}
            title="Actively Monitoring"
            value={stats?.activelyMonitoringBusinessCount}
            bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
            iconBg="bg-purple-100"
          />
          <MetricCard
            icon={<Eye className="h-6 w-6 text-amber-600" />}
            title="Monitored Offers"
            value={stats?.actuallyMonitoredOfferCount}
            subtitle={`${stats?.totalOfferCount} total offers`}
            bgColor="bg-gradient-to-br from-amber-50 to-amber-100"
            iconBg="bg-amber-100"
          />
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <Card className="p-6 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            </div>
            <SystemStatus health={health} />
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <RecentActivity recentChanges={stats?.recentSubscriptionChanges} />
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mt-6 p-6 shadow-sm border-0 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}

// Component for system status
function SystemStatus({ health }: { health: SystemHealth | null }) {
  const isConnected = health?.database === "connected"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
          <span className="text-sm font-medium text-gray-700">Database Connection</span>
        </div>
        <Chip color={isConnected ? "success" : "danger"} variant="flat" size="sm" className="font-medium">
          {isConnected ? "Connected" : "Disconnected"}
        </Chip>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Last Update</span>
        </div>
        <span className="text-sm text-gray-600">
          {health?.timestamp ? format(new Date(health.timestamp), "MMM d, h:mm a") : "N/A"}
        </span>
      </div>
    </div>
  )
}

// Component for recent activity
function RecentActivity({
  recentChanges,
}: { recentChanges?: { business: { name: string }; status: string; updatedAt: string }[] }) {
  if (!recentChanges || recentChanges.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recentChanges.slice(0, 5).map((change, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{change.business.name}</p>
            <p className="text-xs text-gray-500">{format(new Date(change.updatedAt), "MMM d, h:mm a")}</p>
          </div>
          <Chip color={statusColorMap[change.status]} variant="flat" size="sm" className="ml-3 font-medium">
            {change.status}
          </Chip>
        </div>
      ))}
    </div>
  )
}

// Utility components
function MetricCard({
  icon,
  title,
  value,
  subtitle,
  bgColor = "bg-gradient-to-br from-gray-50 to-gray-100",
  iconBg = "bg-gray-100",
}: Readonly<{
  icon: JSX.Element
  title: string
  value?: number
  subtitle?: string
  bgColor?: string
  iconBg?: string
}>) {
  return (
    <Card className={`p-6 shadow-sm border-0 ${bgColor} backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>{icon}</div>
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title.split(" ")[0]}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
        {value !== undefined ? value.toLocaleString() : "Loading..."}
      </p>
      <p className="text-sm text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
    </Card>
  )
}

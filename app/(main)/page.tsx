'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { JSX, useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, Chip } from "@nextui-org/react";
import { Users, Eye, Building2, Activity } from "lucide-react";

interface DashboardStats {
  userCount: number;
  totalBusinessCount: number;
  activeSubscriptions: number;
  activelyMonitoringBusinessCount: number;
  totalOfferCount: number;
  actuallyMonitoredOfferCount: number;
  activeBusinessCount: number;
  trialBusinessCount: number;
  inactiveBusinessCount: number;
  recentSubscriptionChanges: {
    business: { name: string };
    status: string;
    updatedAt: string;
  }[];
}

interface SystemHealth {
  status: string;
  database: string;
  timestamp: string;
}

const statusColorMap: Record<string, string> = {
  ACTIVE: "success",
  TRIAL: "primary",
  CANCELLED: "danger",
  PAST_DUE: "warning",
  EXPIRED: "warning",
  PENDING: "default",
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, healthResponse] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/health')
        ]);

        if (!statsResponse.ok || !healthResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const statsData = await statsResponse.json();
        const healthData = await healthResponse.json();

        setStats(statsData.stats);
        setHealth(healthData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard fetch error:', err);
      }
    };

    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user?.name ?? 'Admin'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <DashboardCard
            icon={<Users className="h-6 w-6 text-blue-600" />}
            title="Total Users"
            value={stats?.userCount}
          />
          <DashboardCard
            icon={<Building2 className="h-6 w-6 text-green-600" />}
            title="Active Subscriptions"
            value={stats?.activeSubscriptions}
            subtitle={`${stats?.totalBusinessCount} total businesses`}
          />
          <DashboardCard
            icon={<Activity className="h-6 w-6 text-purple-600" />}
            title="Actively Monitoring"
            value={stats?.activelyMonitoringBusinessCount}
            subtitle={`${stats?.activeSubscriptions} with active subs`}
          />
          <DashboardCard
            icon={<Eye className="h-6 w-6 text-amber-600" />}
            title="Monitored Offers"
            value={stats?.actuallyMonitoredOfferCount}
            subtitle={`${stats?.totalOfferCount} total offers`}
          />
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 bg-white shadow">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Business Stats</h2>
            <BusinessStats stats={stats} />
          </Card>

          <Card className="p-4 sm:p-6 bg-white shadow">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">System Status</h2>
            <SystemStatus health={health} />
          </Card>

          <Card className="p-4 sm:p-6 bg-white shadow">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <RecentActivity recentChanges={stats?.recentSubscriptionChanges} />
          </Card>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

// Component for business statistics
function BusinessStats({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className="space-y-4">
      <StatRow label="Total Businesses" value={stats?.totalBusinessCount} />
      <StatRow label="Active Subscriptions" value={stats?.activeSubscriptions} color="text-green-600" />
      <StatRow label="Currently Monitoring" value={stats?.activelyMonitoringBusinessCount} color="text-blue-600" />
      <StatRow label="Expired/Cancelled" value={stats?.inactiveBusinessCount} color="text-red-600" />
    </div>
  );
}

// Component for system status
function SystemStatus({ health }: { health: SystemHealth | null }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <StatRow
        label="Database Connection"
        value={health?.database === 'connected' ? 'Connected' : 'Disconnected'}
        color={health?.database === 'connected' ? 'text-green-600' : 'text-red-600'}
      />
      <StatRow
        label="Last Update"
        value={health?.timestamp ? format(new Date(health.timestamp), 'MMM d, yyyy h:mm a') : 'N/A'}
      />
    </div>
  );
}

// Component for recent activity
function RecentActivity({ recentChanges }: { recentChanges?: { business: { name: string }; status: string; updatedAt: string }[] }) {
  if (!recentChanges || recentChanges.length === 0) {
    return <p className="text-gray-500">No recent changes.</p>;
  }

  return (
    <div className="space-y-3">
      {recentChanges.map((change, index) => (
        <div key={index} className="flex justify-between items-center text-sm">
          <span className="text-gray-600">{change.business.name}</span>
          <Chip color={statusColorMap[change.status] as "primary" | "success" | "danger" | "warning"} variant="flat" size="sm">
            {change.status}
          </Chip>
        </div>
      ))}
    </div>
  );
}

// Utility components
function DashboardCard({ 
  icon, 
  title, 
  value, 
  subtitle 
}: Readonly<{ 
  icon: JSX.Element; 
  title: string; 
  value?: number;
  subtitle?: string;
}>) {
  return (
    <Card className="p-4 sm:p-6 bg-white shadow hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className="p-3 bg-gray-100 rounded-full">{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900">
            {value ?? 'Loading...'}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatRow({ label, value, color = "text-gray-600" }: { label: string; value?: number | string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${color}`}>{value ?? 'Loading...'}</span>
    </div>
  );
}

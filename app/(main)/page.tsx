"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format } from "date-fns"

type RecentChange = { business: { name: string }; status: string; updatedAt: string }
type DashboardStats = {
  userCount: number
  totalBusinessCount: number
  activeSubscriptions: number
  activelyMonitoringBusinessCount: number
  totalOfferCount: number
  actuallyMonitoredOfferCount: number
  activeBusinessCount: number
  trialBusinessCount: number
  inactiveBusinessCount: number
  recentSubscriptionChanges: RecentChange[]
}
type SystemHealth = { status: string; database: string; timestamp: string }

const statusBadge = (s: string) => {
  const base = "inline-block text-[11px] px-2 py-0.5 rounded border"
  if (s === "ACTIVE") return <span className={`${base} bg-green-50 text-green-700 border-green-200`}>ACTIVE</span>
  if (s === "TRIAL") return <span className={`${base} bg-blue-50 text-blue-700 border-blue-200`}>TRIAL</span>
  if (s === "PAST_DUE") return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>PAST_DUE</span>
  if (s === "CANCELLED" || s === "EXPIRED")
    return <span className={`${base} bg-red-50 text-red-700 border-red-200`}>{s}</span>
  return <span className={`${base} bg-gray-50 text-gray-700 border-gray-200`}>{s}</span>
}

export default function AdminDashboardMinimal() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    const load = async () => {
      try {
        const [s, h] = await Promise.all([fetch("/api/dashboard/stats"), fetch("/api/health")])
        if (!s.ok || !h.ok) throw new Error("bad response")
        const sj = await s.json()
        const hj = await h.json()
        setStats(sj.stats)
        setHealth(hj)
      } catch (e) {
        setErr("Failed to load")
      }
    }
    if (session) load()
  }, [session])

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-gray-600">Loading…</div>
    )
  }
  if (!session) return null

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">Admin</h1>
          <div className="mt-1 text-xs text-gray-500">
            {health?.timestamp ? format(new Date(health.timestamp), "MMM d, HH:mm") : "—"} · DB:{" "}
            <span className={health?.database === "connected" ? "text-green-600" : "text-red-600"}>
              {health?.database ?? "unknown"}
            </span>
          </div>
        </header>

        {err && <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

        {/* Metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat label="Users" value={stats?.userCount} />
          <Stat label="Businesses" value={stats?.totalBusinessCount} />
          <Stat label="Active Subs" value={stats?.activeSubscriptions} />
          <Stat label="Actively Monitoring" value={stats?.activelyMonitoringBusinessCount} />
          <Stat label="Offers (total)" value={stats?.totalOfferCount} />
          <Stat label="Offers (monitored)" value={stats?.actuallyMonitoredOfferCount} />
          <Stat label="Trials" value={stats?.trialBusinessCount} />
          <Stat label="Inactive Subs" value={stats?.inactiveBusinessCount} />
        </section>

        {/* Recent changes */}
        <section>
          <h2 className="text-sm font-medium mb-2">Recent subscription changes</h2>
          {(!stats?.recentSubscriptionChanges || stats.recentSubscriptionChanges.length === 0) ? (
            <div className="text-xs text-gray-500 border rounded px-3 py-2">No recent activity</div>
          ) : (
            <ul className="divide-y rounded border">
              {stats.recentSubscriptionChanges.slice(0, 5).map((r, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{r.business.name}</div>
                    <div className="text-xs text-gray-500">{format(new Date(r.updatedAt), "MMM d, HH:mm")}</div>
                  </div>
                  <div className="ml-3">{statusBadge(r.status)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded border px-3 py-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold">{value !== undefined ? value.toLocaleString() : "—"}</div>
    </div>
  )
}

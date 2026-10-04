"use client"

import { useEffect, useState } from "react"

type User = {
  id: number; name: string; role: string
  telegramHandle: string | null
  balance: { amountUsd: number; amountEur: number } | null
  _count: { accounts: number }
}

type DashboardData = {
  users: User[]
  totalUsd: number; totalEur: number
  activeClubs: number; activeAccounts: number
  downlineOwes: number; uplineOwes: number; netProfit: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { setData(d ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = data?.users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const sorted = [...filtered].sort((a, b) => {
    const aUsd = a.balance?.amountUsd ?? 0
    const bUsd = b.balance?.amountUsd ?? 0
    return sortDir === "asc" ? aUsd - bUsd : bUsd - aUsd
  })

  const debtors = data?.users.filter(u => (u.balance?.amountUsd ?? 0) < 0).length ?? 0

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Dashboard</div>
        <div className="topbar-actions">
          <span className="badge badge-accent">W40 &middot; 2026</span>
        </div>
      </div>

      <div className="page-body fade-in">

        {/* P&L Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div className="kpi-label" style={{ marginBottom: 6 }}>We are owed</div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-1px", color: "var(--red)" }}>
              {loading ? "-" : `${fmt(data?.downlineOwes ?? 0)} USD`}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>
              {debtors} players in debt
            </div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div className="kpi-label" style={{ marginBottom: 6 }}>We owe</div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-1px", color: "var(--amber)" }}>
              {loading ? "-" : `${fmt(data?.uplineOwes ?? 0)} USD`}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>
              club rakeback share
            </div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div className="kpi-label" style={{ marginBottom: 6 }}>Net Profit</div>
            <div style={{
              fontSize: 26, fontWeight: 600, letterSpacing: "-1px",
              color: (data?.netProfit ?? 0) >= 0 ? "var(--green)" : "var(--red)"
            }}>
              {loading ? "-" : `${(data?.netProfit ?? 0) >= 0 ? "+" : "-"}${fmt(data?.netProfit ?? 0)} USD`}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>
              downline - upline
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="kpi-grid" style={{ marginBottom: 16 }}>
          <div className="kpi-card">
            <div className="kpi-label">Active Users</div>
            <div className="kpi-value val-neutral">{loading ? "-" : data?.users.length}</div>
            <div className="kpi-sub">{debtors} owe us</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Active Clubs</div>
            <div className="kpi-value val-neutral">{loading ? "-" : data?.activeClubs}</div>
            <div className="kpi-sub">{loading ? "-" : data?.activeAccounts} accounts</div>
          </div>
        </div>

        {/* Search */}
        <div className="section-header">
          <span className="section-title">User Balances</span>
          <input className="form-input" placeholder="Search users..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: 200, padding: "5px 10px", fontSize: 12 }} />
        </div>

        {/* Table */}
        <div className="card-flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                  style={{ cursor: "pointer", userSelect: "none" }}>
                  Balance USD {sortDir === "asc" ? "↑" : "↓"}
                </th>
                <th>Accounts</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : sorted.map(u => {
                const usd = u.balance?.amountUsd ?? 0
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="avatar" style={{ fontSize: 9 }}>{u.name[0]}</div>
                        <div>
                          <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{u.name}</div>
                          {u.telegramHandle && (
                            <div style={{ fontSize: 10, color: "var(--accent)" }}>{u.telegramHandle}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === "ADMIN" ? "badge-accent" : "badge-inactive"}`}>
                        {u.role.toLowerCase()}
                      </span>
                    </td>
                    <td className={usd === 0 ? "val-muted" : usd > 0 ? "val-pos" : "val-neg"}>
                      {usd === 0 ? "-" : `${usd > 0 ? "+" : "-"}${fmt(usd)}`}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{u._count.accounts}</td>
                    <td>
                      <a href={`/ledger/${u.id}`}>
                        <button className="btn btn-accent" style={{ fontSize: 10, padding: "3px 10px" }}>View</button>
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
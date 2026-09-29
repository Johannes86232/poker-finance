"use client"

import { useEffect, useState } from "react"

type User = {
  id: number
  name: string
  role: string
  telegramHandle: string | null
  balance: { amountUsd: number; amountEur: number } | null
  _count: { accounts: number }
}

type DashboardData = {
  users: User[]
  totalUsd: number
  totalEur: number
  activeClubs: number
  activeAccounts: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { setData(d ?? { users: [], totalUsd: 0, totalEur: 0, activeClubs: 0, activeAccounts: 0 }); setLoading(false) })
.catch(() => setLoading(false))
  }, [])

  const filtered = data?.users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  // Players who owe us (negative balance)
  const debtors = data?.users.filter(u => (u.balance?.amountUsd ?? 0) < 0).length ?? 0

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Dashboard</div>
        <div className="topbar-actions">
          <span className="badge badge-accent">W8 · 2026</span>
          <button className="btn"><i className="ti ti-download" /> Export</button>
        </div>
      </div>

      <div className="page-body fade-in">

        {/* KPI Grid */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total Exposure</div>
            <div className={`kpi-value ${(data?.totalUsd ?? 0) >= 0 ? "val-pos" : "val-neg"}`}>
              {loading ? "—" : `${(data?.totalUsd ?? 0) >= 0 ? "+" : "−"}${fmt(data?.totalUsd ?? 0)}`}
            </div>
            <div className="kpi-sub">USD · all users</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">EUR Exposure</div>
            <div className={`kpi-value ${(data?.totalEur ?? 0) >= 0 ? "val-pos" : "val-neg"}`}>
              {loading ? "—" : `${(data?.totalEur ?? 0) >= 0 ? "+" : "−"}${fmt(data?.totalEur ?? 0)}`}
            </div>
            <div className="kpi-sub">EUR · all users</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Active Users</div>
            <div className="kpi-value val-neutral">{loading ? "—" : data?.users.length}</div>
            <div className="kpi-sub">{debtors} owe us</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Active Clubs</div>
            <div className="kpi-value val-neutral">{loading ? "—" : data?.activeClubs}</div>
            <div className="kpi-sub">{loading ? "—" : data?.activeAccounts} accounts</div>
          </div>
        </div>

        {/* Total Balance Hero */}
        <div className="card" style={{ textAlign: "center", marginBottom: 16 }}>
          <div className="kpi-label" style={{ marginBottom: 12 }}>Total Balance (All Users)</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <div>
              <div style={{
                fontSize: 32, fontWeight: 600, letterSpacing: "-1.5px",
                color: (data?.totalUsd ?? 0) >= 0 ? "var(--green)" : "var(--red)"
              }}>
                {loading ? "—" : `${(data?.totalUsd ?? 0) >= 0 ? "+" : "−"}${fmt(data?.totalUsd ?? 0)} USD`}
              </div>
            </div>
            {(data?.totalEur ?? 0) !== 0 && (
              <>
                <div style={{ color: "var(--text-tertiary)", fontSize: 12 }}>OR</div>
                <div style={{
                  fontSize: 32, fontWeight: 600, letterSpacing: "-1.5px",
                  color: (data?.totalEur ?? 0) >= 0 ? "var(--green)" : "var(--red)"
                }}>
                  {`${(data?.totalEur ?? 0) >= 0 ? "+" : "−"}${fmt(data?.totalEur ?? 0)} EUR`}
                </div>
              </>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
            {(data?.totalUsd ?? 0) < 0 ? "Players owe us" : "We owe players"}
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
                <th>Balance USD</th>
                <th>Balance EUR</th>
                <th>Accounts</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : filtered.map(u => {
                const usd = u.balance?.amountUsd ?? 0
                const eur = u.balance?.amountEur ?? 0
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
                      {usd === 0 ? "—" : `${usd > 0 ? "+" : "−"}${fmt(usd)}`}
                    </td>
                    <td className={eur === 0 ? "val-muted" : eur > 0 ? "val-pos" : "val-neg"}>
                      {eur === 0 ? "—" : `${eur > 0 ? "+" : "−"}${fmt(eur)}`}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{u._count.accounts}</td>
<td>
  <a href={`/ledger/${u.id}`}>
    <button className="btn btn-accent" style={{ fontSize: 10, padding: "3px 10px" }}>
      View
    </button>
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

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
  weAreOwed: number; weOwe: number; netProfit: number
}

type Week = { id: number; year: number; weekNum: number }
type ProfitRow = { netResult: number; rake: number; weekCount: number }
type UserProfitRow = ProfitRow & { userId: number; userName: string }
type ClubProfitRow = ProfitRow & { clubId: number; clubName: string }

type AnalyticsData = {
  profitByUser: UserProfitRow[]
  profitByClub: ClubProfitRow[]
  weeks: Week[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [aLoading, setALoading] = useState(true)
  const [fromWeekId, setFromWeekId] = useState("")
  const [toWeekId, setToWeekId] = useState("")
  const [filterUserId, setFilterUserId] = useState("")
  const [filterClubId, setFilterClubId] = useState("")
  const [allClubs, setAllClubs] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { setData(d ?? null); setLoading(false) })
      .catch(() => setLoading(false))
    fetch("/api/clubs")
      .then(r => r.json())
      .then(d => setAllClubs(Array.isArray(d) ? d.map((c: any) => ({ id: c.id, name: c.name })) : []))
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fromWeekId, toWeekId, filterUserId, filterClubId])

  function fetchAnalytics() {
    setALoading(true)
    const weeks = analytics?.weeks ?? []
    const fromWeek = weeks.find(w => String(w.id) === fromWeekId)
    const toWeek = weeks.find(w => String(w.id) === toWeekId)
    const params = new URLSearchParams()
    if (fromWeek) { params.set("fromYear", String(fromWeek.year)); params.set("fromWeek", String(fromWeek.weekNum)) }
    if (toWeek) { params.set("toYear", String(toWeek.year)); params.set("toWeek", String(toWeek.weekNum)) }
    if (filterUserId) params.set("userId", filterUserId)
    if (filterClubId) params.set("clubId", filterClubId)
    fetch(`/api/analytics?${params}`)
      .then(r => r.json())
      .then(d => { setAnalytics(d); setALoading(false) })
      .catch(() => setALoading(false))
  }

  // Initial analytics load
  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => { setAnalytics(d); setALoading(false) })
      .catch(() => setALoading(false))
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
              {loading ? "-" : `${fmt(data?.weAreOwed ?? 0)} USD`}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>
              {debtors} players in debt
            </div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div className="kpi-label" style={{ marginBottom: 6 }}>We owe</div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-1px", color: "var(--amber)" }}>
              {loading ? "-" : `${fmt(data?.weOwe ?? 0)} USD`}
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
        <div className="card-flush" style={{ marginBottom: 24 }}>
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

        {/* Analytics Filter Bar */}
        <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Analytics Filter
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>Von Woche</div>
              <select className="form-input" style={{ fontSize: 12, padding: "5px 8px" }}
                value={fromWeekId} onChange={e => setFromWeekId(e.target.value)}>
                <option value="">— Anfang —</option>
                {(analytics?.weeks ?? []).map(w => (
                  <option key={w.id} value={String(w.id)}>W{w.weekNum} {w.year}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>Bis Woche</div>
              <select className="form-input" style={{ fontSize: 12, padding: "5px 8px" }}
                value={toWeekId} onChange={e => setToWeekId(e.target.value)}>
                <option value="">— Ende —</option>
                {(analytics?.weeks ?? []).map(w => (
                  <option key={w.id} value={String(w.id)}>W{w.weekNum} {w.year}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>User</div>
              <select className="form-input" style={{ fontSize: 12, padding: "5px 8px" }}
                value={filterUserId} onChange={e => setFilterUserId(e.target.value)}>
                <option value="">— Alle User —</option>
                {(data?.users ?? []).map(u => (
                  <option key={u.id} value={String(u.id)}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>Club</div>
              <select className="form-input" style={{ fontSize: 12, padding: "5px 8px" }}
                value={filterClubId} onChange={e => setFilterClubId(e.target.value)}>
                <option value="">— Alle Clubs —</option>
                {allClubs.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          {(fromWeekId || toWeekId || filterUserId || filterClubId) && (
            <div style={{ marginTop: 8, textAlign: "right" }}>
              <button className="btn" style={{ fontSize: 11, padding: "3px 10px", background: "#374151", color: "#9ca3af" }}
                onClick={() => { setFromWeekId(""); setToWeekId(""); setFilterUserId(""); setFilterClubId("") }}>
                Filter zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Net Profit by User */}
        <div className="section-header"><span className="section-title">Net Profit by User</span></div>
        <div className="card-flush" style={{ marginBottom: 24 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th style={{ textAlign: "right" }}>Rake</th>
                <th style={{ textAlign: "right" }}>Net Result (USD)</th>
                <th style={{ textAlign: "right" }}>Wochen</th>
              </tr>
            </thead>
            <tbody>
              {aLoading ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : (analytics?.profitByUser ?? []).length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--text-tertiary)" }}>Keine Daten</td></tr>
              ) : (analytics?.profitByUser ?? []).map(row => (
                <tr key={row.userId}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="avatar" style={{ fontSize: 9 }}>{row.userName[0]}</div>
                      <span style={{ fontWeight: 500 }}>{row.userName}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>{fmt(row.rake)}</td>
                  <td style={{ textAlign: "right" }} className={row.netResult >= 0 ? "val-pos" : "val-neg"}>
                    {row.netResult >= 0 ? "+" : "-"}{fmt(row.netResult)}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--text-tertiary)" }}>{row.weekCount}</td>
                </tr>
              ))}
              {!aLoading && (analytics?.profitByUser ?? []).length > 0 && (() => {
                const total = (analytics?.profitByUser ?? []).reduce((s, r) => s + r.netResult, 0)
                const totalRake = (analytics?.profitByUser ?? []).reduce((s, r) => s + r.rake, 0)
                return (
                  <tr style={{ borderTop: "2px solid #374151", fontWeight: 700 }}>
                    <td>Total</td>
                    <td style={{ textAlign: "right" }}>{fmt(totalRake)}</td>
                    <td style={{ textAlign: "right" }} className={total >= 0 ? "val-pos" : "val-neg"}>
                      {total >= 0 ? "+" : "-"}{fmt(total)}
                    </td>
                    <td />
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>

        {/* Net Profit by Club */}
        <div className="section-header"><span className="section-title">Net Profit by Club</span></div>
        <div className="card-flush" style={{ marginBottom: 24 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Club</th>
                <th style={{ textAlign: "right" }}>Rake</th>
                <th style={{ textAlign: "right" }}>Net Result (USD)</th>
                <th style={{ textAlign: "right" }}>Wochen</th>
              </tr>
            </thead>
            <tbody>
              {aLoading ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : (analytics?.profitByClub ?? []).length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--text-tertiary)" }}>Keine Daten</td></tr>
              ) : (analytics?.profitByClub ?? []).map(row => (
                <tr key={row.clubId}>
                  <td style={{ fontWeight: 500 }}>{row.clubName}</td>
                  <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>{fmt(row.rake)}</td>
                  <td style={{ textAlign: "right" }} className={row.netResult >= 0 ? "val-pos" : "val-neg"}>
                    {row.netResult >= 0 ? "+" : "-"}{fmt(row.netResult)}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--text-tertiary)" }}>{row.weekCount}</td>
                </tr>
              ))}
              {!aLoading && (analytics?.profitByClub ?? []).length > 0 && (() => {
                const total = (analytics?.profitByClub ?? []).reduce((s, r) => s + r.netResult, 0)
                const totalRake = (analytics?.profitByClub ?? []).reduce((s, r) => s + r.rake, 0)
                return (
                  <tr style={{ borderTop: "2px solid #374151", fontWeight: 700 }}>
                    <td>Total</td>
                    <td style={{ textAlign: "right" }}>{fmt(totalRake)}</td>
                    <td style={{ textAlign: "right" }} className={total >= 0 ? "val-pos" : "val-neg"}>
                      {total >= 0 ? "+" : "-"}{fmt(total)}
                    </td>
                    <td />
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>

      </div>
    </>
  )
}
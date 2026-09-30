"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"

const nav = [
  { section: "Overview", items: [{ label: "Dashboard", href: "/admin", icon: "ti-layout-dashboard" }] },
  { section: "Management", items: [
    { label: "Users", href: "/admin/users", icon: "ti-users" },
    { label: "Clubs", href: "/admin/clubs", icon: "ti-building" },
    { label: "Accounts", href: "/admin/accounts", icon: "ti-id-badge" },
    { label: "Deals", href: "/admin/deals", icon: "ti-file-invoice" },
  ]},
  { section: "Finance", items: [
    { label: "Transactions", href: "/admin/transactions", icon: "ti-arrows-exchange" },
    { label: "Weekly", href: "/admin/weeks", icon: "ti-calendar-week" },
    { label: "Import Reports", href: "/admin/import", icon: "ti-upload" },
    { label: "FX Rates", href: "/admin/exchange-rates", icon: "ti-currency-dollar" },
  ]},
]

type WeekAccount = {
  account: string; club: string; currency: string; rate: number
  result: number; rake: number; bbj: number; mtt: number
  rbPct: number; rebatePct: number; rakebackAmount: number; netResult: number
}
type Week = { year: number; weekNum: number; accounts: WeekAccount[]; totalUsd: number }
type Transaction = {
  id: number; type: string; direction: string; method: string
  amount: number; currency: string; description: string | null
  createdAt: string
  week: { year: number; weekNum: number } | null
  toUser: { name: string } | null
}
type LedgerData = {
  user: { id: number; name: string; telegramHandle: string | null; balance: { amountUsd: number; amountEur: number } | null }
  weeks: Week[]
  transactions: Transaction[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))

const dirLabel: Record<string, string> = {
  I_PAY_USER: "Paid to you",
  USER_PAYS_ME: "You paid",
  USER1_TO_USER2: "Transfer",
}

function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="sidebar">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Poker in Asia" style={{ width: "164px" }} />
      </div>
      <nav className="sidebar-nav">
        {nav.map((group) => (
          <div key={group.section}>
            <div className="sidebar-section">{group.section}</div>
            {group.items.map((item) => (
              <Link key={item.href} href={item.href}
                className={`sidebar-item ${pathname === item.href ? "active" : ""}`}>
                <i className={`ti ${item.icon}`} aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">A</div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>Admin</span>
          <i className="ti ti-logout" style={{ fontSize: 13, color: "var(--text-tertiary)" }} />
        </div>
      </div>
    </aside>
  )
}

export default function LedgerPage() {
  const params = useParams()
  const [data, setData] = useState<LedgerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/ledger/${params.userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.userId])

  if (loading) return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>Loading...</div>
      </div>
    </div>
  )

  if (!data?.user) return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--red)", fontSize: 13 }}>User not found</div>
      </div>
    </div>
  )

  const balance = data.user.balance?.amountUsd ?? 0
  const isOwed = balance > 0

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="topbar-title">{data.user.name}</div>
            {data.user.telegramHandle && (
              <span className="badge badge-accent" style={{ fontSize: 10 }}>{data.user.telegramHandle}</span>
            )}
          </div>
          <div className="topbar-actions">
            <Link href="/admin">
              <button className="btn">&#8592; Dashboard</button>
            </Link>
          </div>
        </div>

        <div className="page-body fade-in">

          <div className="card" style={{ textAlign: "center", marginBottom: 16, padding: "32px" }}>
            <div className="kpi-label" style={{ marginBottom: 8 }}>Current Balance</div>
            <div style={{
              fontSize: 48, fontWeight: 700, letterSpacing: "-2px", lineHeight: 1,
              color: isOwed ? "var(--green)" : "var(--red)"
            }}>
              {fmt(balance)} USD
            </div>
            <div style={{
              marginTop: 10, fontSize: 12, fontWeight: 600,
              color: isOwed ? "var(--green)" : "var(--red)",
              textTransform: "uppercase", letterSpacing: "0.1em"
            }}>
              {isOwed ? "We owe player" : "Player owes us"}
            </div>
          </div>

          <div className="card-flush" style={{ marginBottom: 16 }}>
            <div style={{ padding: "14px 16px", borderBottom: "0.5px solid var(--border-subtle)" }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Weekly Results</span>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "80px 80px 1fr 120px 100px 100px",
              padding: "8px 16px", fontSize: 10, fontWeight: 500,
              color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase",
              borderBottom: "0.5px solid var(--border-subtle)"
            }}>
              <span>Year</span><span>Week</span><span>Total</span>
              <span>Details</span><span>Status</span><span>Export</span>
            </div>
            {data.weeks.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)", fontSize: 12 }}>No weekly results yet</div>
            ) : data.weeks.map(w => {
              const key = `${w.year}-${w.weekNum}`
              const isExpanded = expandedWeek === key
              return (
                <div key={key}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "80px 80px 1fr 120px 100px 100px",
                    padding: "14px 16px", alignItems: "center",
                    borderBottom: isExpanded ? "none" : "0.5px solid var(--border-subtle)", fontSize: 13,
                  }}>
                    <span style={{ color: "var(--text-secondary)" }}>{w.year}</span>
                    <span style={{ color: "var(--text-secondary)" }}>W{w.weekNum}</span>
                    <span style={{ fontWeight: 600, color: w.totalUsd >= 0 ? "var(--green)" : "var(--red)" }}>
                      {w.totalUsd >= 0 ? "+" : "-"}{fmt(w.totalUsd)} USD
                    </span>
                    <button className="btn" onClick={() => setExpandedWeek(isExpanded ? null : key)}
                      style={{ fontSize: 11, width: 90 }}>
                      {isExpanded ? "Close" : "Details"}
                    </button>
                    <span className="badge badge-active" style={{ width: "fit-content" }}>Open</span>
                    <button className="btn btn-accent" style={{ fontSize: 11, width: 80 }}>Export</button>
                  </div>
                  {isExpanded && (
                    <div style={{ overflowX: "auto", background: "var(--bg-surface)", borderBottom: "0.5px solid var(--border-subtle)" }}>
                      <table className="data-table" style={{ minWidth: 700 }}>
                        <thead>
                          <tr>
                            <th>Club</th><th>CCY</th><th>Rate</th><th>Account</th>
                            <th style={{ textAlign: "right" }}>Result</th>
                            <th style={{ textAlign: "right" }}>Rake</th>
                            <th style={{ textAlign: "right" }}>BBJ</th>
                            <th style={{ textAlign: "right" }}>MTT</th>
                            <th style={{ textAlign: "right" }}>RB</th>
                            <th style={{ textAlign: "right" }}>Total USD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {w.accounts.map((a, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{a.club}</td>
                              <td><span className="badge badge-inactive">{a.currency}</span></td>
                              <td style={{ color: "var(--text-tertiary)" }}>{a.rate}</td>
                              <td style={{ color: "var(--text-secondary)" }}>{a.account}</td>
                              <td style={{ textAlign: "right" }} className={a.result >= 0 ? "val-pos" : "val-neg"}>
                                {a.result >= 0 ? "+" : "-"}{fmt(a.result)}
                              </td>
                              <td style={{ textAlign: "right", color: "var(--green)" }}>{fmt(a.rake)}</td>
                              <td style={{ textAlign: "right", color: "var(--text-tertiary)" }}>{a.bbj.toFixed(2)}</td>
                              <td style={{ textAlign: "right", color: "var(--text-tertiary)" }}>{a.mtt.toFixed(2)}</td>
                              <td style={{ textAlign: "right" }} className="val-pos">+{fmt(a.rakebackAmount)} USD</td>
                              <td style={{ textAlign: "right", fontWeight: 600 }} className={a.netResult >= 0 ? "val-pos" : "val-neg"}>
                                {a.netResult >= 0 ? "+" : "-"}{fmt(a.netResult)} USD
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="card-flush">
            <div style={{ padding: "14px 16px", borderBottom: "0.5px solid var(--border-subtle)" }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Transactions</span>
            </div>
            {data.transactions.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)", fontSize: 12 }}>No transactions yet</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Type</th><th>Description</th>
                    <th>Direction</th><th>Method</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map(tx => (
                    <tr key={tx.id}>
                      <td style={{ color: "var(--text-tertiary)", fontSize: 11 }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td><span className="badge badge-accent" style={{ fontSize: 9 }}>{tx.type.toLowerCase()}</span></td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {tx.description || (tx.week ? `W${tx.week.weekNum} ${tx.week.year}` : "-")}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>{dirLabel[tx.direction] || tx.direction}</td>
                      <td style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{tx.method}</td>
                      <td style={{ textAlign: "right" }}
                        className={tx.direction === "I_PAY_USER" ? "val-pos" : "val-neg"}>
                        {tx.direction === "I_PAY_USER" ? "+" : "-"}{fmt(tx.amount)} {tx.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
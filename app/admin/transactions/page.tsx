"use client"

import { useEffect, useState } from "react"

type Transaction = {
  id: number
  type: string
  direction: string
  method: string
  amount: number
  currency: string
  description: string | null
  isActive: boolean
  createdAt: string
  user: { id: number; name: string; telegramHandle: string | null }
  toUser: { id: number; name: string; telegramHandle: string | null } | null
  week: { year: number; weekNum: number } | null
}

type User = { id: number; name: string }

const TYPES = ["SETTLEMENT", "TRANSFER", "DEPOSIT", "WITHDRAWAL", "RAKEBACK"]
const DIRECTIONS_ADMIN = ["I_PAY_USER", "USER_PAYS_ME"]
const DIRECTIONS_USER = ["USER1_TO_USER2"]
const METHODS = ["CASH", "INTERNAL", "BANK", "CRYPTO"]
const CURRENCIES = ["USD", "EUR", "AED", "GBP"]

const emptyAdminForm = {
  userId: "", type: "SETTLEMENT", direction: "I_PAY_USER",
  method: "CASH", amount: "", currency: "USD", description: ""
}

const emptyUserForm = {
  userId: "", toUserId: "", type: "TRANSFER", direction: "USER1_TO_USER2",
  method: "INTERNAL", amount: "", currency: "USD", description: ""
}

const directionLabel: Record<string, string> = {
  I_PAY_USER: "I Pay User",
  USER_PAYS_ME: "User Pays Me",
  USER1_TO_USER2: "User 1 → User 2",
}

const typeColor: Record<string, string> = {
  SETTLEMENT: "badge-accent",
  TRANSFER: "badge-warning",
  DEPOSIT: "badge-active",
  WITHDRAWAL: "badge-danger",
  RAKEBACK: "badge-active",
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [adminForm, setAdminForm] = useState(emptyAdminForm)
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"admin" | "user">("admin")

  const fetchAll = async () => {
    setLoading(true)
    const [txRes, userRes] = await Promise.all([
      fetch("/api/transactions"),
      fetch("/api/users"),
    ])
    setTransactions(await txRes.json())
    setUsers(await userRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreate = async (isUserTx: boolean) => {
    const form = isUserTx ? userForm : adminForm
    if (!form.userId || !form.amount) { setError("User and amount are required"); return }
    if (isUserTx && !userForm.toUserId) { setError("Both users are required"); return }
    setSaving(true)
    setError("")
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    isUserTx ? setUserForm(emptyUserForm) : setAdminForm(emptyAdminForm)
    await fetchAll()
    setSaving(false)
  }

  const filtered = transactions.filter(t =>
    t.user.name.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const totalIn = transactions
    .filter(t => t.direction === "USER_PAYS_ME")
    .reduce((s, t) => s + t.amount, 0)

  const totalOut = transactions
    .filter(t => t.direction === "I_PAY_USER")
    .reduce((s, t) => s + t.amount, 0)

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Transaction Management</div>
        <div className="topbar-actions">
          <span style={{ fontSize: 11, color: "var(--green)" }}>+{totalIn.toFixed(2)} in</span>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "0 6px" }}>·</span>
          <span style={{ fontSize: 11, color: "var(--red)" }}>-{totalOut.toFixed(2)} out</span>
        </div>
      </div>

      <div className="page-body fade-in">

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {[
            { key: "admin", label: "User ↔ Admin" },
            { key: "user", label: "User ↔ User" },
          ].map(tab => (
            <button
              key={tab.key}
              className={`btn ${activeTab === tab.key ? "btn-accent" : ""}`}
              onClick={() => { setActiveTab(tab.key as "admin" | "user"); setError("") }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Admin Form */}
        {activeTab === "admin" && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              User to Admin Transaction
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">User *</label>
                <select className="form-select" value={adminForm.userId}
                  onChange={e => setAdminForm({ ...adminForm, userId: e.target.value })}>
                  <option value="">Select user...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Type</label>
                <select className="form-select" value={adminForm.type}
                  onChange={e => setAdminForm({ ...adminForm, type: e.target.value })}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Direction</label>
                <select className="form-select" value={adminForm.direction}
                  onChange={e => setAdminForm({ ...adminForm, direction: e.target.value })}>
                  {DIRECTIONS_ADMIN.map(d => <option key={d} value={d}>{directionLabel[d]}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amount *</label>
                <input className="form-input" type="number" step="0.01" placeholder="0.00"
                  value={adminForm.amount}
                  onChange={e => setAdminForm({ ...adminForm, amount: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Currency</label>
                <select className="form-select" value={adminForm.currency}
                  onChange={e => setAdminForm({ ...adminForm, currency: e.target.value })}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Method</label>
                <select className="form-select" value={adminForm.method}
                  onChange={e => setAdminForm({ ...adminForm, method: e.target.value })}>
                  {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 10, marginBottom: 0 }}>
              <label className="form-label">Description (optional)</label>
              <input className="form-input" placeholder="e.g. Week 8 settlement"
                value={adminForm.description}
                onChange={e => setAdminForm({ ...adminForm, description: e.target.value })} />
            </div>
            {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--red)" }}>{error}</div>}
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-accent" onClick={() => handleCreate(false)} disabled={saving}>
                {saving ? "Creating..." : "+ Create Transaction"}
              </button>
            </div>
          </div>
        )}

        {/* User to User Form */}
        {activeTab === "user" && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              User to User Transaction
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">User 1 *</label>
                <select className="form-select" value={userForm.userId}
                  onChange={e => setUserForm({ ...userForm, userId: e.target.value })}>
                  <option value="">Select user...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">User 2 *</label>
                <select className="form-select" value={userForm.toUserId}
                  onChange={e => setUserForm({ ...userForm, toUserId: e.target.value })}>
                  <option value="">Select user...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Type</label>
                <select className="form-select" value={userForm.type}
                  onChange={e => setUserForm({ ...userForm, type: e.target.value })}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amount *</label>
                <input className="form-input" type="number" step="0.01" placeholder="0.00"
                  value={userForm.amount}
                  onChange={e => setUserForm({ ...userForm, amount: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Currency</label>
                <select className="form-select" value={userForm.currency}
                  onChange={e => setUserForm({ ...userForm, currency: e.target.value })}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Method</label>
                <select className="form-select" value={userForm.method}
                  onChange={e => setUserForm({ ...userForm, method: e.target.value })}>
                  {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 10, marginBottom: 0 }}>
              <label className="form-label">Description (optional)</label>
              <input className="form-input" placeholder="e.g. Transfer"
                value={userForm.description}
                onChange={e => setUserForm({ ...userForm, description: e.target.value })} />
            </div>
            {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--red)" }}>{error}</div>}
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-accent" onClick={() => handleCreate(true)} disabled={saving}>
                {saving ? "Creating..." : "+ Create Transaction"}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: 10 }}>
          <input className="form-input" placeholder="Search transactions..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        </div>

        {/* Table */}
        <div className="card-flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Week</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>No transactions found</td></tr>
              ) : filtered.map(tx => (
                <tr key={tx.id}>
                  <td style={{ color: "var(--text-tertiary)", fontSize: 11, whiteSpace: "nowrap" }}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{tx.user.name}</div>
                    {tx.toUser && (
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>→ {tx.toUser.name}</div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${typeColor[tx.type] || "badge-inactive"}`}>
                      {tx.type.toLowerCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {directionLabel[tx.direction]}
                  </td>
                  <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>{tx.method}</td>
                  <td>
                    <span className={tx.direction === "I_PAY_USER" ? "val-pos" : "val-neg"}>
                      {tx.direction === "I_PAY_USER" ? "+" : "-"}{tx.amount.toFixed(2)} {tx.currency}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {tx.description || <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                  </td>
                  <td style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                    {tx.week ? `W${tx.week.weekNum} ${tx.week.year}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

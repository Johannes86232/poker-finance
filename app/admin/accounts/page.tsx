"use client"

import { useEffect, useState } from "react"

type Account = {
  id: number
  app: string | null
  nickname: string
  accountId: string | null
  superagent: string | null
  agent: string | null
  isActive: boolean
  user: { id: number; name: string; telegramHandle: string | null }
  deals: { rakebackPct: number; rebatePct: number; club: { name: string; currency: string } }[]
}

type User = { id: number; name: string }

const POKER_APPS = ["ClubGG", "Pokerbros", "X-Poker", "Kingspoker", "Pokership", "Other"]
const emptyForm = { userId: "", app: "", nickname: "", accountId: "", superagent: "", agent: "" }

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState(emptyForm)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchAll = async () => {
    setLoading(true)
    const [accRes, userRes] = await Promise.all([
      fetch("/api/accounts"),
      fetch("/api/users"),
    ])
    const accData = await accRes.json()
    setAccounts(Array.isArray(accData) ? accData : [])
    setUsers(await userRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreate = async () => {
    if (!form.userId || !form.nickname.trim()) {
      setError("User and Nickname are required")
      return
    }
    setSaving(true)
    setError("")
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setForm(emptyForm)
    await fetchAll()
    setSaving(false)
  }

  const handleEdit = async () => {
    if (!editAccount) return
    setSaving(true)
    setError("")
    const res = await fetch(`/api/accounts/${editAccount.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editAccount),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setEditAccount(null)
    await fetchAll()
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this account? This cannot be undone.")) return
    await fetch(`/api/accounts/${id}`, { method: "DELETE" })
    await fetchAll()
  }

  const filtered = accounts.filter(a =>
    a.nickname.toLowerCase().includes(search.toLowerCase()) ||
    a.user.name.toLowerCase().includes(search.toLowerCase()) ||
    a.app?.toLowerCase().includes(search.toLowerCase()) ||
    a.accountId?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Account Management</div>
        <div className="topbar-actions">
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            {accounts.filter(a => a.isActive).length} active · {accounts.length} total
          </span>
        </div>
      </div>

      <div className="page-body fade-in">

        {/* Create Form */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            New Account
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">User *</label>
              <select className="form-select" value={form.userId}
                onChange={e => setForm({ ...form, userId: e.target.value })}>
                <option value="">Select user...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">App</label>
              <select className="form-select" value={form.app}
                onChange={e => setForm({ ...form, app: e.target.value })}>
                <option value="">Select app...</option>
                {POKER_APPS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nickname *</label>
              <input className="form-input" placeholder="In-game nickname" value={form.nickname}
                onChange={e => setForm({ ...form, nickname: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Account ID</label>
              <input className="form-input" placeholder="Platform account ID" value={form.accountId}
                onChange={e => setForm({ ...form, accountId: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Superagent</label>
              <input className="form-input" placeholder="Optional" value={form.superagent}
                onChange={e => setForm({ ...form, superagent: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Agent</label>
              <input className="form-input" placeholder="Optional" value={form.agent}
                onChange={e => setForm({ ...form, agent: e.target.value })} />
            </div>
          </div>
          {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--red)" }}>{error}</div>}
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-accent" onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "+ Create Account"}
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {editAccount && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
          }}>
            <div className="card" style={{ width: 480 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Edit Account</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 14 }}>
                {editAccount.user.name}
              </div>
              <div className="form-group">
                <label className="form-label">App</label>
                <select className="form-select" value={editAccount.app || ""}
                  onChange={e => setEditAccount({ ...editAccount, app: e.target.value })}>
                  <option value="">Select app...</option>
                  {POKER_APPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nickname</label>
                <input className="form-input" value={editAccount.nickname}
                  onChange={e => setEditAccount({ ...editAccount, nickname: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Account ID</label>
                <input className="form-input" value={editAccount.accountId || ""}
                  onChange={e => setEditAccount({ ...editAccount, accountId: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Superagent</label>
                <input className="form-input" value={editAccount.superagent || ""}
                  onChange={e => setEditAccount({ ...editAccount, superagent: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Agent</label>
                <input className="form-input" value={editAccount.agent || ""}
                  onChange={e => setEditAccount({ ...editAccount, agent: e.target.value })} />
              </div>
              {error && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => { setEditAccount(null); setError("") }}>Cancel</button>
                <button className="btn btn-accent" onClick={handleEdit} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: 10 }}>
          <input className="form-input" placeholder="Search by nickname, user or app..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        </div>

        {/* Table */}
        <div className="card-flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>App</th>
                <th>Nickname</th>
                <th>Account ID</th>
                <th>Superagent</th>
                <th>Clubs / Deals</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>No accounts found</td></tr>
              ) : filtered.map(acc => (
                <tr key={acc.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="avatar" style={{ fontSize: 9 }}>{acc.user.name[0]}</div>
                      <div>
                        <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{acc.user.name}</div>
                        {acc.user.telegramHandle && (
                          <div style={{ fontSize: 10, color: "var(--accent)" }}>{acc.user.telegramHandle}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {acc.app
                      ? <span className="badge badge-accent">{acc.app}</span>
                      : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                  </td>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{acc.nickname}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-secondary)" }}>
                    {acc.accountId || <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                    {acc.superagent || <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                  </td>
                  <td>
                    {acc.deals.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {acc.deals.map((d, i) => (
                          <div key={i} style={{ fontSize: 11 }}>
                            <span style={{ color: "var(--text-secondary)" }}>{d.club.name}</span>
                            <span className="val-pos" style={{ marginLeft: 6 }}>{d.rakebackPct}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>No deals</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${acc.isActive ? "badge-active" : "badge-inactive"}`}>
                      {acc.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn" onClick={() => { setEditAccount(acc); setError("") }}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(acc.id)}>Delete</button>
                    </div>
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

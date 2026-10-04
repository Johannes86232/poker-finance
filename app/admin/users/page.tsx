"use client"

import { useEffect, useState } from "react"

type User = {
  id: number
  name: string
  telegramId: string | null
  telegramHandle: string | null
  role: string
  isActive: boolean
  createdAt: string
  _count?: { accounts: number; transactions: number }
  balance?: { amountUsd: number; amountEur: number } | null
}

const emptyForm = { name: "", telegramId: "", telegramHandle: "", role: "USER" }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState(emptyForm)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch("/api/users")
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) { setError("Name is required"); return }
    setSaving(true)
    setError("")
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setForm(emptyForm)
    await fetchUsers()
    setSaving(false)
  }

  const handleEdit = async () => {
    if (!editUser) return
    setSaving(true)
    setError("")
    const res = await fetch(`/api/users/${editUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUser),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setEditUser(null)
    await fetchUsers()
    setSaving(false)
  }

  const handleToggleActive = async (user: User) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    })
    if (res.ok) await fetchUsers()
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete "${user.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" })
    if (res.ok) await fetchUsers()
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.telegramHandle?.toLowerCase().includes(search.toLowerCase()) ||
    u.telegramId?.includes(search)
  )

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">User Management</div>
        <div className="topbar-actions">
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            {users.filter(u => u.isActive).length} active · {users.length} total
          </span>
        </div>
      </div>

      <div className="page-body fade-in">

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            New User
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 120px", gap: 10, alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Name *</label>
              <input className="form-input" placeholder="Max Mustermann" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Telegram ID</label>
              <input className="form-input" placeholder="123456789" value={form.telegramId}
                onChange={e => setForm({ ...form, telegramId: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Telegram Handle</label>
              <input className="form-input" placeholder="@maxmuster" value={form.telegramHandle}
                onChange={e => setForm({ ...form, telegramHandle: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="USER">User</option>
                <option value="STAFF">Staff</option>
                <option value="EXECUTIVE">Executive</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--red)" }}>{error}</div>}
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-accent" onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "+ Create User"}
            </button>
          </div>
        </div>

        {editUser && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
          }}>
            <div className="card" style={{ width: 480 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Edit User</div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={editUser.name}
                  onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Telegram ID</label>
                <input className="form-input" value={editUser.telegramId || ""}
                  onChange={e => setEditUser({ ...editUser, telegramId: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Telegram Handle</label>
                <input className="form-input" placeholder="@maxmuster" value={editUser.telegramHandle || ""}
                  onChange={e => setEditUser({ ...editUser, telegramHandle: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={editUser.role}
                  onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                  <option value="USER">User</option>
                  <option value="STAFF">Staff</option>
                  <option value="EXECUTIVE">Executive</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {error && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => { setEditUser(null); setError("") }}>Cancel</button>
                <button className="btn btn-accent" onClick={handleEdit} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <input className="form-input" placeholder="Search by name or @handle..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        </div>

        <div className="card-flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Telegram</th>
                <th>Role</th>
                <th>Accounts</th>
                <th>Balance USD</th>
                <th>Balance EUR</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>No users found</td></tr>
              ) : filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar" style={{ fontSize: 9 }}>{user.name[0]}</div>
                      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      {user.telegramHandle && (
                        <div style={{ fontSize: 12, color: "var(--accent)" }}>{user.telegramHandle}</div>
                      )}
                      {user.telegramId && (
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "monospace" }}>{user.telegramId}</div>
                      )}
                      {!user.telegramHandle && !user.telegramId && (
                        <span style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.role === "ADMIN" ? "badge-accent" : "badge-inactive"}`}>
                      {user.role.toLowerCase()}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{user._count?.accounts ?? 0}</td>
                  <td>
                    {user.balance ? (
                      <span className={user.balance.amountUsd >= 0 ? "val-pos" : "val-neg"}>
                        {user.balance.amountUsd >= 0 ? "+" : ""}{user.balance.amountUsd.toFixed(2)}
                      </span>
                    ) : <span className="val-muted">—</span>}
                  </td>
                  <td>
                    {user.balance ? (
                      <span className={user.balance.amountEur >= 0 ? "val-pos" : "val-neg"}>
                        {user.balance.amountEur >= 0 ? "+" : ""}{user.balance.amountEur.toFixed(2)}
                      </span>
                    ) : <span className="val-muted">—</span>}
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? "badge-active" : "badge-inactive"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn" onClick={() => { setEditUser(user); setError("") }}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(user)}>Delete</button>
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

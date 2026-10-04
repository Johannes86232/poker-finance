"use client"

import { useEffect, useState } from "react"

type Deal = {
  id: number
  rakebackPct: number
  rebatePct: number
  isActive: boolean
  account: {
    id: number
    nickname: string
    user: { id: number; name: string; telegramHandle: string | null }
  }
  club: { id: number; name: string; currency: string; app: string | null }
}

type User = { id: number; name: string }

type Club = { id: number; name: string; currency: string }

const emptyForm = { userId: "", clubId: "", rakebackPct: "50", rebatePct: "0" }

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState(emptyForm)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

const fetchAll = async () => {
    setLoading(true)
    const [dealRes, userRes, clubRes] = await Promise.all([
      fetch("/api/deals"),
      fetch("/api/users"),
      fetch("/api/clubs"),
    ])
    const dealData = await dealRes.json()
    const userData = await userRes.json()
    const clubData = await clubRes.json()
    setDeals(Array.isArray(dealData) ? dealData : [])
    setUsers(Array.isArray(userData) ? userData : [])
    setClubs(Array.isArray(clubData) ? clubData : [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreate = async () => {
    if (!form.userId || !form.clubId) { setError("User and Club are required"); return }
    setSaving(true)
    setError("")
    const res = await fetch("/api/deals", {
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
    if (!editDeal) return
    setSaving(true)
    setError("")
    const res = await fetch(`/api/deals/${editDeal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDeal),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setEditDeal(null)
    await fetchAll()
    setSaving(false)
  }

  const handleToggle = async (deal: Deal) => {
    await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !deal.isActive }),
    })
    await fetchAll()
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this deal?")) return
    await fetch(`/api/deals/${id}`, { method: "DELETE" })
    await fetchAll()
  }

  const filtered = deals.filter(d =>
    d.account.nickname.toLowerCase().includes(search.toLowerCase()) ||
    d.account.user.name.toLowerCase().includes(search.toLowerCase()) ||
    d.club.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Deal Management</div>
        <div className="topbar-actions">
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            {deals.filter(d => d.isActive).length} active · {deals.length} total
          </span>
        </div>
      </div>

      <div className="page-body fade-in">

        {/* Create Form */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            New Deal
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 120px", gap: 10, alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">User *</label>
              <select className="form-select" value={form.userId}
                onChange={e => setForm({ ...form, userId: e.target.value })}>
                <option value="">Select user...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Club *</label>
              <select className="form-select" value={form.clubId}
                onChange={e => setForm({ ...form, clubId: e.target.value })}>
                <option value="">Select club...</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name} ({c.currency})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rakeback %</label>
              <input className="form-input" type="number" step="0.5" min="0" max="100"
                value={form.rakebackPct}
                onChange={e => setForm({ ...form, rakebackPct: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rebate %</label>
              <input className="form-input" type="number" step="0.5" min="0" max="100"
                value={form.rebatePct}
                onChange={e => setForm({ ...form, rebatePct: e.target.value })} />
            </div>
          </div>
          {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--red)" }}>{error}</div>}
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-accent" onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "+ Create Deal"}
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {editDeal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
          }}>
            <div className="card" style={{ width: 400 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Edit Deal</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>
                {editDeal.account.user.name} · {editDeal.account.nickname} @ {editDeal.club.name}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Rakeback %</label>
                  <input className="form-input" type="number" step="0.5" min="0" max="100"
                    value={editDeal.rakebackPct}
                    onChange={e => setEditDeal({ ...editDeal, rakebackPct: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rebate %</label>
                  <input className="form-input" type="number" step="0.5" min="0" max="100"
                    value={editDeal.rebatePct}
                    onChange={e => setEditDeal({ ...editDeal, rebatePct: parseFloat(e.target.value) })} />
                </div>
              </div>
              {error && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => { setEditDeal(null); setError("") }}>Cancel</button>
                <button className="btn btn-accent" onClick={handleEdit} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: 10 }}>
          <input className="form-input" placeholder="Search by account, user or club..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        </div>

        {/* Table */}
        <div className="card-flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Club</th>
                <th>Rakeback %</th>
                <th>Rebate %</th>
                <th>Net Deal</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>No deals found</td></tr>
              ) : filtered.map(deal => (
                <tr key={deal.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="avatar" style={{ fontSize: 9 }}>{deal.account.user.name[0]}</div>
                      <div>
                        <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{deal.account.user.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{deal.account.nickname}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ color: "var(--text-secondary)" }}>{deal.club.name}</div>
                    {deal.club.app && <span className="badge badge-accent" style={{ fontSize: 9 }}>{deal.club.app}</span>}
                  </td>
                  <td><span className="val-pos">{(deal.rakebackPct * 100).toFixed(1)}%</span></td>
                  <td><span style={{ color: "var(--amber)" }}>{(deal.rebatePct * 100).toFixed(1)}%</span></td>
                  <td>
                    <span className="val-pos">{((deal.rakebackPct + deal.rebatePct) * 100).toFixed(1)}%</span>
                  </td>
                  <td>
                    <span className={`badge ${deal.isActive ? "badge-active" : "badge-inactive"}`}>
                      {deal.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn" onClick={() => { setEditDeal(deal); setError("") }}>Edit</button>
                      <button className={`btn ${deal.isActive ? "btn-warning" : "btn-success"}`}
                        onClick={() => handleToggle(deal)}>
                        {deal.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(deal.id)}>Delete</button>
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

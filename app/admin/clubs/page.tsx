"use client"

import { useEffect, useState } from "react"

type Club = {
  id: number
  name: string
  app: string | null
  currency: string
  calcType: string
  chipValue: number
  isActive: boolean
  _count?: { accounts: number }
}

const POKER_APPS = ["ClubGG", "Pokerbros", "X-Poker", "Kingspoker", "Pokership", "Other"]

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ name: "", app: "", currency: "USD", calcType: "STANDARD", chipValue: "1" })
  const [editClub, setEditClub] = useState<Club | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

const fetchClubs = async () => {
  setLoading(true)
  const res = await fetch("/api/clubs")
  const data = await res.json()
  setClubs(Array.isArray(data) ? data : [])
  setLoading(false)
}

  useEffect(() => { fetchClubs() }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) { setError("Club name is required"); return }
    setSaving(true)
    setError("")
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setForm({ name: "", app: "", currency: "USD", calcType: "STANDARD", chipValue: "1" })
    await fetchClubs()
    setSaving(false)
  }

  const handleEdit = async () => {
    if (!editClub) return
    setSaving(true)
    setError("")
    const res = await fetch(`/api/clubs/${editClub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editClub),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setEditClub(null)
    await fetchClubs()
    setSaving(false)
  }
const handleDelete = async (id: number) => {
  if (!confirm("Delete this club?")) return
  await fetch(`/api/clubs/${id}`, { method: "DELETE" })
  await fetchClubs()
}
  const handleToggle = async (club: Club) => {
    await fetch(`/api/clubs/${club.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !club.isActive }),
    })
    await fetchClubs()
  }

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.app?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Club Management</div>
        <div className="topbar-actions">
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            {clubs.filter(c => c.isActive).length} active
          </span>
        </div>
      </div>

      <div className="page-body fade-in">

        {/* Create Form */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            New Club
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 160px 100px", gap: 10, alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Club Name *</label>
              <input className="form-input" placeholder="e.g. Westworld" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                onKeyDown={e => e.key === "Enter" && handleCreate()} />
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
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value })}>
                <option>USD</option>
                <option>EUR</option>
                <option>AED</option>
                <option>GBP</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Calc Type</label>
              <select className="form-select" value={form.calcType}
                onChange={e => setForm({ ...form, calcType: e.target.value })}>
                <option value="STANDARD">Standard</option>
                <option value="ADJUSTED">Adjusted</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Chip Value</label>
              <input className="form-input" type="number" step="0.01" value={form.chipValue}
                onChange={e => setForm({ ...form, chipValue: e.target.value })} />
            </div>
          </div>
          {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--red)" }}>{error}</div>}
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-accent" onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "+ Create Club"}
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {editClub && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
          }}>
            <div className="card" style={{ width: 480 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Edit Club</div>
              <div className="form-group">
                <label className="form-label">Club Name</label>
                <input className="form-input" value={editClub.name}
                  onChange={e => setEditClub({ ...editClub, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">App</label>
                <select className="form-select" value={editClub.app || ""}
                  onChange={e => setEditClub({ ...editClub, app: e.target.value })}>
                  <option value="">Select app...</option>
                  {POKER_APPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" value={editClub.currency}
                  onChange={e => setEditClub({ ...editClub, currency: e.target.value })}>
                  <option>USD</option><option>EUR</option><option>AED</option><option>GBP</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Calc Type</label>
                <select className="form-select" value={editClub.calcType}
                  onChange={e => setEditClub({ ...editClub, calcType: e.target.value })}>
                  <option value="STANDARD">Standard</option>
                  <option value="ADJUSTED">Adjusted</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Chip Value</label>
                <input className="form-input" type="number" step="0.01" value={editClub.chipValue}
                  onChange={e => setEditClub({ ...editClub, chipValue: parseFloat(e.target.value) })} />
              </div>
              {error && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => { setEditClub(null); setError("") }}>Cancel</button>
                <button className="btn btn-accent" onClick={handleEdit} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: 10 }}>
          <input className="form-input" placeholder="Search clubs..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        </div>

        {/* Table */}
        <div className="card-flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>App</th>
                <th>Currency</th>
                <th>Calc</th>
                <th>Chip</th>
                <th>Accounts</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>No clubs found</td></tr>
              ) : filtered.map(club => (
                <tr key={club.id}>
                  <td style={{ color: "var(--text-tertiary)" }}>{club.id}</td>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{club.name}</td>
                  <td>
                    {club.app
                      ? <span className="badge badge-accent">{club.app}</span>
                      : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                  </td>
                  <td><span className="badge badge-inactive">{club.currency}</span></td>
                  <td style={{ color: "var(--text-secondary)" }}>{club.calcType}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{club.chipValue}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{club._count?.accounts ?? 0}</td>
                  <td>
                    <span className={`badge ${club.isActive ? "badge-active" : "badge-inactive"}`}>
                      {club.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn" onClick={() => { setEditClub(club); setError("") }}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(club.id)}>
  Delete
</button>
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

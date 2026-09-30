"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/Sidebar"

interface Partner {
  id: number
  name: string
}

interface Club {
  id: number
  name: string
  app: string | null
  currency: string
  calcType: string
  chipValue: number
  isActive: boolean
  partnerId: number | null
  partner: Partner | null
  _count: { deals: number }
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editClub, setEditClub] = useState<Club | null>(null)

  const [form, setForm] = useState({
    name: "", app: "", currency: "USD", calcType: "STANDARD",
    chipValue: "1", partnerId: "",
  })

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const [c, p] = await Promise.all([
      fetch("/api/clubs").then(r => r.json()),
      fetch("/api/partners").then(r => r.json()),
    ])
    setClubs(c)
    setPartners(Array.isArray(p) ? p : [])
    setLoading(false)
  }

  function openCreate() {
    setForm({ name: "", app: "", currency: "USD", calcType: "STANDARD", chipValue: "1", partnerId: "" })
    setShowCreate(true)
    setEditClub(null)
  }

  function openEdit(club: Club) {
    setForm({
      name: club.name,
      app: club.app || "",
      currency: club.currency,
      calcType: club.calcType,
      chipValue: String(club.chipValue),
      partnerId: club.partnerId ? String(club.partnerId) : "",
    })
    setEditClub(club)
    setShowCreate(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        app: form.app || null,
        currency: form.currency,
        calcType: form.calcType,
        chipValue: parseFloat(form.chipValue) || 1,
        partnerId: form.partnerId ? parseInt(form.partnerId) : null,
      }),
    })
    if (res.ok) {
      setShowCreate(false)
      fetchAll()
    } else {
      const err = await res.json()
      alert("Error: " + (err.error || "unknown"))
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editClub) return
    const res = await fetch("/api/clubs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editClub.id,
        name: form.name,
        app: form.app || null,
        currency: form.currency,
        calcType: form.calcType,
        chipValue: parseFloat(form.chipValue) || 1,
        partnerId: form.partnerId ? parseInt(form.partnerId) : null,
      }),
    })
    if (res.ok) {
      setEditClub(null)
      fetchAll()
    } else {
      const err = await res.json()
      alert("Error: " + (err.error || "unknown"))
    }
  }

  async function toggleActive(club: Club) {
    await fetch("/api/clubs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: club.id, isActive: !club.isActive }),
    })
    fetchAll()
  }

  const partnerField = (
    <div className="form-group">
      <label>Partner (Upline)</label>
      <select
        value={form.partnerId}
        onChange={e => setForm(f => ({ ...f, partnerId: e.target.value }))}
        className="form-input"
      >
        <option value="">-- no partner --</option>
        {partners.map(p => (
          <option key={p.id} value={String(p.id)}>{p.name}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="topbar">
          <h1 className="topbar-title">Clubs</h1>
          <button className="btn-primary" onClick={openCreate}>+ New Club</button>
        </div>

        {showCreate && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 16 }}>Create Club</h2>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input className="form-input" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>App</label>
                  <input className="form-input" value={form.app}
                    onChange={e => setForm(f => ({ ...f, app: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select className="form-input" value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Calc Type</label>
                  <select className="form-input" value={form.calcType}
                    onChange={e => setForm(f => ({ ...f, calcType: e.target.value }))}>
                    <option value="STANDARD">Standard</option>
                    <option value="ADJUSTED">Adjusted</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Chip Value</label>
                  <input className="form-input" type="number" step="0.01" value={form.chipValue}
                    onChange={e => setForm(f => ({ ...f, chipValue: e.target.value }))} />
                </div>
                {partnerField}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" className="btn-primary">Create</button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {editClub && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 16 }}>Edit: {editClub.name}</h2>
            <form onSubmit={handleEdit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input className="form-input" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>App</label>
                  <input className="form-input" value={form.app}
                    onChange={e => setForm(f => ({ ...f, app: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select className="form-input" value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Calc Type</label>
                  <select className="form-input" value={form.calcType}
                    onChange={e => setForm(f => ({ ...f, calcType: e.target.value }))}>
                    <option value="STANDARD">Standard</option>
                    <option value="ADJUSTED">Adjusted</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Chip Value</label>
                  <input className="form-input" type="number" step="0.01" value={form.chipValue}
                    onChange={e => setForm(f => ({ ...f, chipValue: e.target.value }))} />
                </div>
                {partnerField}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" className="btn-secondary" onClick={() => setEditClub(null)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>App</th>
                  <th>Currency</th>
                  <th>Partner</th>
                  <th>Deals</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map(club => (
                  <tr key={club.id}>
                    <td><strong>{club.name}</strong></td>
                    <td>{club.app || "—"}</td>
                    <td>{club.currency}</td>
                    <td>{club.partner?.name || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                    <td>{club._count.deals}</td>
                    <td>
                      <span className={`badge ${club.isActive ? "badge-green" : "badge-gray"}`}>
                        {club.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => openEdit(club)} title="Edit">
                        <i className="ti ti-pencil" />
                      </button>
                      <button className="btn-icon" onClick={() => toggleActive(club)}
                        title={club.isActive ? "Deactivate" : "Activate"}>
                        <i className={`ti ${club.isActive ? "ti-toggle-right" : "ti-toggle-left"}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
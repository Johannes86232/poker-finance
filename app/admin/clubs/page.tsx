"use client"

import { useEffect, useState, useRef } from "react"

interface Partner { id: number; name: string }
interface Club {
  id: number; name: string; app: string | null; currency: string
  calcType: string; chipValue: number; isActive: boolean
  partnerId: number | null; partner: Partner | null; _count: { deals: number }
}

const btn: React.CSSProperties = {
  padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer",
  fontWeight: 600, fontSize: 14
}
const btnPrimary: React.CSSProperties = { ...btn, background: "#6366f1", color: "#fff" }
const btnSecondary: React.CSSProperties = { ...btn, background: "#374151", color: "#e5e7eb" }
const btnDanger: React.CSSProperties = { ...btn, background: "#dc2626", color: "#fff", padding: "6px 12px" }
const btnGreen: React.CSSProperties = { ...btn, background: "#16a34a", color: "#fff", padding: "6px 12px" }
const input: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 6,
  border: "1px solid #374151", background: "#1f2937", color: "#f9fafb",
  fontSize: 14, boxSizing: "border-box"
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editClub, setEditClub] = useState<Club | null>(null)
  const [search, setSearch] = useState("")
  const formRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState({ name: "", app: "", currency: "USD", calcType: "STANDARD", chipValue: "1", partnerId: "" })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [c, p] = await Promise.all([
      fetch("/api/clubs").then(r => r.json()),
      fetch("/api/partners").then(r => r.json()),
    ])
    setClubs(Array.isArray(c) ? c : [])
    setPartners(Array.isArray(p) ? p : [])
    setLoading(false)
  }

  function openCreate() {
    setForm({ name: "", app: "", currency: "USD", calcType: "STANDARD", chipValue: "1", partnerId: "" })
    setEditClub(null)
    setShowCreate(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  function openEdit(club: Club) {
    setForm({ name: club.name, app: club.app || "", currency: club.currency, calcType: club.calcType, chipValue: String(club.chipValue), partnerId: club.partnerId ? String(club.partnerId) : "" })
    setShowCreate(false)
    setEditClub(club)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  async function submitCreate() {
    const res = await fetch("/api/clubs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, app: form.app || null, currency: form.currency, calcType: form.calcType, chipValue: parseFloat(form.chipValue) || 1, partnerId: form.partnerId ? parseInt(form.partnerId) : null }),
    })
    if (res.ok) { setShowCreate(false); fetchAll() }
    else { const err = await res.json(); alert("Error: " + (err.error || "unknown")) }
  }

  async function submitEdit() {
    if (!editClub) return
    const res = await fetch("/api/clubs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editClub.id, name: form.name, app: form.app || null, currency: form.currency, calcType: form.calcType, chipValue: parseFloat(form.chipValue) || 1, partnerId: form.partnerId ? parseInt(form.partnerId) : null }),
    })
    if (res.ok) { setEditClub(null); fetchAll() }
    else { const err = await res.json(); alert("Error: " + (err.error || "unknown")) }
  }

  async function toggleActive(club: Club) {
    await fetch("/api/clubs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: club.id, isActive: !club.isActive }),
    })
    fetchAll()
  }

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.app || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.partner?.name || "").toLowerCase().includes(search.toLowerCase())
  )

  const formFields = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {[
        { label: "Name *", key: "name", type: "text" },
        { label: "App", key: "app", type: "text" },
        { label: "Chip Value", key: "chipValue", type: "number" },
      ].map(({ label, key, type }) => (
        <div key={key}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#9ca3af" }}>{label}</label>
          <input style={input} type={type} value={form[key as keyof typeof form]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
        </div>
      ))}
      <div>
        <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#9ca3af" }}>Currency</label>
        <select style={input} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#9ca3af" }}>Calc Type</label>
        <select style={input} value={form.calcType} onChange={e => setForm(f => ({ ...f, calcType: e.target.value }))}>
          <option value="STANDARD">Standard</option>
          <option value="ADJUSTED">Adjusted</option>
        </select>
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#9ca3af" }}>Partner (Upline)</label>
        <select style={input} value={form.partnerId} onChange={e => setForm(f => ({ ...f, partnerId: e.target.value }))}>
          <option value="">-- no partner --</option>
          {partners.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
        </select>
      </div>
    </div>
  )

  return (
    <div className="page-layout">
      <div className="page-content">
        <div className="topbar">
          <h1 className="topbar-title">Clubs</h1>
          <button style={btnPrimary} onClick={openCreate}>+ New Club</button>
        </div>

        <div ref={formRef}>
          {(showCreate || editClub) && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h2 style={{ marginBottom: 16 }}>{showCreate ? "Create Club" : `Edit: ${editClub!.name}`}</h2>
              {formFields}
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button style={btnPrimary} onClick={() => { alert("clicked"); if (showCreate) submitCreate(); else submitEdit(); }}>
                  {showCreate ? "Create" : "Save"}
                </button>
                <button style={btnSecondary} onClick={() => { setShowCreate(false); setEditClub(null) }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
          <input style={{ ...input, margin: 0 }} placeholder="Search clubs, app, partner..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <p>Loading...</p> : (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>App</th><th>Currency</th><th>Partner</th>
                  <th>Deals</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(club => (
                  <tr key={club.id}>
                    <td><strong>{club.name}</strong></td>
                    <td>{club.app || "—"}</td>
                    <td>{club.currency}</td>
                    <td>{club.partner?.name || "—"}</td>
                    <td>{club._count.deals}</td>
                    <td>
                      <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: club.isActive ? "#166534" : "#374151", color: club.isActive ? "#86efac" : "#9ca3af" }}>
                        {club.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button style={btnSecondary} onClick={() => openEdit(club)}>Edit</button>
                      <button style={club.isActive ? btnDanger : btnGreen} onClick={() => toggleActive(club)}>
                        {club.isActive ? "Deactivate" : "Activate"}
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
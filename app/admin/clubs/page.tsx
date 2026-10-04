"use client"

import { useEffect, useState, useRef } from "react"

interface Partner { id: number; name: string }
interface Club {
  id: number; name: string; app: string | null; currency: string
  calcType: string; chipValue: number; isActive: boolean
  partnerId: number | null; partner: Partner | null
  partnerRakebackPct: number; partnerRebatePct: number
  _count: { deals: number }
}

const POKER_APPS = ["ClubGG", "Pokerbros", "X-Poker", "Kingspoker", "Pokership", "Other"]

const btn: React.CSSProperties = { padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14 }
const btnPrimary: React.CSSProperties = { ...btn, background: "#6366f1", color: "#fff" }
const btnSecondary: React.CSSProperties = { ...btn, background: "#374151", color: "#e5e7eb" }
const btnDanger: React.CSSProperties = { ...btn, background: "#dc2626", color: "#fff", padding: "6px 12px" }
const btnGreen: React.CSSProperties = { ...btn, background: "#16a34a", color: "#fff", padding: "6px 12px" }
const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#f9fafb", fontSize: 14, boxSizing: "border-box" }

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editClub, setEditClub] = useState<Club | null>(null)
  const [search, setSearch] = useState("")
  const formRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState({ name: "", app: "", currency: "USD", calcType: "STANDARD", chipValue: "1", partnerId: "", partnerRakebackPct: "", partnerRebatePct: "" })

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
    setForm({ name: "", app: "", currency: "USD", calcType: "STANDARD", chipValue: "1", partnerId: "", partnerRakebackPct: "", partnerRebatePct: "" })
    setEditClub(null); setShowCreate(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  function openEdit(club: Club) {
    setForm({
      name: club.name, app: club.app || "", currency: club.currency, calcType: club.calcType,
      chipValue: String(club.chipValue), partnerId: club.partnerId ? String(club.partnerId) : "",
      partnerRakebackPct: club.partnerRakebackPct ? String(Math.round(club.partnerRakebackPct * 100)) : "",
      partnerRebatePct: club.partnerRebatePct ? String(Math.round(club.partnerRebatePct * 100)) : "",
    })
    setShowCreate(false); setEditClub(club)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  async function submitCreate() {
    const res = await fetch("/api/clubs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, chipValue: parseFloat(form.chipValue) || 1, partnerId: form.partnerId ? parseInt(form.partnerId) : null }),
    })
    if (res.ok) { setShowCreate(false); fetchAll() }
    else { const err = await res.json(); alert("Error: " + (err.error || "unknown")) }
  }

  async function submitEdit() {
    if (!editClub) return
    const res = await fetch("/api/clubs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editClub.id, ...form, chipValue: parseFloat(form.chipValue) || 1, partnerId: form.partnerId ? parseInt(form.partnerId) : null }),
    })
    if (res.ok) { setEditClub(null); fetchAll() }
    else { const err = await res.json(); alert("Error: " + (err.error || "unknown")) }
  }

  async function toggleActive(club: Club) {
    await fetch("/api/clubs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: club.id, isActive: !club.isActive }) })
    fetchAll()
  }

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.app || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.partner?.name || "").toLowerCase().includes(search.toLowerCase())
  )

  const f = (key: keyof typeof form) => (
    <input style={inp} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
  )
  const label = (text: string) => <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#9ca3af" }}>{text}</label>

  const formFields = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>{label("Name *")}{f("name")}</div>
      <div>
        {label("App")}
        <select style={inp} value={form.app} onChange={e => setForm(p => ({ ...p, app: e.target.value }))}>
          <option value="">Select app...</option>
          {POKER_APPS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>{label("Chip Value")}{f("chipValue")}</div>
      <div>
        {label("Currency")}
        <select style={inp} value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div>
        {label("Partner (Upline)")}
        <select style={inp} value={form.partnerId} onChange={e => setForm(p => ({ ...p, partnerId: e.target.value }))}>
          <option value="">-- no partner --</option>
          {partners.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
        </select>
      </div>
      <div>{label("Partner RB % (e.g. 70)")}{f("partnerRakebackPct")}</div>
      <div>{label("Partner Rebate % (e.g. 0)")}{f("partnerRebatePct")}</div>
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
                <button style={btnPrimary} onClick={showCreate ? submitCreate : submitEdit}>{showCreate ? "Create" : "Save"}</button>
                <button style={btnSecondary} onClick={() => { setShowCreate(false); setEditClub(null) }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
          <input style={{ ...inp, margin: 0 }} placeholder="Search clubs, app, partner..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <p>Loading...</p> : (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>App</th><th>Currency</th><th>Partner</th>
                  <th>Partner RB%</th><th>Deals</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(club => (
                  <tr key={club.id}>
                    <td><strong>{club.name}</strong></td>
                    <td>{club.app || "—"}</td>
                    <td>{club.currency}</td>
                    <td>{club.partner?.name || "—"}</td>
                    <td>{club.partnerRakebackPct ? `${Math.round(club.partnerRakebackPct * 100)}%` : "—"}</td>
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
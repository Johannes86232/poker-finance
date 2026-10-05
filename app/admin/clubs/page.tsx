"use client"

import { useEffect, useState, useRef } from "react"

interface User { id: number; name: string }
interface Club {
  id: number; name: string; app: string | null; currency: string
  calcType: string; chipValue: number; isActive: boolean
  uplineUserId: number | null; uplineUser: User | null
  uplineRakebackPct: number; uplineRebatePct: number
  rebateOnRakeback: boolean; rebateOn100Rake: boolean
  referrerUserId: number | null; referrerUser: User | null
  referrerRakebackPct: number; referrerRebatePct: number
  _count: { deals: number }
}

const POKER_APPS = ["ClubGG", "Pokerbros", "X-Poker", "Kingspoker", "Pokership", "Other"]
const CURRENCIES = ["USD", "EUR", "CNY", "PHP", "THB", "VND", "MYR", "KRW", "JPY", "INR", "BRL", "USDT"]

const btn: React.CSSProperties = { padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14 }
const btnPrimary: React.CSSProperties = { ...btn, background: "#6366f1", color: "#fff" }
const btnSecondary: React.CSSProperties = { ...btn, background: "#374151", color: "#e5e7eb" }
const btnDanger: React.CSSProperties = { ...btn, background: "#dc2626", color: "#fff", padding: "6px 12px" }
const btnGreen: React.CSSProperties = { ...btn, background: "#16a34a", color: "#fff", padding: "6px 12px" }
const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#f9fafb", fontSize: 14, boxSizing: "border-box" }

const emptyForm = {
  name: "", app: "", currency: "USD", calcType: "STANDARD", chipValue: "1",
  uplineUserId: "", uplineRakebackPct: "", uplineRebatePct: "",
  rebateOnRakeback: false, rebateOn100Rake: false,
  referrerUserId: "", referrerRakebackPct: "", referrerRebatePct: "",
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editClub, setEditClub] = useState<Club | null>(null)
  const [search, setSearch] = useState("")
  const formRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [c, u] = await Promise.all([
      fetch("/api/clubs").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
    ])
    setClubs(Array.isArray(c) ? c : [])
    setUsers(Array.isArray(u) ? u : [])
    setLoading(false)
  }

  function openCreate() {
    setForm(emptyForm)
    setEditClub(null); setShowCreate(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  function openEdit(club: Club) {
    setForm({
      name: club.name, app: club.app || "", currency: club.currency, calcType: club.calcType,
      chipValue: String(club.chipValue),
      uplineUserId: club.uplineUserId ? String(club.uplineUserId) : "",
      uplineRakebackPct: club.uplineRakebackPct ? String(Math.round(club.uplineRakebackPct * 100)) : "",
      uplineRebatePct: club.uplineRebatePct ? String(Math.round(club.uplineRebatePct * 100)) : "",
      rebateOnRakeback: club.rebateOnRakeback ?? false,
      rebateOn100Rake: club.rebateOn100Rake ?? false,
      referrerUserId: club.referrerUserId ? String(club.referrerUserId) : "",
      referrerRakebackPct: club.referrerRakebackPct ? String(Math.round(club.referrerRakebackPct * 100)) : "",
      referrerRebatePct: club.referrerRebatePct ? String(Math.round(club.referrerRebatePct * 100)) : "",
    })
    setShowCreate(false); setEditClub(club)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  async function submitCreate() {
    const res = await fetch("/api/clubs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, chipValue: parseFloat(form.chipValue) || 1, uplineUserId: form.uplineUserId ? parseInt(form.uplineUserId) : null, referrerUserId: form.referrerUserId ? parseInt(form.referrerUserId) : null }),
    })
    if (res.ok) { setShowCreate(false); fetchAll() }
    else { const err = await res.json(); alert("Error: " + (err.error || "unknown")) }
  }

  async function submitEdit() {
    if (!editClub) return
    const res = await fetch("/api/clubs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editClub.id, ...form, chipValue: parseFloat(form.chipValue) || 1, uplineUserId: form.uplineUserId ? parseInt(form.uplineUserId) : null, referrerUserId: form.referrerUserId ? parseInt(form.referrerUserId) : null }),
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
    (c.uplineUser?.name || "").toLowerCase().includes(search.toLowerCase())
  )

  const label = (text: string) => <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#9ca3af" }}>{text}</label>

  const Toggle = ({ field, label: lbl }: { field: "rebateOnRakeback" | "rebateOn100Rake", label: string }) => {
    const on = form[field] as boolean
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 6, border: "1px solid #374151", background: "#1f2937" }}>
        <div
          onClick={() => setForm(p => ({ ...p, [field]: !p[field] }))}
          style={{ width: 36, height: 20, borderRadius: 10, cursor: "pointer", position: "relative", flexShrink: 0, background: on ? "#6366f1" : "#374151", transition: "background 0.2s" }}
        >
          <div style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
        </div>
        <span style={{ fontSize: 13, color: on ? "#f9fafb" : "#9ca3af" }}>{lbl}</span>
      </div>
    )
  }

  const formFields = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        {label("Name *")}
        <input style={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      </div>
      <div>
        {label("App")}
        <select style={inp} value={form.app} onChange={e => setForm(p => ({ ...p, app: e.target.value }))}>
          <option value="">Select app...</option>
          {POKER_APPS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        {label("Currency")}
        <select style={inp} value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        {label("Chip Value")}
        <input style={inp} value={form.chipValue} onChange={e => setForm(p => ({ ...p, chipValue: e.target.value }))} />
      </div>
      <div>
        {label("Upline (User)")}
        <select style={inp} value={form.uplineUserId} onChange={e => setForm(p => ({ ...p, uplineUserId: e.target.value }))}>
          <option value="">— no upline —</option>
          {users.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
        </select>
      </div>
      <div>
        {label("Upline RB % (z.B. 70)")}
        <input style={inp} value={form.uplineRakebackPct} onChange={e => setForm(p => ({ ...p, uplineRakebackPct: e.target.value }))} />
      </div>
      <div>
        {label("Upline Rebate % (z.B. 0)")}
        <input style={inp} value={form.uplineRebatePct} onChange={e => setForm(p => ({ ...p, uplineRebatePct: e.target.value }))} />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        {label("Rebate Berechnung")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
          <Toggle field="rebateOnRakeback" label="Rebate on Rakeback" />
          <Toggle field="rebateOn100Rake" label="Rebate on 100% Rake" />
        </div>
      </div>
      <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #374151", paddingTop: 16, marginTop: 4 }}>
        {label("Referrer (optional)")}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginTop: 4 }}>
          <div>
            {label("Referrer (User)")}
            <select style={inp} value={form.referrerUserId} onChange={e => setForm(p => ({ ...p, referrerUserId: e.target.value }))}>
              <option value="">— kein Referrer —</option>
              {users.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
            </select>
          </div>
          <div>
            {label("Referrer RB %")}
            <input style={inp} value={form.referrerRakebackPct} onChange={e => setForm(p => ({ ...p, referrerRakebackPct: e.target.value }))} placeholder="z.B. 5" />
          </div>
          <div>
            {label("Referrer Rebate %")}
            <input style={inp} value={form.referrerRebatePct} onChange={e => setForm(p => ({ ...p, referrerRebatePct: e.target.value }))} placeholder="z.B. 0" />
          </div>
        </div>
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
                <button style={btnPrimary} onClick={showCreate ? submitCreate : submitEdit}>{showCreate ? "Create" : "Save"}</button>
                <button style={btnSecondary} onClick={() => { setShowCreate(false); setEditClub(null) }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
          <input style={{ ...inp, margin: 0 }} placeholder="Search clubs, app, upline..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <p>Loading...</p> : (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>App</th><th>Currency</th><th>Upline</th>
                  <th>Upline RB%</th><th>Referrer</th><th>Rebate Calc</th><th>Deals</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(club => (
                  <tr key={club.id}>
                    <td><strong>{club.name}</strong></td>
                    <td>{club.app
                      ? <span className="badge badge-accent">{club.app}</span>
                      : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                    </td>
                    <td>{club.currency}</td>
                    <td>{club.uplineUser?.name || "—"}</td>
                    <td>{club.uplineRakebackPct ? `${Math.round(club.uplineRakebackPct * 100)}%` : "—"}</td>
                    <td style={{ fontSize: 13 }}>
                      {club.referrerUser
                        ? <span>{club.referrerUser.name} <span style={{ color: "var(--text-tertiary)" }}>({Math.round(club.referrerRakebackPct * 100)}%)</span></span>
                        : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                    </td>
                    <td style={{ fontSize: 11 }}>
                      {club.rebateOnRakeback && <div style={{ color: "var(--accent)" }}>on RB</div>}
                      {club.rebateOn100Rake && <div style={{ color: "var(--amber)" }}>on 100% rake</div>}
                      {!club.rebateOnRakeback && !club.rebateOn100Rake && <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                    </td>
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

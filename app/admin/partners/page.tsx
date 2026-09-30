"use client"

import { useEffect, useState } from "react"

type Partner = {
  id: number; name: string; telegramHandle: string | null
  notes: string | null; isActive: boolean; clubCount: number
  totalResult: number; totalRake: number; partnerBalance: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: "", telegramHandle: "", notes: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchPartners = async () => {
    setLoading(true)
    const res = await fetch("/api/partners")
    const data = await res.json()
    setPartners(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchPartners() }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) { setError("Name required"); return }
    setSaving(true); setError("")
    const res = await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return }
    setForm({ name: "", telegramHandle: "", notes: "" })
    await fetchPartners()
    setSaving(false)
  }

  const totalOwed = partners.reduce((s, p) => s + (p.partnerBalance < 0 ? Math.abs(p.partnerBalance) : 0), 0)
  const totalOwedToUs = partners.reduce((s, p) => s + (p.partnerBalance > 0 ? p.partnerBalance : 0), 0)

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Partners / Upline</div>
        <div className="topbar-actions">
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{partners.length} partners</span>
        </div>
      </div>

      <div className="page-body fade-in">

        {/* Summary */}
        {!loading && partners.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div className="card" style={{ textAlign: "center" }}>
              <div className="kpi-label" style={{ marginBottom: 6 }}>We owe partners</div>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-1px", color: "var(--amber)" }}>
                {fmt(totalOwed)} USD
              </div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div className="kpi-label" style={{ marginBottom: 6 }}>Partners owe us</div>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-1px", color: "var(--green)" }}>
                {fmt(totalOwedToUs)} USD
              </div>
            </div>
          </div>
        )}

        {/* Create */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            New Partner
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: 10, alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Name *</label>
              <input className="form-input" placeholder="e.g. Gabriel" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Telegram</label>
              <input className="form-input" placeholder="@handle" value={form.telegramHandle}
                onChange={e => setForm({ ...form, telegramHandle: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes</label>
              <input className="form-input" placeholder="e.g. Mad Cows / WinMax agent" value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <button className="btn btn-accent" onClick={handleCreate} disabled={saving}>
              {saving ? "..." : "+ Add"}
            </button>
          </div>
          {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--red)" }}>{error}</div>}
        </div>

        {/* Table */}
        <div className="card-flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Telegram</th>
                <th>Clubs</th>
                <th style={{ textAlign: "right" }}>Total Result</th>
                <th style={{ textAlign: "right" }}>Total Rake</th>
                <th style={{ textAlign: "right" }}>Balance with Us</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : partners.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>No partners yet</td></tr>
              ) : partners.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</td>
                  <td style={{ color: "var(--accent)", fontSize: 11 }}>{p.telegramHandle || "-"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{p.clubCount}</td>
                  <td style={{ textAlign: "right" }} className={p.totalResult >= 0 ? "val-pos" : "val-neg"}>
                    {p.totalResult >= 0 ? "+" : "-"}{fmt(p.totalResult)} USD
                  </td>
                  <td style={{ textAlign: "right", color: "var(--green)" }}>{fmt(p.totalRake)} USD</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}
                    className={p.partnerBalance >= 0 ? "val-pos" : "val-neg"}>
                    {p.partnerBalance >= 0 ? "+" : "-"}{fmt(p.partnerBalance)} USD
                    <div style={{ fontSize: 9, color: "var(--text-tertiary)", fontWeight: 400, marginTop: 2 }}>
                      {p.partnerBalance < 0 ? "we owe" : "they owe"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-tertiary)" }}>
          To link a partner to clubs: go to Clubs and assign a partner per club.
        </div>
      </div>
    </>
  )
}
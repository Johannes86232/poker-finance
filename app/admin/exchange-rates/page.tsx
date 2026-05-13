"use client"

import { useEffect, useState } from "react"

type ExchangeRate = {
  id: number
  fromCurrency: string
  toCurrency: string
  rate: number
  validOn: string
}

const CURRENCIES = ["USD", "EUR", "AED", "GBP", "CNY"]
const COMMON_PAIRS = [
  { from: "AED", to: "USD", hint: "~0.2723" },
  { from: "AED", to: "EUR", hint: "~0.2500" },
  { from: "EUR", to: "USD", hint: "~1.0800" },
  { from: "GBP", to: "USD", hint: "~1.2700" },
  { from: "CNY", to: "USD", hint: "~0.1380" },
]

const emptyForm = { fromCurrency: "AED", toCurrency: "USD", rate: "" }

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const fetchRates = async () => {
    setLoading(true)
    const res = await fetch("/api/exchange-rates")
    setRates(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchRates() }, [])

  const handleSave = async () => {
    if (!form.rate) { setError("Rate is required"); return }
    setSaving(true)
    setError("")
    setSuccess("")
    const res = await fetch("/api/exchange-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setSuccess(`${form.fromCurrency} → ${form.toCurrency} saved!`)
    setForm(emptyForm)
    await fetchRates()
    setSaving(false)
  }

  // Get latest rate for each pair
  const latestRates = new Map<string, ExchangeRate>()
  for (const r of rates) {
    const key = `${r.fromCurrency}_${r.toCurrency}`
    if (!latestRates.has(key)) latestRates.set(key, r)
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Exchange Rates</div>
        <div className="topbar-actions">
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="page-body fade-in">

        {/* Quick set common pairs */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Common Pairs
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {COMMON_PAIRS.map(p => (
              <button key={`${p.from}_${p.to}`}
                className="btn"
                onClick={() => setForm({ fromCurrency: p.from, toCurrency: p.to, rate: "" })}
                style={{ fontSize: 11 }}>
                {p.from} → {p.to}
                <span style={{ color: "var(--text-tertiary)", marginLeft: 4 }}>{p.hint}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "160px 160px 200px", gap: 10, alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From</label>
              <select className="form-select" value={form.fromCurrency}
                onChange={e => setForm({ ...form, fromCurrency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To</label>
              <select className="form-select" value={form.toCurrency}
                onChange={e => setForm({ ...form, toCurrency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Rate (1 {form.fromCurrency} = ? {form.toCurrency})
              </label>
              <input className="form-input" type="number" step="0.0001" placeholder="0.0000"
                value={form.rate}
                onChange={e => setForm({ ...form, rate: e.target.value })}
                onKeyDown={e => e.key === "Enter" && handleSave()} />
            </div>
          </div>

          {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--red)" }}>{error}</div>}
          {success && <div style={{ marginTop: 10, fontSize: 12, color: "var(--green)" }}>{success}</div>}
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Rate"}
            </button>
          </div>
        </div>

        {/* Current Rates */}
        <div className="section-header">
          <span className="section-title">Current Rates</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 20 }}>
          {COMMON_PAIRS.map(p => {
            const key = `${p.from}_${p.to}`
            const r = latestRates.get(key)
            return (
              <div key={key} className="card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                  {p.from} → {p.to}
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.5px", color: r ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                  {r ? r.rate.toFixed(4) : "—"}
                </div>
                {r && (
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>
                    {new Date(r.validOn).toLocaleDateString()}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* History */}
        <div className="section-header">
          <span className="section-title">Rate History</span>
        </div>
        <div className="card-flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Rate</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : rates.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 32, color: "var(--text-tertiary)" }}>No rates yet</td></tr>
              ) : rates.map(r => (
                <tr key={r.id}>
                  <td><span className="badge badge-accent">{r.fromCurrency}</span></td>
                  <td><span className="badge badge-inactive">{r.toCurrency}</span></td>
                  <td style={{ fontWeight: 500, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                    {r.rate.toFixed(4)}
                  </td>
                  <td style={{ color: "var(--text-tertiary)", fontSize: 12 }}>
                    {new Date(r.validOn).toLocaleDateString()}
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

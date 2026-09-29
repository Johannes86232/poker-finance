"use client"
import { useState } from "react"
function getCurrentWeek() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now.getTime() - start.getTime()) / 604800000 + start.getDay() + 1) / 7)
  return { year: now.getFullYear(), week }
}
export default function ImportPage() {
  const { year: y, week: w } = getCurrentWeek()
  const [year, setYear] = useState(y)
  const [weekNum, setWeekNum] = useState(w)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const setF = (f: File) => { setFile(f); setResult(null); setError(null) }
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) setF(e.dataTransfer.files[0]) }
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true); setResult(null); setError(null)
    const fd = new FormData()
    fd.append("file", file); fd.append("weekNum", String(weekNum)); fd.append("year", String(year))
    try {
      const res = await fetch("/api/import/weekly", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) setError(data.error || "Fehler")
      else setResult(data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }
  const inp = { width: "100%", background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-md)", padding: "8px 12px", color: "var(--text-primary)", fontSize: "13px", outline: "none" } as React.CSSProperties
  return (
    <div style={{ padding: "32px", maxWidth: "720px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1>Weekly Import</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "13px" }}>PIA Bulk Export direkt hochladen. Accounts werden per Nickname gemapped.</p>
      </div>
      <div style={{ background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-lg)", padding: "16px", marginBottom: "24px", display: "flex", gap: "12px" }}>
        <span style={{ fontSize: "18px" }}>📋</span>
        <div>
          <p style={{ fontWeight: 500, marginBottom: "4px" }}>Erwartetes Format</p>
          <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", fontSize: "12px" }}>Header-Zeile mit: <span style={{ color: "var(--text-primary)", fontFamily: "monospace" }}>User, Winnings, Tips, TipBack, T/R, Settlement</span></p>
        </div>
      </div>
      <form onSubmit={onSubmit}>
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
          <div style={{ flex: 1 }}>
            <label className="label" style={{ display: "block", marginBottom: "8px" }}>Jahr</label>
            <input type="number" value={year} onChange={e => setYear(+e.target.value)} min={2020} max={2030} style={inp} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" style={{ display: "block", marginBottom: "8px" }}>Kalenderwoche</label>
            <input type="number" value={weekNum} onChange={e => setWeekNum(+e.target.value)} min={1} max={53} style={inp} />
          </div>
        </div>
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onClick={() => document.getElementById("fi")?.click()}
          style={{ border: "1.5px dashed var(--border-strong)", borderRadius: "var(--radius-lg)", padding: "40px", textAlign: "center", cursor: "pointer", marginBottom: "24px", background: "var(--bg-raised)" }}>
          <input id="fi" type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && setF(e.target.files[0])} style={{ display: "none" }} />
          {file
            ? <><p style={{ fontWeight: 500, color: "var(--green)" }}>{file.name}</p><p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{(file.size/1024).toFixed(1)} KB</p></>
            : <><p style={{ fontWeight: 500 }}>Excel oder CSV hier reinziehen</p><p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>oder klicken</p></>}
        </div>
        <button type="submit" disabled={!file || loading} style={{ background: "var(--accent)", color: "white", border: "none", borderRadius: "var(--radius-md)", padding: "10px 24px", fontSize: "13px", fontWeight: 500, cursor: "pointer", width: "100%" }}>
          {loading ? "Importiere..." : "KW " + weekNum + " " + year + " importieren"}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: "24px", background: "var(--green-dim)", border: "0.5px solid var(--green-border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <p style={{ fontWeight: 500, color: "var(--green)", marginBottom: "12px" }}>Import abgeschlossen</p>
          <div style={{ display: "flex", gap: "24px" }}>
            <div><p className="label">Importiert</p><p style={{ fontSize: "20px", fontWeight: 500 }}>{result.imported}</p></div>
            <div><p className="label">Uebersprungen</p><p style={{ fontSize: "20px", fontWeight: 500 }}>{result.skipped}</p></div>
          </div>
          {result.errors?.length > 0 && result.errors.map((e: string, i: number) => (
            <p key={i} style={{ color: "var(--amber)", fontSize: "12px", marginTop: "8px" }}>{e}</p>
          ))}
        </div>
      )}
      {error && (
        <div style={{ marginTop: "24px", background: "var(--red-dim)", border: "0.5px solid var(--red-border)", borderRadius: "var(--radius-lg)", padding: "16px" }}>
          <p style={{ color: "var(--red)", fontWeight: 500 }}>Fehler</p>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "12px" }}>{error}</p>
        </div>
      )}
    </div>
  )
}
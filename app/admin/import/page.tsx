"use client"
import { useState, useEffect } from "react"

function getISOWeek(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return {
    week: 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7),
    year: d.getFullYear()
  }
}

function getWeekDates(year: number, week: number) {
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = (jan4.getDay() + 6) % 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dayOfWeek + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
  return `${fmt(monday)} - ${fmt(sunday)}`
}

export default function ImportPage() {
  const { year: y, week: w } = getISOWeek(new Date())
  const [year, setYear] = useState(y)
  const [weekNum, setWeekNum] = useState(w)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [clubs, setClubs] = useState<any[]>([])
  const [clubId, setClubId] = useState<string>("")
  const [selectedClub, setSelectedClub] = useState<any>(null)

  useEffect(() => {
    fetch("/api/clubs").then(r => r.json()).then(data => {
      setClubs(Array.isArray(data) ? data : [])
    })
  }, [])

  useEffect(() => {
    setSelectedClub(clubId ? clubs.find(c => String(c.id) === clubId) || null : null)
  }, [clubId, clubs])

  const setF = (f: File) => { setFile(f); setResult(null); setError(null) }
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); if (e.dataTransfer.files[0]) setF(e.dataTransfer.files[0]) }

  const onSubmit = async () => {
    if (!file || !clubId) return
    setLoading(true); setResult(null); setError(null)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("weekNum", String(weekNum))
    fd.append("year", String(year))
    fd.append("clubId", clubId)
    try {
      const res = await fetch("/api/import/weekly", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) setError(data.error || "Error")
      else setResult(data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const inp = { width: "100%", background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-md)", padding: "8px 12px", color: "var(--text-primary)", fontSize: "13px", outline: "none" } as React.CSSProperties

  return (
    <div style={{ padding: "32px", maxWidth: "720px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1>Weekly Import</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "13px" }}>Select a club, set the week, upload PIA bulk export.</p>
      </div>

      <div style={{ background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "12px" }}>1 — Club</p>
        <select value={clubId} onChange={e => setClubId(e.target.value)} style={{ ...inp }}>
          <option value="">— Select club —</option>
          {clubs.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}{c.app ? ` (${c.app})` : ""}</option>
          ))}
        </select>
        {selectedClub && (
          <div style={{ marginTop: "14px", background: "var(--bg-base)", borderRadius: "var(--radius-md)", padding: "12px 16px", fontSize: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <div style={{ color: "var(--text-tertiary)", marginBottom: "3px" }}>Partner</div>
                <div style={{ fontWeight: 500 }}>{selectedClub.partner?.name || "—"}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-tertiary)", marginBottom: "3px" }}>Rakeback Deal</div>
                <div style={{ fontWeight: 600, color: selectedClub.partnerRakebackPct > 0 ? "var(--amber)" : "var(--text-secondary)" }}>
                  {selectedClub.partnerRakebackPct > 0 ? `${Math.round(selectedClub.partnerRakebackPct * 100)}%` : "—"}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-tertiary)", marginBottom: "3px" }}>Rebate %</div>
                <div style={{ fontWeight: 500 }}>
                  {selectedClub.partnerRebatePct > 0 ? `${Math.round(selectedClub.partnerRebatePct * 100)}%` : "—"}
                </div>
              </div>
            </div>
            {selectedClub.partnerRakebackPct > 0 && (
              <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(245,158,11,0.1)", borderRadius: "6px", color: "var(--amber)", fontSize: "11px" }}>
                Upline: {Math.round(selectedClub.partnerRakebackPct * 100)}% of rake goes to {selectedClub.partner?.name || "partner"}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "12px" }}>2 — Calendar Week</p>
        <div style={{ display: "flex", gap: "16px", alignItems: "end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>Year</label>
            <input type="number" value={year} onChange={e => setYear(+e.target.value)} min={2020} max={2030} style={inp} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>Week</label>
            <input type="number" value={weekNum} onChange={e => setWeekNum(+e.target.value)} min={1} max={53} style={inp} />
          </div>
          <div style={{ flex: 2, paddingBottom: "9px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              {getWeekDates(year, weekNum)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "12px" }}>3 — File</p>
        <div onDrop={onDrop} onDragOver={e => e.preventDefault()} onClick={() => document.getElementById("fi")?.click()}
          style={{ border: "1.5px dashed var(--border-strong)", borderRadius: "var(--radius-md)", padding: "32px", textAlign: "center", cursor: "pointer", background: "var(--bg-base)" }}>
          <input id="fi" type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && setF(e.target.files[0])} style={{ display: "none" }} />
          {file
            ? <><p style={{ fontWeight: 500, color: "var(--green)" }}>{file.name}</p><p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{(file.size/1024).toFixed(1)} KB</p></>
            : <><p style={{ fontWeight: 500 }}>Drop Excel file here</p><p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>or click to browse</p></>}
        </div>
      </div>

      <button onClick={onSubmit} disabled={!file || !clubId || loading}
        style={{ background: (!file || !clubId) ? "var(--bg-raised)" : "var(--accent)", color: (!file || !clubId) ? "var(--text-tertiary)" : "white", border: "none", borderRadius: "var(--radius-md)", padding: "12px 24px", fontSize: "13px", fontWeight: 500, cursor: (!file || !clubId) ? "not-allowed" : "pointer", width: "100%" }}>
        {loading ? "Importing..." : `Import Week ${weekNum} ${year}`}
      </button>

      {result && (
        <div style={{ marginTop: "20px", background: "var(--green-dim)", border: "0.5px solid var(--green-border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <p style={{ fontWeight: 500, color: "var(--green)", marginBottom: "12px" }}>Import complete</p>
          <div style={{ display: "flex", gap: "24px" }}>
            <div><p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Imported</p><p style={{ fontSize: "20px", fontWeight: 500 }}>{result.imported}</p></div>
            <div><p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Skipped</p><p style={{ fontSize: "20px", fontWeight: 500 }}>{result.skipped}</p></div>
          </div>
          {result.errors?.length > 0 && result.errors.map((e: string, i: number) => (
            <p key={i} style={{ color: "var(--amber)", fontSize: "12px", marginTop: "4px" }}>{e}</p>
          ))}
        </div>
      )}
      {error && (
        <div style={{ marginTop: "20px", background: "var(--red-dim)", border: "0.5px solid var(--red-border)", borderRadius: "var(--radius-lg)", padding: "16px" }}>
          <p style={{ color: "var(--red)", fontWeight: 500 }}>Error: {error}</p>
        </div>
      )}
    </div>
  )
}



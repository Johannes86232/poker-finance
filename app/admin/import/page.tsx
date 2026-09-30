"use client"
import { useState, useEffect } from "react"

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
      if (!res.ok) setError(data.error || "Fehler")
      else setResult(data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const inp = { width: "100%", background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-md)", padding: "8px 12px", color: "var(--text-primary)", fontSize: "13px", outline: "none" } as React.CSSProperties

  return (
    <div style={{ padding: "32px", maxWidth: "720px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1>Weekly Import</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "13px" }}>Club auswaehlen, KW eingeben, PIA Bulk Export hochladen.</p>
      </div>

      <div style={{ background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "12px" }}>1 — Club</p>
        <select value={clubId} onChange={e => setClubId(e.target.value)} style={{ ...inp }}>
          <option value="">— Club waehlen —</option>
          {clubs.map(c => <option key={c.id}

git add app/admin/import/page.tsx
git commit -m "feat: import UI with club selector and deal preview"
git push
[System.IO.File]::WriteAllText("C:\Users\luxet\poker-finance\app\admin\import\page.tsx", @'
"use client"
import { useState, useEffect } from "react"

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
      if (!res.ok) setError(data.error || "Fehler")
      else setResult(data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const inp = { width: "100%", background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-md)", padding: "8px 12px", color: "var(--text-primary)", fontSize: "13px", outline: "none" } as React.CSSProperties

  return (
    <div style={{ padding: "32px", maxWidth: "720px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1>Weekly Import</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "13px" }}>Club auswaehlen, KW eingeben, PIA Bulk Export hochladen.</p>
      </div>

      <div style={{ background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "12px" }}>1 — Club</p>
        <select value={clubId} onChange={e => setClubId(e.target.value)} style={{ ...inp }}>
          <option value="">— Club waehlen —</option>
          {clubs.map(c => <option key={c.id} value={String(c.id)}>{c.name}{c.app ? ` (${c.app})` : ""}</option>)}
        </select>
        {selectedClub && (
          <div style={{ marginTop: "14px", background: "var(--bg-base)", borderRadius: "var(--radius-md)", padding: "12px 16px", fontSize: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <div style={{ color: "var(--text-tertiary)", marginBottom: "3px" }}>Partner</div>
                <div style={{ fontWeight: 500 }}>{selectedClub.partner?.name || "—"}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-tertiary)", marginBottom: "3px" }}>Partner RB %</div>
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
                Upline: {Math.round(selectedClub.partnerRakebackPct * 100)}% vom Rake geht an {selectedClub.partner?.name || "Partner"}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "12px" }}>2 — Kalenderwoche</p>
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>Jahr</label>
            <input type="number" value={year} onChange={e => setYear(+e.target.value)} min={2020} max={2030} style={inp} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>KW</label>
            <input type="number" value={weekNum} onChange={e => setWeekNum(+e.target.value)} min={1} max={53} style={inp} />
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "12px" }}>3 — Datei</p>
        <div onDrop={onDrop} onDragOver={e => e.preventDefault()} onClick={() => document.getElementById("fi")?.click()}
          style={{ border: "1.5px dashed var(--border-strong)", borderRadius: "var(--radius-md)", padding: "32px", textAlign: "center", cursor: "pointer", background: "var(--bg-base)" }}>
          <input id="fi" type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && setF(e.target.files[0])} style={{ display: "none" }} />
          {file
            ? <><p style={{ fontWeight: 500, color: "var(--green)" }}>{file.name}</p><p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{(file.size/1024).toFixed(1)} KB</p></>
            : <><p style={{ fontWeight: 500 }}>Excel hier reinziehen</p><p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>oder klicken</p></>}
        </div>
      </div>

      <button onClick={onSubmit} disabled={!file || !clubId || loading}
        style={{ background: (!file || !clubId) ? "var(--bg-raised)" : "var(--accent)", color: (!file || !clubId) ? "var(--text-tertiary)" : "white", border: "none", borderRadius: "var(--radius-md)", padding: "12px 24px", fontSize: "13px", fontWeight: 500, cursor: (!file || !clubId) ? "not-allowed" : "pointer", width: "100%" }}>
        {loading ? "Importiere..." : `KW ${weekNum} ${year} importieren`}
      </button>

      {result && (
        <div style={{ marginTop: "20px", background: "var(--green-dim)", border: "0.5px solid var(--green-border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <p style={{ fontWeight: 500, color: "var(--green)", marginBottom: "12px" }}>Import abgeschlossen</p>
          <div style={{ display: "flex", gap: "24px" }}>
            <div><p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Importiert</p><p style={{ fontSize: "20px", fontWeight: 500 }}>{result.imported}</p></div>
            <div><p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Uebersprungen</p><p style={{ fontSize: "20px", fontWeight: 500 }}>{result.skipped}</p></div>
          </div>
          {result.errors?.length > 0 && result.errors.map((e: string, i: number) => (
            <p key={i} style={{ color: "var(--amber)", fontSize: "12px", marginTop: "4px" }}>{e}</p>
          ))}
        </div>
      )}
      {error && (
        <div style={{ marginTop: "20px", background: "var(--red-dim)", border: "0.5px solid var(--red-border)", borderRadius: "var(--radius-lg)", padding: "16px" }}>
          <p style={{ color: "var(--red)", fontWeight: 500 }}>Fehler: {error}</p>
        </div>
      )}
    </div>
  )
}
"use client"
import { useState, useEffect, useCallback } from "react"

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
  return `${fmt(monday)} – ${fmt(sunday)}`
}

type WeekClub = {
  clubId: number; clubName: string
  count: number; importFile: string | null; importedAt: string | null
  totalResult: number; totalRake: number; totalRakeback: number
}
type WeekEntry = {
  id: number; year: number; weekNum: number; label: string | null
  clubs: WeekClub[]; reportCount: number; createdAt: string
}

const fmt2 = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

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
  const [weeks, setWeeks] = useState<WeekEntry[]>([])
  const [weeksLoading, setWeeksLoading] = useState(true)
  const [resetLoading, setResetLoading] = useState(false)

  const fetchWeeks = useCallback(async () => {
    setWeeksLoading(true)
    try {
      const res = await fetch("/api/weeks")
      const data = await res.json()
      setWeeks(Array.isArray(data) ? data : [])
    } catch {}
    setWeeksLoading(false)
  }, [])

  useEffect(() => {
    fetch("/api/clubs").then(r => r.json()).then(data => {
      setClubs(Array.isArray(data) ? data : [])
    })
    fetchWeeks()
  }, [fetchWeeks])

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
      else { setResult(data); fetchWeeks() }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const deleteWeek = async (weekId: number, cId?: number) => {
    const label = cId ? "this club's import for this week" : "the entire week (all clubs)"
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return
    const url = cId ? `/api/weeks?weekId=${weekId}&clubId=${cId}` : `/api/weeks?weekId=${weekId}`
    const res = await fetch(url, { method: "DELETE" })
    if (res.ok) fetchWeeks()
    else alert("Delete failed")
  }

  const resetAll = async () => {
    if (!confirm("Delete ALL weekly reports and weeks? This cannot be undone.")) return
    setResetLoading(true)
    const res = await fetch("/api/admin/reset-reports", { method: "DELETE" })
    if (res.ok) fetchWeeks()
    else alert("Reset failed")
    setResetLoading(false)
  }

  const inp = {
    width: "100%", background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)",
    borderRadius: "var(--radius-md)", padding: "8px 12px", color: "var(--text-primary)",
    fontSize: "13px", outline: "none"
  } as React.CSSProperties

  return (
    <div style={{ padding: "32px", maxWidth: "760px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1>Weekly Import</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "13px" }}>
          Select a club, set the week, upload PIA bulk export.
        </p>
      </div>

      {/* Club */}
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
                <div style={{ color: "var(--text-tertiary)", marginBottom: "3px" }}>Upline</div>
                <div style={{ fontWeight: 500 }}>{selectedClub.uplineUser?.name || "—"}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-tertiary)", marginBottom: "3px" }}>Rakeback Deal</div>
                <div style={{ fontWeight: 600, color: selectedClub.uplineRakebackPct > 0 ? "var(--amber)" : "var(--text-secondary)" }}>
                  {selectedClub.uplineRakebackPct > 0 ? `${Math.round(selectedClub.uplineRakebackPct * 100)}%` : "—"}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-tertiary)", marginBottom: "3px" }}>Rebate %</div>
                <div style={{ fontWeight: 500 }}>
                  {selectedClub.uplineRebatePct > 0 ? `${Math.round(selectedClub.uplineRebatePct * 100)}%` : "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Week */}
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

      {/* File */}
      <div style={{ background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "12px" }}>3 — File</p>
        <div onDrop={onDrop} onDragOver={e => e.preventDefault()} onClick={() => document.getElementById("fi")?.click()}
          style={{ border: "1.5px dashed var(--border-strong)", borderRadius: "var(--radius-md)", padding: "32px", textAlign: "center", cursor: "pointer", background: "var(--bg-base)" }}>
          <input id="fi" type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && setF(e.target.files[0])} style={{ display: "none" }} />
          {file
            ? <><p style={{ fontWeight: 500, color: "var(--green)" }}>{file.name}</p><p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{(file.size / 1024).toFixed(1)} KB</p></>
            : <><p style={{ fontWeight: 500 }}>Drop Excel file here</p><p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>or click to browse</p></>}
        </div>
      </div>

      {/* Submit */}
      <button onClick={onSubmit} disabled={!file || !clubId || loading}
        style={{
          background: (!file || !clubId) ? "var(--bg-raised)" : "var(--accent)",
          color: (!file || !clubId) ? "var(--text-tertiary)" : "white",
          border: "none", borderRadius: "var(--radius-md)", padding: "12px 24px",
          fontSize: "13px", fontWeight: 500, cursor: (!file || !clubId) ? "not-allowed" : "pointer", width: "100%"
        }}>
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

      {/* Imported Weeks History */}
      <div style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>Importierte Wochen</h2>
          <button onClick={resetAll} disabled={resetLoading}
            style={{ background: "var(--red-dim)", color: "var(--red)", border: "0.5px solid var(--red-border)", borderRadius: "var(--radius-md)", padding: "6px 14px", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}>
            {resetLoading ? "Deleting..." : "🗑 Alle löschen"}
          </button>
        </div>

        {weeksLoading ? (
          <div style={{ color: "var(--text-tertiary)", fontSize: "13px", padding: "20px 0" }}>Lade...</div>
        ) : weeks.length === 0 ? (
          <div style={{ color: "var(--text-tertiary)", fontSize: "13px", padding: "20px 0" }}>Noch keine Imports</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {weeks.map(week => (
              <div key={week.id} style={{ background: "var(--bg-raised)", border: "0.5px solid var(--border-mid)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                {/* Week Header */}
                <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid var(--border-mid)" }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>KW {week.weekNum} / {week.year}</span>
                    <span style={{ marginLeft: "12px", fontSize: "12px", color: "var(--text-tertiary)" }}>
                      {getWeekDates(week.year, week.weekNum)}
                    </span>
                    <span style={{ marginLeft: "12px", fontSize: "11px", color: "var(--text-tertiary)" }}>
                      {week.reportCount} Einträge
                    </span>
                  </div>
                  <button
                    onClick={() => deleteWeek(week.id)}
                    style={{ background: "none", border: "0.5px solid var(--border-strong)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: "11px", color: "var(--red)", cursor: "pointer" }}>
                    Woche löschen
                  </button>
                </div>

                {/* Per-Club rows */}
                {week.clubs.map((club, i) => (
                  <div key={i} style={{
                    padding: "12px 20px",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    borderBottom: i < week.clubs.length - 1 ? "0.5px solid var(--border-low)" : "none",
                    background: i % 2 === 1 ? "rgba(0,0,0,0.08)" : "transparent"
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: "13px" }}>{club.clubName}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "3px" }}>
                        {club.count} Spieler
                        <span style={{ margin: "0 8px" }}>·</span>
                        Result: <span style={{ color: club.totalResult >= 0 ? "var(--green)" : "var(--red)" }}>
                          {club.totalResult >= 0 ? "+" : ""}{fmt2(club.totalResult)} USD
                        </span>
                        <span style={{ margin: "0 8px" }}>·</span>
                        Rake: {fmt2(club.totalRake)} USD
                      </div>
                      {club.importFile && (
                        <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "3px" }}>
                          📄 {club.importFile}
                          {club.importedAt && (
                            <span style={{ marginLeft: "6px" }}>
                              {new Date(club.importedAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteWeek(week.id, club.clubId)}
                      style={{ background: "none", border: "0.5px solid var(--border-strong)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: "11px", color: "var(--text-secondary)", cursor: "pointer", marginLeft: "16px", whiteSpace: "nowrap" }}>
                      Löschen
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

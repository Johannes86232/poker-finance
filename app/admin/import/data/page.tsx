"use client"

import { useState } from "react"
import * as XLSX from "xlsx"

const btn: React.CSSProperties = { padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14 }
const btnPrimary: React.CSSProperties = { ...btn, background: "#6366f1", color: "#fff" }
const btnSecondary: React.CSSProperties = { ...btn, background: "#374151", color: "#e5e7eb" }
const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#f9fafb", fontSize: 14, boxSizing: "border-box" }

type ImportType = "users" | "clubs" | "accounts"

interface ImportResult {
  type: ImportType
  results: { status: string; name?: string; row?: string; id?: number; warnings?: string[]; error?: string }[]
}

const SHEET_NAMES: Record<ImportType, string> = {
  users: "users",
  clubs: "clubs",
  accounts: "accounts",
}

const HEADERS: Record<ImportType, string[]> = {
  users: ["name", "telegram_handle", "telegram_group_id", "telegram_group_name", "role"],
  clubs: ["club_name", "app", "currency", "chip_value", "upline_user", "upline_rb_pct", "upline_rebate_pct", "rebate_on_rakeback", "rebate_on_100rake", "referrer_user", "referrer_rb_pct", "referrer_rebate_pct"],
  accounts: ["user_name", "nickname", "account_id", "club_name", "app", "rakeback_pct", "rebate_pct", "referrer1_name", "referrer1_rb_pct", "referrer2_name", "referrer2_rb_pct"],
}

function parseXlsx(file: File, type: ImportType): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: "array" })
        const ws = wb.Sheets[SHEET_NAMES[type]]
        if (!ws) { reject(new Error(`Sheet '${SHEET_NAMES[type]}' not found`)); return }
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
        const headers = HEADERS[type]
        // Skip rows 0 (header) and 1 (legend), data starts at row 2
        const rows = raw.slice(2).filter(r => r.some(v => v !== null && v !== ""))
        const objects = rows.map(r => {
          const obj: any = {}
          headers.forEach((h, i) => { obj[h] = r[i] ?? null })
          return obj
        })
        resolve(objects)
      } catch (err) { reject(err) }
    }
    reader.readAsArrayBuffer(file)
  })
}

export default function ImportPage() {
  const [files, setFiles] = useState<Record<ImportType, File | null>>({ users: null, clubs: null, accounts: null })
  const [results, setResults] = useState<ImportResult[]>([])
  const [loading, setLoading] = useState<ImportType | null>(null)
  const [preview, setPreview] = useState<Record<ImportType, number>>({ users: 0, clubs: 0, accounts: 0 })

  async function handleFile(type: ImportType, file: File) {
    setFiles(p => ({ ...p, [type]: file }))
    try {
      const rows = await parseXlsx(file, type)
      setPreview(p => ({ ...p, [type]: rows.length }))
    } catch { setPreview(p => ({ ...p, [type]: 0 })) }
  }

  async function runImport(type: ImportType) {
    if (!files[type]) return
    setLoading(type)
    try {
      const rows = await parseXlsx(files[type]!, type)
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, rows }),
      })
      const data = await res.json()
      setResults(prev => [data, ...prev.filter(r => r.type !== type)])
    } catch (e: any) {
      alert("Fehler: " + e.message)
    }
    setLoading(null)
  }

  const Section = ({ type, label, hint }: { type: ImportType; label: string; hint: string }) => {
    const result = results.find(r => r.type === type)
    const ok = result?.results.filter(r => r.status === "ok" || r.status === "created" || r.status === "updated").length ?? 0
    const skipped = result?.results.filter(r => r.status === "skip").length ?? 0
    const errors = result?.results.filter(r => r.status === "error").length ?? 0
    const warnings = result?.results.flatMap(r => r.warnings || [])

    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>{label}</h2>
          {files[type] && <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{files[type]!.name} — {preview[type]} Zeilen erkannt</span>}
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-tertiary)" }}>{hint}</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ ...btnSecondary, display: "inline-block", cursor: "pointer" }}>
            Datei wählen
            <input type="file" accept=".xlsx" style={{ display: "none" }}
              onChange={e => e.target.files?.[0] && handleFile(type, e.target.files[0])} />
          </label>
          <button style={{ ...btnPrimary, opacity: files[type] ? 1 : 0.4 }}
            disabled={!files[type] || loading === type}
            onClick={() => runImport(type)}>
            {loading === type ? "Importiere..." : "Import starten"}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: "#86efac" }}>✅ {ok} erfolgreich</span>
              {skipped > 0 && <span style={{ color: "#fbbf24" }}>⏭ {skipped} übersprungen</span>}
              {errors > 0 && <span style={{ color: "#f87171" }}>❌ {errors} Fehler</span>}
            </div>
            {warnings.length > 0 && (
              <div style={{ background: "#1c1917", borderRadius: 6, padding: "10px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600, marginBottom: 4 }}>Warnungen:</div>
                {warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: "#fde68a" }}>• {w}</div>)}
              </div>
            )}
            {errors > 0 && (
              <div style={{ background: "#1c1917", borderRadius: 6, padding: "10px 14px" }}>
                <div style={{ fontSize: 12, color: "#f87171", fontWeight: 600, marginBottom: 4 }}>Fehler:</div>
                {result.results.filter(r => r.status === "error").map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#fca5a5" }}>• {r.name || r.row}: {r.error}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page-layout">
      <div className="page-content">
        <div className="topbar">
          <h1 className="topbar-title">Daten importieren</h1>
        </div>

        <div className="card" style={{ marginBottom: 20, padding: "12px 16px", background: "#1c1917", border: "1px solid #92400e" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#fde68a" }}>
            ⚠️ Reihenfolge beachten: <strong>1. Users</strong> → <strong>2. Clubs</strong> → <strong>3. Accounts/Deals</strong>.
            Clubs und Accounts referenzieren Users — diese müssen zuerst existieren.
          </p>
        </div>

        <Section type="users" label="1. Users importieren"
          hint="users_import.xlsx — legt neue User an oder aktualisiert bestehende (Abgleich über Name)." />
        <Section type="clubs" label="2. Clubs importieren"
          hint="clubs_import.xlsx — legt neue Clubs an oder aktualisiert Konditionen bestehender Clubs." />
        <Section type="accounts" label="3. Accounts & Deals importieren"
          hint="accounts_import.xlsx — legt Accounts und Player Deals an. User und Club müssen bereits existieren." />
      </div>
    </div>
  )
}

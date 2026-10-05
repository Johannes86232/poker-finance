import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const weekNum = parseInt(formData.get("weekNum") as string)
    const year = parseInt(formData.get("year") as string)
    const clubId = parseInt(formData.get("clubId") as string)

    if (!file || !weekNum || !year) {
      return NextResponse.json({ error: "Missing file, weekNum or year" }, { status: 400 })
    }
    if (!clubId) {
      return NextResponse.json({ error: "Missing clubId" }, { status: 400 })
    }

    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })

    let dataStartRow = -1
    let headers: string[] = []

    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i]
      const rowStr = row.map((c: any) => String(c ?? "")).join(",").toLowerCase()
      if (rowStr.includes("player account") || rowStr.includes("rake")) {
        headers = row.map((c: any) => String(c ?? "").trim())
        dataStartRow = i + 1
        break
      }
    }

    if (dataStartRow === -1) {
      return NextResponse.json({ error: "Could not find header row." }, { status: 400 })
    }

    const col = (name: string) => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))

    const colPlayerId     = col("player account id")
    const colPlayerScreen = col("player account screen")
    const colRake         = col("rake")
    const colResult       = col("result")
    const colXeRate       = col("xe-rate")

    const week = await prisma.week.upsert({
      where: { year_weekNum: { year, weekNum } },
      update: {},
      create: { year, weekNum, label: `KW${weekNum} ${year}` }
    })

    const dataRows = allRows.slice(dataStartRow).filter((row: any[]) => {
      const id = colPlayerId >= 0 ? String(row[colPlayerId] ?? "").trim() : ""
      const name = colPlayerScreen >= 0 ? String(row[colPlayerScreen] ?? "").trim() : ""
      return id !== "" || name !== ""
    })

    // Pre-flight: resolve all accounts and check for missing deals BEFORE importing anything
    type RowData = {
      piaId: string; screenName: string
      resultUsd: number; rakeUsd: number; xeRate: number
      accountId: number; rakebackPct: number; rebatePct: number
    }
    const resolved: RowData[] = []
    const missingDeals: string[] = []
    const missingAccounts: string[] = []

    for (const row of dataRows) {
      const piaId = colPlayerId >= 0 ? String(row[colPlayerId] ?? "").trim() : ""
      const screenName = colPlayerScreen >= 0 ? String(row[colPlayerScreen] ?? "").trim() : ""
      const resultRaw = parseFloat(String(row[colResult] ?? "0").replace(/[^0-9.-]/g, "")) || 0
      const rake = colRake >= 0 ? parseFloat(String(row[colRake] ?? "0").replace(/[^0-9.-]/g, "")) || 0 : 0
      const xeRate = colXeRate >= 0 ? parseFloat(String(row[colXeRate] ?? "1").replace(/[^0-9.-]/g, "")) || 1 : 1

      let account = null
      if (piaId) {
        account = await prisma.account.findFirst({ where: { accountId: piaId, isActive: true } })
      }
      if (!account && screenName) {
        account = await prisma.account.findFirst({ where: { nickname: { equals: screenName, mode: "insensitive" }, isActive: true } })
      }

      if (!account) {
        missingAccounts.push(`"${screenName || piaId}"`)
        continue
      }

      const deal = await prisma.deal.findFirst({
        where: { accountId: account.id, clubId: clubId, isActive: true }
      })

      if (!deal) {
        // Find user name for a helpful error message
        const fullAccount = await prisma.account.findUnique({
          where: { id: account.id },
          include: { user: { select: { name: true } } }
        })
        const label = fullAccount?.user?.name
          ? `${fullAccount.user.name} (${screenName || piaId})`
          : `${screenName || piaId}`
        missingDeals.push(label)
        continue
      }

      resolved.push({
        piaId, screenName,
        resultUsd: resultRaw * xeRate,
        rakeUsd: rake * xeRate,
        xeRate,
        accountId: account.id,
        rakebackPct: deal.rakebackPct ?? 0,
        rebatePct: deal.rebatePct ?? 0,
      })
    }

    // Block import if any deals are missing — don't silently create 0% deals
    if (missingDeals.length > 0) {
      return NextResponse.json({
        error: "Import blocked: missing player deals",
        missingDeals,
        missingAccounts,
        message: `Please create deals for these players in this club first: ${missingDeals.join(", ")}`,
      }, { status: 422 })
    }

    // All clear — import
    const results = { imported: 0, skipped: 0, errors: [] as string[], missingAccounts }

    for (const row of resolved) {
      const rakebackAmount = row.rakeUsd * row.rakebackPct
      // netResult = what we owe the player (or they owe us if negative)
      // Rebate is a % the player pays back on their net position
      const grossResult = row.resultUsd + rakebackAmount
      const rebateAmount = grossResult * row.rebatePct
      const netResult = grossResult - rebateAmount

      try {
        await prisma.weeklyReport.upsert({
          where: { accountId_weekId: { accountId: row.accountId, weekId: week.id } },
          update: { result: row.resultUsd, rake: row.rakeUsd, rakebackAmount, netResult, exchangeRate: row.xeRate, importedAt: new Date(), clubId, importFile: file.name },
          create: { accountId: row.accountId, weekId: week.id, clubId, result: row.resultUsd, rake: row.rakeUsd, rakebackAmount, netResult, exchangeRate: row.xeRate, importedAt: new Date(), importFile: file.name }
        })
        results.imported++
      } catch (e: any) {
        results.errors.push(`Error for "${row.screenName}": ${e.message}`)
        results.skipped++
      }
    }

    if (missingAccounts.length > 0) {
      results.errors.push(...missingAccounts.map(a => `No account found for: ${a}`))
      results.skipped += missingAccounts.length
    }

    return NextResponse.json({ success: true, week: { year, weekNum, id: week.id }, ...results })

  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

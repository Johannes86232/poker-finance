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

    const results = { imported: 0, skipped: 0, errors: [] as string[] }
    const dataRows = allRows.slice(dataStartRow).filter((row: any[]) => {
      const id = colPlayerId >= 0 ? String(row[colPlayerId] ?? "").trim() : ""
      const name = colPlayerScreen >= 0 ? String(row[colPlayerScreen] ?? "").trim() : ""
      return id !== "" || name !== ""
    })

    for (const row of dataRows) {
      const piaId = colPlayerId >= 0 ? String(row[colPlayerId] ?? "").trim() : ""
      const screenName = colPlayerScreen >= 0 ? String(row[colPlayerScreen] ?? "").trim() : ""
      const resultRaw = parseFloat(String(row[colResult] ?? "0").replace(/[^0-9.-]/g, "")) || 0
      const rake = colRake >= 0 ? parseFloat(String(row[colRake] ?? "0").replace(/[^0-9.-]/g, "")) || 0 : 0
      const xeRate = colXeRate >= 0 ? parseFloat(String(row[colXeRate] ?? "1").replace(/[^0-9.-]/g, "")) || 1 : 1

      const resultUsd = resultRaw * xeRate
      const rakeUsd = rake * xeRate

      let account = null
      if (piaId) {
        account = await prisma.account.findFirst({
          where: { accountId: piaId, isActive: true },
        })
      }
      if (!account && screenName) {
        account = await prisma.account.findFirst({
          where: { nickname: { equals: screenName, mode: "insensitive" }, isActive: true },
        })
      }

      if (!account) {
        results.skipped++
        results.errors.push(`No account for: "${screenName || piaId}"`)
        continue
      }

      // Ensure Deal exists linking account to this club
      let deal = await prisma.deal.findFirst({
        where: { accountId: account.id, clubId: clubId, isActive: true }
      })
      if (!deal) {
        deal = await prisma.deal.create({
          data: { accountId: account.id, clubId: clubId, isActive: true }
        })
      }

      // Player rakeback: what we pay the player (deal.rakebackPct stored as decimal e.g. 0.60)
      const rakebackPct = deal.rakebackPct ?? 0
      const rakebackAmount = rakeUsd * rakebackPct
      // netResult = what player owes us (result + rakeback they receive)
      const netResult = resultUsd + rakebackAmount

      try {
        await prisma.weeklyReport.upsert({
          where: { accountId_weekId: { accountId: account.id, weekId: week.id } },
          update: { result: resultUsd, rake: rakeUsd, rakebackAmount, netResult, exchangeRate: xeRate, importedAt: new Date() },
          create: { accountId: account.id, weekId: week.id, result: resultUsd, rake: rakeUsd, rakebackAmount, netResult, exchangeRate: xeRate, importedAt: new Date() }
        })
        results.imported++
      } catch (e: any) {
        results.errors.push(`Error for "${screenName}": ${e.message}`)
        results.skipped++
      }
    }

    return NextResponse.json({ success: true, week: { year, weekNum, id: week.id }, ...results })

  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

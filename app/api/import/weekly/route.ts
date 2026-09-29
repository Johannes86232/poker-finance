import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@/app/generated/prisma"
import * as XLSX from "xlsx"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const weekNum = parseInt(formData.get("weekNum") as string)
    const year = parseInt(formData.get("year") as string)

    if (!file || !weekNum || !year) {
      return NextResponse.json({ error: "Missing file, weekNum or year" }, { status: 400 })
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
      if (rowStr.includes("user") && rowStr.includes("settlement")) {
        headers = row.map((c: any) => String(c ?? "").trim())
        dataStartRow = i + 1
        break
      }
    }

    if (dataStartRow === -1) {
      return NextResponse.json({
        error: "Header row not found. Expected columns: User, Deal, StartDate, EndDate, Hands, Winnings, Tips, TipBack, T/R, Settlement"
      }, { status: 400 })
    }

    const col = (name: string) => {
      const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
      return idx >= 0 ? idx : -1
    }

    const colUser = col("user")
    const colWinnings = col("winnings")
    const colTips = col("tips")
    const colTipBack = col("tipback")
    const colSettlement = col("settlement")

    if (colUser === -1 || colSettlement === -1) {
      return NextResponse.json({
        error: `Missing required columns. Found: ${headers.join(", ")}`
      }, { status: 400 })
    }

    const week = await prisma.week.upsert({
      where: { year_weekNum: { year, weekNum } },
      update: {},
      create: { year, weekNum, label: `KW${weekNum} ${year}` }
    })

    const results = { imported: 0, skipped: 0, errors: [] as string[] }
    const dataRows = allRows.slice(dataStartRow).filter((row: any[]) =>
      row[colUser] && String(row[colUser]).trim() !== ""
    )

    for (const row of dataRows) {
      const accountNickname = String(row[colUser] ?? "").trim()
      const settlement = parseFloat(String(row[colSettlement] ?? "0").replace(/[^0-9.-]/g, "")) || 0
      const winnings = colWinnings >= 0 ? parseFloat(String(row[colWinnings] ?? "0").replace(/[^0-9.-]/g, "")) || 0 : 0
      const tips = colTips >= 0 ? parseFloat(String(row[colTips] ?? "0").replace(/[^0-9.-]/g, "")) || 0 : 0
      const tipBack = colTipBack >= 0 ? parseFloat(String(row[colTipBack] ?? "0").replace(/[^0-9.-]/g, "")) || 0 : 0

      const account = await prisma.account.findFirst({
        where: { nickname: accountNickname, isActive: true }
      })

      if (!account) {
        results.skipped++
        results.errors.push(`Account not found: "${accountNickname}"`)
        continue
      }

      try {
        await prisma.weeklyReport.upsert({
          where: { accountId_weekId: { accountId: account.id, weekId: week.id } },
          update: { result: winnings, rake: tips, rakebackAmount: tipBack, netResult: settlement, importedAt: new Date() },
          create: { accountId: account.id, weekId: week.id, result: winnings, rake: tips, rakebackAmount: tipBack, netResult: settlement, exchangeRate: 1 }
        })
        results.imported++
      } catch (e: any) {
        results.errors.push(`Error for "${accountNickname}": ${e.message}`)
        results.skipped++
      }
    }

    return NextResponse.json({ success: true, week: { year, weekNum, id: week.id }, ...results })
  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

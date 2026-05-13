import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const userId = parseInt((await params).userId)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        balance: true,
        accounts: {
          where: { isActive: true },
          include: {
  deals: { 
    where: { isActive: true },
    include: { club: true }
  },
            weeklyReports: {
              orderBy: { week: { year: "desc" } },
              include: { week: true },
            },
          },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            week: { select: { year: true, weekNum: true } },
            toUser: { select: { name: true } },
          },
        },
      },
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Group weekly reports by week
    const weekMap = new Map<string, {
      year: number
      weekNum: number
      accounts: {
        account: string
        club: string
        currency: string
        rate: number
        result: number
        rake: number
        bbj: number
        mtt: number
        rbPct: number
        rebatePct: number
        rakebackAmount: number
        netResult: number
      }[]
      totalUsd: number
    }>()

    for (const account of user.accounts) {
      for (const report of account.weeklyReports) {
        const key = `${report.week.year}-${report.week.weekNum}`
        const deal = account.deals[0]
        const rbPct = deal?.rakebackPct ?? 0
        const rebatePct = deal?.rebatePct ?? 0

        if (!weekMap.has(key)) {
          weekMap.set(key, {
            year: report.week.year,
            weekNum: report.week.weekNum,
            accounts: [],
            totalUsd: 0,
          })
        }

        const week = weekMap.get(key)!
        week.accounts.push({
          account: account.nickname,
          club: account.club.name,
          currency: account.club.currency,
          rate: report.exchangeRate,
          result: report.result,
          rake: report.rake,
          bbj: report.bbj,
          mtt: report.mtt,
          rbPct,
          rebatePct,
          rakebackAmount: report.rakebackAmount,
          netResult: report.netResult,
        })
        week.totalUsd += report.netResult
      }
    }

    const weeks = Array.from(weekMap.values()).sort((a, b) =>
      b.year !== a.year ? b.year - a.year : b.weekNum - a.weekNum
    )

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        telegramHandle: user.telegramHandle,
        balance: user.balance,
      },
      weeks,
      transactions: user.transactions,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 })
  }
}

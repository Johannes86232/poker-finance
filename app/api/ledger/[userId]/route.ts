import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const userId = parseInt((await params).userId)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          where: { isActive: true },
          include: {
            deals: { where: { isActive: true }, include: { club: true } },
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

    // Also fetch clubs where this user is the upline
    const uplineClubsRaw = await prisma.club.findMany({
      where: { uplineUserId: userId, isActive: true },
      include: {
        deals: {
          where: { isActive: true },
          include: {
            account: {
              include: { weeklyReports: { include: { week: true } } }
            }
          }
        }
      }
    })

    const weeklyTotal = user.accounts.reduce((sum: number, acc: any) =>
      sum + acc.weeklyReports.reduce((s: number, r: any) => s + (r.netResult ?? 0), 0), 0)
    const txTotal = user.transactions.reduce((sum: number, tx: any) => {
      if (tx.direction === "I_PAY_USER") return sum - tx.amount
      if (tx.direction === "USER_PAYS_ME") return sum + tx.amount
      return sum
    }, 0)

    // Upline balance: what this user owes us as upline of various clubs
    // Negative = they owe us (we are owed), positive = we owe them
    const uplineClubs = uplineClubsRaw.map((club: any) => {
      const rbPct = club.uplineRakebackPct ?? 0
      const rebatePct = club.uplineRebatePct ?? 0
      const rebateOn100Rake = club.rebateOn100Rake ?? false
      const rebateOnRakeback = club.rebateOnRakeback ?? false

      let totalResult = 0, totalRake = 0, totalGross = 0, totalRebate = 0, totalNet = 0

      for (const deal of club.deals) {
        for (const r of deal.account.weeklyReports) {
          const result = r.result ?? 0
          const rake = r.rake ?? 0
          const rbAmount = rake * rbPct
          const gross = result + rbAmount
          let rebateAmount = 0
          if (rebateOn100Rake) {
            rebateAmount = (result + rake) * rebatePct
          } else if (rebateOnRakeback) {
            rebateAmount = gross * rebatePct
          }
          const net = gross - rebateAmount
          totalResult += result
          totalRake += rake
          totalGross += gross
          totalRebate += rebateAmount
          totalNet += net
        }
      }

      return {
        clubId: club.id,
        clubName: club.name,
        rbPct,
        rebatePct,
        totalResult,
        totalRake,
        totalGross,
        totalRebate,
        // net = what upline owes us (positive = they owe us)
        netOwed: totalNet,
      }
    }).filter((c: any) => c.netOwed !== 0 || uplineClubsRaw.length > 0)

    const uplineBalance = -uplineClubs.reduce((s: any, c: any) => s + c.netOwed, 0)
    const balanceUsd = weeklyTotal + uplineBalance + txTotal

    const weekMap = new Map<string, any>()
    for (const account of user.accounts) {
      for (const report of account.weeklyReports) {
        const key = `${report.week.year}-${report.week.weekNum}`
        const deal = account.deals[0]
        if (!weekMap.has(key)) {
          weekMap.set(key, { year: report.week.year, weekNum: report.week.weekNum, accounts: [], totalUsd: 0 })
        }
        const week = weekMap.get(key)!
        week.accounts.push({
          account: account.nickname,
          club: deal?.club?.name ?? "Unknown",
          currency: deal?.club?.currency ?? "USD",
          rate: report.exchangeRate,
          result: report.result,
          rake: report.rake,
          bbj: report.bbj ?? 0,
          mtt: report.mtt ?? 0,
          rbPct: deal?.rakebackPct ?? 0,
          rebatePct: deal?.rebatePct ?? 0,
          rakebackAmount: report.rakebackAmount,
          netResult: report.netResult,
        })
        week.totalUsd += report.netResult
      }
    }

    const weeks = Array.from(weekMap.values()).sort((a: any, b: any) =>
      b.year !== a.year ? b.year - a.year : b.weekNum - a.weekNum)

    return NextResponse.json({
      user: { id: user.id, name: user.name, telegramHandle: user.telegramHandle,
        balance: { amountUsd: balanceUsd, amountEur: 0 } },
      weeks,
      transactions: user.transactions,
      uplineClubs,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 })
  }
}
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

    // Fetch deals where this user is referrer1 or referrer2
    const referrer1DealsRaw = await prisma.deal.findMany({
      where: { referrer1UserId: userId, isActive: true },
      include: {
        account: {
          include: {
            user: { select: { name: true } },
            weeklyReports: { include: { week: true } }
          }
        },
        club: { select: { id: true, name: true } }
      }
    })
    const referrer2DealsRaw = await prisma.deal.findMany({
      where: { referrer2UserId: userId, isActive: true },
      include: {
        account: {
          include: {
            user: { select: { name: true } },
            weeklyReports: { include: { week: true } }
          }
        },
        club: { select: { id: true, name: true } }
      }
    })

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

    // Referrer commissions: group by player (account user), sum per-week earnings
    const calcReferrerEarnings = (deals: any[], rbPctField: string, rebatePctField: string) => {
      // Group by referred player
      const byPlayer = new Map<string, any>()
      for (const deal of deals) {
        const playerName = deal.account.user.name
        const accountName = deal.account.nickname
        const clubName = deal.club.name
        const key = `${deal.account.user.name}-${deal.club.id}`
        if (!byPlayer.has(key)) {
          byPlayer.set(key, { playerName, accountName, clubName, totalRake: 0, totalRb: 0, totalRebate: 0, netCommission: 0 })
        }
        const entry = byPlayer.get(key)!
        for (const r of deal.account.weeklyReports) {
          const rake = r.rake ?? 0
          const result = r.result ?? 0
          const rbPct = deal[rbPctField] ?? 0
          const rebatePct = deal[rebatePctField] ?? 0
          const rb = rake * rbPct
          const rebate = rebatePct > 0 ? (result + rb) * rebatePct : 0
          entry.totalRake += rake
          entry.totalRb += rb
          entry.totalRebate += rebate
          entry.netCommission += rb - rebate
        }
      }
      return Array.from(byPlayer.values())
    }

    const referralCommissions = [
      ...calcReferrerEarnings(referrer1DealsRaw, "referrer1RakebackPct", "referrer1RebatePct"),
      ...calcReferrerEarnings(referrer2DealsRaw, "referrer2RakebackPct", "referrer2RebatePct"),
    ]

    const referralBalance = referralCommissions.reduce((s, c) => s + c.netCommission, 0)
    const balanceUsd = weeklyTotal + uplineBalance + referralBalance + txTotal

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
      referralCommissions,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 })
  }
}
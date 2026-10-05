import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        accounts: {
          where: { isActive: true },
          include: {
            weeklyReports: true,
            deals: {
              where: { isActive: true },
              take: 1,
              include: { club: true },
            },
          }
        },
        transactions: true,
        _count: { select: { accounts: true } },
        // Clubs where this user is the upline
        uplineForClubs: {
          where: { isActive: true },
          include: {
            deals: {
              where: { isActive: true },
              include: {
                account: {
                  include: { weeklyReports: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" },
    })

    let uplineOwes = 0

    const usersWithBalance = users.map((u: any) => {
      // Balance from own accounts (downline players)
      const weeklyTotal = u.accounts.reduce((sum: number, acc: any) => {
        const deal = acc.deals?.[0]
        const clubRbPct = deal?.club?.uplineRakebackPct ?? 0
        acc.weeklyReports.forEach((r: any) => {
          uplineOwes += (r.rake ?? 0) * clubRbPct
        })
        return sum + acc.weeklyReports.reduce((s: number, r: any) => s + (r.netResult ?? 0), 0)
      }, 0)

      // Balance from being an upline: sum of (result + rake * uplineRakebackPct) across all accounts in clubs where this user is upline
      const uplineBalance = u.uplineForClubs.reduce((clubSum: number, club: any) => {
        const rbPct = club.uplineRakebackPct ?? 0
        return clubSum + club.deals.reduce((dealSum: number, deal: any) => {
          return dealSum + deal.account.weeklyReports.reduce((rSum: number, r: any) => {
            // Upline owes us: result (players winning = upline pays) + rake share
            return rSum + (r.result ?? 0) + (r.rake ?? 0) * rbPct
          }, 0)
        }, 0)
      }, 0)

      const txTotal = u.transactions.reduce((sum: number, tx: any) => {
        if (tx.direction === "I_PAY_USER") return sum - tx.amount
        if (tx.direction === "USER_PAYS_ME") return sum + tx.amount
        return sum
      }, 0)

      const totalBalance = weeklyTotal + uplineBalance + txTotal

      return { ...u, balance: { amountUsd: totalBalance, amountEur: 0 } }
    })

    const totalUsd = usersWithBalance.reduce((s: number, u: any) => s + u.balance.amountUsd, 0)

    const downlineOwes = usersWithBalance.reduce((s: number, u: any) => {
      const bal = u.balance.amountUsd
      return s + (bal < 0 ? Math.abs(bal) : 0)
    }, 0)

    const netProfit = downlineOwes - uplineOwes

    const activeClubs = await prisma.club.count({ where: { isActive: true } })
    const activeAccounts = await prisma.account.count({ where: { isActive: true } })

    return NextResponse.json({
      users: usersWithBalance, totalUsd, totalEur: 0,
      activeClubs, activeAccounts,
      downlineOwes, uplineOwes, netProfit,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

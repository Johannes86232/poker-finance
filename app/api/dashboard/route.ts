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

    const usersWithBalance = users.map((u: any) => {
      // Balance from own accounts (downline players)
      const weeklyTotal = u.accounts.reduce((sum: number, acc: any) => {
        return sum + acc.weeklyReports.reduce((s: number, r: any) => s + (r.netResult ?? 0), 0)
      }, 0)

      // Balance from being an upline: negative = upline owes us
      const uplineBalance = u.uplineForClubs.reduce((clubSum: number, club: any) => {
        const rbPct = club.uplineRakebackPct ?? 0
        const rebatePct = club.uplineRebatePct ?? 0
        const rebateOn100Rake = club.rebateOn100Rake ?? false
        const rebateOnRakeback = club.rebateOnRakeback ?? false
        return clubSum + club.deals.reduce((dealSum: number, deal: any) => {
          return dealSum + deal.account.weeklyReports.reduce((rSum: number, r: any) => {
            const result = r.result ?? 0
            const rake = r.rake ?? 0
            const rbAmount = rake * rbPct
            // Upline gross = result + their rakeback share
            const gross = result + rbAmount
            // Rebate reduces what upline owes us
            let rebateAmount = 0
            if (rebateOn100Rake) {
              rebateAmount = (result + rake) * rebatePct
            } else if (rebateOnRakeback) {
              rebateAmount = gross * rebatePct
            }
            // Negate: upline owes us → negative balance
            return rSum - (gross - rebateAmount)
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

    // weAreOwed: sum of negative balances (these people owe us money)
    const weAreOwed = usersWithBalance.reduce((s: number, u: any) => {
      const bal = u.balance.amountUsd
      return s + (bal < 0 ? Math.abs(bal) : 0)
    }, 0)

    // weOwe: sum of positive balances (we owe these people money)
    const weOwe = usersWithBalance.reduce((s: number, u: any) => {
      const bal = u.balance.amountUsd
      return s + (bal > 0 ? bal : 0)
    }, 0)

    const netProfit = weAreOwed - weOwe

    const activeClubs = await prisma.club.count({ where: { isActive: true } })
    const activeAccounts = await prisma.account.count({ where: { isActive: true } })

    return NextResponse.json({
      users: usersWithBalance, totalUsd, totalEur: 0,
      activeClubs, activeAccounts,
      weAreOwed, weOwe, netProfit,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

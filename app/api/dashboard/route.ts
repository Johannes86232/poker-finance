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
            deals: { where: { isActive: true }, take: 1 },
          }
        },
        transactions: true,
        _count: { select: { accounts: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    let uplineOwes = 0

    const usersWithBalance = users.map((u: any) => {
      const weeklyTotal = u.accounts.reduce((sum: number, acc: any) => {
        const deal = acc.deals?.[0]
        const clubRbPct = deal?.clubRakebackPct ?? 0
        acc.weeklyReports.forEach((r: any) => {
          uplineOwes += (r.rake ?? 0) * clubRbPct
        })
        return sum + acc.weeklyReports.reduce((s: number, r: any) => s + (r.netResult ?? 0), 0)
      }, 0)

      const txTotal = u.transactions.reduce((sum: number, tx: any) => {
        if (tx.direction === "I_PAY_USER") return sum - tx.amount
        if (tx.direction === "USER_PAYS_ME") return sum + tx.amount
        return sum
      }, 0)

      return { ...u, balance: { amountUsd: weeklyTotal + txTotal, amountEur: 0 } }
    })

    const totalUsd = usersWithBalance.reduce((s: number, u: any) => s + u.balance.amountUsd, 0)
    // totalUsd < 0 means players owe us (downline exposure)
    const downlineOwes = totalUsd < 0 ? Math.abs(totalUsd) : 0
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
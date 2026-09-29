import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        balance: true,
        _count: { select: { accounts: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    const totalUsd = users.reduce((s: number, u: any) => s + (u.balance?.amountUsd ?? 0), 0)
    const totalEur = users.reduce((s: number, u: any) => s + (u.balance?.amountEur ?? 0), 0)
    const activeClubs = await prisma.club.count({ where: { isActive: true } })
    const activeAccounts = await prisma.account.count({ where: { isActive: true } })

    return NextResponse.json({ users, totalUsd, totalEur, activeClubs, activeAccounts })
} catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
}
}
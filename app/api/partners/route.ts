import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: {
      clubs: {
        include: {
          deals: {
            include: {
              account: {
                include: {
                  weeklyReports: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const result = partners.map((partner) => {
    let totalResult = 0
    let totalRake = 0
    let balance = 0

    for (const club of partner.clubs) {
      const pct = club.partnerRakebackPct ?? 0
      for (const deal of club.deals) {
        for (const report of deal.account.weeklyReports) {
          const r = report.result ?? 0
          const k = report.rake ?? 0
          totalResult += r
          totalRake += k
          balance += r + k * pct
        }
      }
    }

    return {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      result: totalResult,
      rake: totalRake,
      balance,
    }
  })

  const totalOwed = result.reduce((sum, p) => sum + (p.balance < 0 ? p.balance : 0), 0)

  return NextResponse.json({ partners: result, totalOwed: Math.abs(totalOwed) })
}
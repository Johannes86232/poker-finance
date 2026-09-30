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
                include: { weeklyReports: true },
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
    let partnerBalance = 0

    for (const club of partner.clubs) {
      const pct = club.partnerRakebackPct ?? 0
      for (const deal of club.deals) {
        for (const report of deal.account.weeklyReports) {
          const r = report.result ?? 0
          const k = report.rake ?? 0
          totalResult += r
          totalRake += k
          partnerBalance += r + k * pct
        }
      }
    }

    return {
      id: partner.id,
      name: partner.name,
      telegramHandle: partner.telegramHandle ?? null,
      notes: partner.notes ?? null,
      isActive: partner.isActive ?? true,
      clubCount: partner.clubs.length,
      totalResult,
      totalRake,
      partnerBalance,
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const { name, telegramHandle, notes } = await req.json()
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })
  const partner = await prisma.partner.create({
    data: { name, telegramHandle: telegramHandle || null, notes: notes || null },
  })
  return NextResponse.json(partner)
}
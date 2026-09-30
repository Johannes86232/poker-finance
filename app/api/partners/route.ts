import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: {
      clubs: {
        where: { isActive: true },
        include: {
          deals: {
            where: { isActive: true },
            include: {
              account: { include: { weeklyReports: true } }
            }
          }
        }
      }
    }
  })

  const result = partners.map(p => {
    let totalResult = 0
    let totalRake = 0
    let partnerBalance = 0

    for (const club of p.clubs) {
      for (const deal of club.deals) {
        for (const r of deal.account.weeklyReports) {
          totalResult += r.result
          totalRake += r.rake
          // Partner balance = result + rake * clubRakebackPct (what we owe/get from partner)
          partnerBalance += r.result + r.rake * deal.clubRakebackPct
        }
      }
    }

    return {
      id: p.id,
      name: p.name,
      telegramHandle: p.telegramHandle,
      notes: p.notes,
      isActive: p.isActive,
      clubCount: p.clubs.length,
      totalResult,
      totalRake,
      partnerBalance, // negative = we owe partner, positive = partner owes us
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const partner = await prisma.partner.create({
    data: { name: body.name, telegramHandle: body.telegramHandle || null, notes: body.notes || null }
  })
  return NextResponse.json(partner)
}
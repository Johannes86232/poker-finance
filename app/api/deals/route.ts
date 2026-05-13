import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        account: {
          include: {
            user: { select: { id: true, name: true, telegramHandle: true } },
          },
        },
        club: { select: { id: true, name: true, currency: true, app: true } },
      },
    })
    return NextResponse.json(deals)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { accountId, clubId, rakebackPct, rebatePct } = body

    if (!accountId || !clubId) {
      return NextResponse.json({ error: "Account and Club are required" }, { status: 400 })
    }

    const deal = await prisma.deal.create({
      data: {
        accountId: parseInt(accountId),
        clubId: parseInt(clubId),
        rakebackPct: parseFloat(rakebackPct) || 0,
        rebatePct: parseFloat(rebatePct) || 0,
      },
      include: {
        account: { include: { user: { select: { name: true } } } },
        club: { select: { name: true } },
      },
    })
    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 })
  }
}
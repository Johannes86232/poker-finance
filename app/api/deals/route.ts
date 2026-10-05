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
        referrer1: { select: { id: true, name: true } },
        referrer2: { select: { id: true, name: true } },
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
    const { userId, clubId, rakebackPct, rebatePct,
            referrer1UserId, referrer1RakebackPct, referrer1RebatePct,
            referrer2UserId, referrer2RakebackPct, referrer2RebatePct } = body

    if (!userId || !clubId) {
      return NextResponse.json({ error: "User and Club are required" }, { status: 400 })
    }

    // Get all accounts for this user
    const accounts = await prisma.account.findMany({
      where: { userId: parseInt(userId), isActive: true },
      select: { id: true },
    })

    if (accounts.length === 0) {
      return NextResponse.json({ error: "User has no active accounts" }, { status: 400 })
    }

    // Create a deal for each account
    const deals = await Promise.all(
      accounts.map(account =>
        prisma.deal.create({
          data: {
            accountId: account.id,
            clubId: parseInt(clubId),
            rakebackPct: (parseFloat(rakebackPct) || 0) / 100,
            rebatePct: (parseFloat(rebatePct) || 0) / 100,
            ...(referrer1UserId && { referrer1UserId: parseInt(referrer1UserId) }),
            referrer1RakebackPct: (parseFloat(referrer1RakebackPct) || 0) / 100,
            referrer1RebatePct: (parseFloat(referrer1RebatePct) || 0) / 100,
            ...(referrer2UserId && { referrer2UserId: parseInt(referrer2UserId) }),
            referrer2RakebackPct: (parseFloat(referrer2RakebackPct) || 0) / 100,
            referrer2RebatePct: (parseFloat(referrer2RebatePct) || 0) / 100,
          },
          include: {
            account: { include: { user: { select: { name: true } } } },
            club: { select: { name: true } },
          },
        })
      )
    )

    return NextResponse.json(deals, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 })
  }
}
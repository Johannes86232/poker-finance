import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, telegramHandle: true } },
        deals: {
          where: { isActive: true },
          select: {
            rakebackPct: true,
            rebatePct: true,
            club: { select: { name: true, currency: true } }
          }
        },
      },
    })
    return NextResponse.json(accounts)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, app, nickname, accountId, superagent, agent } = body

    if (!userId || !nickname) {
      return NextResponse.json({ error: "User and Nickname are required" }, { status: 400 })
    }

    const account = await prisma.account.create({
      data: {
        userId: parseInt(userId),
        app: app || null,
        nickname,
        accountId: accountId || null,
        superagent: superagent || null,
        agent: agent || null,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json(account, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
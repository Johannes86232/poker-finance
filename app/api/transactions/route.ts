import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, telegramHandle: true } },
        toUser: { select: { id: true, name: true, telegramHandle: true } },
        week: { select: { year: true, weekNum: true } },
      },
    })
    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, toUserId, type, direction, method, amount, currency, description, weekId } = body

    if (!userId || !type || !direction || !amount) {
      return NextResponse.json({ error: "User, type, direction and amount are required" }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: parseInt(userId),
        toUserId: toUserId ? parseInt(toUserId) : null,
        type,
        direction,
        method: method || "INTERNAL",
        amount: parseFloat(amount),
        currency: currency || "USD",
        description: description || null,
        weekId: weekId ? parseInt(weekId) : null,
      },
      include: {
        user: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    })

    // Update balance
    const multiplier = direction === "I_PAY_USER" ? 1 : -1
    await prisma.balance.upsert({
      where: { userId: parseInt(userId) },
      update: {
        amountUsd: currency === "USD"
          ? { increment: parseFloat(amount) * multiplier }
          : undefined,
        amountEur: currency === "EUR"
          ? { increment: parseFloat(amount) * multiplier }
          : undefined,
      },
      create: {
        userId: parseInt(userId),
        amountUsd: currency === "USD" ? parseFloat(amount) * multiplier : 0,
        amountEur: currency === "EUR" ? parseFloat(amount) * multiplier : 0,
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}
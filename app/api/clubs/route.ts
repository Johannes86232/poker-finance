import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: { name: "asc" },
      include: {
        uplineUser: { select: { id: true, name: true } },
        referrerUser: { select: { id: true, name: true } },
        _count: { select: { deals: true } },
      },
    })
    return NextResponse.json(clubs)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, app, currency, calcType, chipValue, uplineUserId, uplineRakebackPct, uplineRebatePct, rebateOnRakeback, rebateOn100Rake, referrerUserId, referrerRakebackPct, referrerRebatePct } = await req.json()
    const club = await prisma.club.create({
      data: {
        name,
        app: app || null,
        currency: currency || "USD",
        calcType: calcType || "STANDARD",
        chipValue: parseFloat(chipValue) || 1,
        uplineUserId: uplineUserId ? Number(uplineUserId) : null,
        uplineRakebackPct: uplineRakebackPct ? parseFloat(uplineRakebackPct) / 100 : 0,
        uplineRebatePct: uplineRebatePct ? parseFloat(uplineRebatePct) / 100 : 0,
        rebateOnRakeback: rebateOnRakeback ?? false,
        rebateOn100Rake: rebateOn100Rake ?? false,
        referrerUserId: referrerUserId ? Number(referrerUserId) : null,
        referrerRakebackPct: referrerRakebackPct ? parseFloat(referrerRakebackPct) / 100 : 0,
        referrerRebatePct: referrerRebatePct ? parseFloat(referrerRebatePct) / 100 : 0,
      },
      include: {
        uplineUser: { select: { id: true, name: true } },
        referrerUser: { select: { id: true, name: true } },
        _count: { select: { deals: true } },
      },
    })
    return NextResponse.json(club, { status: 201 })
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Club name already exists" }, { status: 409 })
    console.error(e)
    return NextResponse.json({ error: "Failed to create club" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, name, app, currency, calcType, chipValue, uplineUserId, isActive, uplineRakebackPct, uplineRebatePct, rebateOnRakeback, rebateOn100Rake, referrerUserId, referrerRakebackPct, referrerRebatePct } = await req.json()
    const club = await prisma.club.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(app !== undefined && { app }),
        ...(currency !== undefined && { currency }),
        ...(calcType !== undefined && { calcType }),
        ...(chipValue !== undefined && { chipValue: parseFloat(chipValue) }),
        ...(isActive !== undefined && { isActive }),
        ...(uplineUserId !== undefined && { uplineUserId: uplineUserId ? Number(uplineUserId) : null }),
        ...(uplineRakebackPct !== undefined && { uplineRakebackPct: parseFloat(uplineRakebackPct) / 100 }),
        ...(uplineRebatePct !== undefined && { uplineRebatePct: parseFloat(uplineRebatePct) / 100 }),
        ...(rebateOnRakeback !== undefined && { rebateOnRakeback }),
        ...(rebateOn100Rake !== undefined && { rebateOn100Rake }),
        ...(referrerUserId !== undefined && { referrerUserId: referrerUserId ? Number(referrerUserId) : null }),
        ...(referrerRakebackPct !== undefined && { referrerRakebackPct: parseFloat(referrerRakebackPct) / 100 }),
        ...(referrerRebatePct !== undefined && { referrerRebatePct: parseFloat(referrerRebatePct) / 100 }),
      },
      include: {
        uplineUser: { select: { id: true, name: true } },
        referrerUser: { select: { id: true, name: true } },
        _count: { select: { deals: true } },
      },
    })
    return NextResponse.json(club)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to update club" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: { name: "asc" },
      include: {
        partner: { select: { id: true, name: true } },
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
    const { name, app, currency, calcType, chipValue, partnerId } = await req.json()
    const club = await prisma.club.create({
      data: {
        name,
        app: app || null,
        currency: currency || "USD",
        calcType: calcType || "STANDARD",
        chipValue: parseFloat(chipValue) || 1,
        partnerId: partnerId ? Number(partnerId) : null,
      },
      include: {
        partner: { select: { id: true, name: true } },
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
    const { id, name, app, currency, calcType, chipValue, partnerId, isActive } = await req.json()
    const club = await prisma.club.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(app !== undefined && { app }),
        ...(currency !== undefined && { currency }),
        ...(calcType !== undefined && { calcType }),
        ...(chipValue !== undefined && { chipValue: parseFloat(chipValue) }),
        ...(isActive !== undefined && { isActive }),
        ...(partnerId !== undefined && { partnerId: partnerId ? Number(partnerId) : null }),
      },
      include: {
        partner: { select: { id: true, name: true } },
        _count: { select: { deals: true } },
      },
    })
    return NextResponse.json(club)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to update club" }, { status: 500 })
  }
}
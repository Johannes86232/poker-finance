import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    const body = await req.json()
    const id = parseInt((await params).id)
    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(body.rakebackPct !== undefined && { rakebackPct: parseFloat(body.rakebackPct) / 100 }),
        ...(body.rebatePct !== undefined && { rebatePct: parseFloat(body.rebatePct) / 100 }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.referrer1UserId !== undefined && { referrer1UserId: body.referrer1UserId ? parseInt(body.referrer1UserId) : null }),
        ...(body.referrer1RakebackPct !== undefined && { referrer1RakebackPct: parseFloat(body.referrer1RakebackPct) / 100 }),
        ...(body.referrer1RebatePct !== undefined && { referrer1RebatePct: parseFloat(body.referrer1RebatePct) / 100 }),
        ...(body.referrer2UserId !== undefined && { referrer2UserId: body.referrer2UserId ? parseInt(body.referrer2UserId) : null }),
        ...(body.referrer2RakebackPct !== undefined && { referrer2RakebackPct: parseFloat(body.referrer2RakebackPct) / 100 }),
        ...(body.referrer2RebatePct !== undefined && { referrer2RebatePct: parseFloat(body.referrer2RebatePct) / 100 }),
      },
    })
    return NextResponse.json(deal)
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
  try {
    const id = parseInt((await params).id)
    await prisma.deal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

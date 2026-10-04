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

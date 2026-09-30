import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  const id = parseInt((await params).id)
  const body = await req.json()
  const partner = await prisma.partner.update({
    where: { id },
    data: { name: body.name, telegramHandle: body.telegramHandle ?? null, notes: body.notes ?? null, isActive: body.isActive ?? true }
  })
  return NextResponse.json(partner)
}

export async function DELETE(_: NextRequest, { params }: { params: any }) {
  const id = parseInt((await params).id)
  await prisma.partner.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
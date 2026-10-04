import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// DELETE /api/admin/reset-reports — wipe all weekly reports and weeks
export async function DELETE() {
  try {
    await prisma.weeklyReport.deleteMany({})
    await prisma.week.deleteMany({})
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

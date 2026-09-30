import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  try {
    const reports = await prisma.weeklyReport.deleteMany({})
    const weeks = await prisma.week.deleteMany({})
    return NextResponse.json({ deleted: { weeklyReports: reports.count, weeks: weeks.count } })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 })
  }
}
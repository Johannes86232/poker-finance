import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/weeks — list all weeks with import summary per club
export async function GET() {
  try {
    const weeks = await prisma.week.findMany({
      orderBy: [{ year: "desc" }, { weekNum: "desc" }],
      include: {
        weeklyReports: {
          select: {
            id: true,
            clubId: true,
            result: true,
            rake: true,
            rakebackAmount: true,
            importedAt: true,
            importFile: true,
            club: { select: { id: true, name: true } },
          },
        },
      },
    })

    const result = weeks.map(week => {
      const byClub: Record<number, {
        clubId: number; clubName: string
        count: number; importFile: string | null; importedAt: Date | null
        totalResult: number; totalRake: number; totalRakeback: number
      }> = {}

      // Track "no club" reports separately
      const noClubKey = 0

      for (const r of week.weeklyReports) {
        const cid = r.clubId ?? noClubKey
        const clubName = r.club?.name ?? (cid === 0 ? "Unknown Club" : "Unknown")
        if (!byClub[cid]) {
          byClub[cid] = {
            clubId: cid,
            clubName,
            count: 0,
            importFile: r.importFile ?? null,
            importedAt: r.importedAt,
            totalResult: 0,
            totalRake: 0,
            totalRakeback: 0,
          }
        }
        byClub[cid].count++
        byClub[cid].totalResult += r.result
        byClub[cid].totalRake += r.rake
        byClub[cid].totalRakeback += r.rakebackAmount
        if (r.importedAt > (byClub[cid].importedAt ?? new Date(0))) {
          byClub[cid].importedAt = r.importedAt
          byClub[cid].importFile = r.importFile ?? null
        }
      }

      const clubs = Object.values(byClub)
      return {
        id: week.id,
        year: week.year,
        weekNum: week.weekNum,
        label: week.label,
        createdAt: week.createdAt,
        clubs,
        reportCount: week.weeklyReports.length,
      }
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// DELETE /api/weeks?weekId=X&clubId=Y — delete reports for a specific week+club combo
// DELETE /api/weeks?weekId=X — delete all reports for a week (and the week itself)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weekId = parseInt(searchParams.get("weekId") ?? "")
    const clubId = searchParams.get("clubId") ? parseInt(searchParams.get("clubId")!) : null

    if (!weekId) return NextResponse.json({ error: "Missing weekId" }, { status: 400 })

    if (clubId) {
      await prisma.weeklyReport.deleteMany({ where: { weekId, clubId } })
      const remaining = await prisma.weeklyReport.count({ where: { weekId } })
      if (remaining === 0) await prisma.week.delete({ where: { id: weekId } })
    } else {
      await prisma.weeklyReport.deleteMany({ where: { weekId } })
      await prisma.week.delete({ where: { id: weekId } })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

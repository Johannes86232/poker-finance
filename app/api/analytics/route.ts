import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fromYear = searchParams.get("fromYear") ? parseInt(searchParams.get("fromYear")!) : null
    const fromWeek = searchParams.get("fromWeek") ? parseInt(searchParams.get("fromWeek")!) : null
    const toYear = searchParams.get("toYear") ? parseInt(searchParams.get("toYear")!) : null
    const toWeek = searchParams.get("toWeek") ? parseInt(searchParams.get("toWeek")!) : null
    const userId = searchParams.get("userId") ? parseInt(searchParams.get("userId")!) : null
    const clubId = searchParams.get("clubId") ? parseInt(searchParams.get("clubId")!) : null

    // Build week filter
    const weekWhere: any = {}
    if (fromYear && fromWeek) {
      weekWhere.OR = [
        { year: { gt: fromYear } },
        { year: fromYear, weekNum: { gte: fromWeek } },
      ]
    }
    if (toYear && toWeek) {
      const existingOr = weekWhere.OR
      const toFilter = [
        { year: { lt: toYear } },
        { year: toYear, weekNum: { lte: toWeek } },
      ]
      if (existingOr) {
        weekWhere.AND = [{ OR: existingOr }, { OR: toFilter }]
        delete weekWhere.OR
      } else {
        weekWhere.OR = toFilter
      }
    }

    const hasWeekFilter = Object.keys(weekWhere).length > 0

    // Fetch all weekly reports with week + account + deal + club + user
    const reports = await prisma.weeklyReport.findMany({
      where: {
        ...(hasWeekFilter ? { week: weekWhere } : {}),
        account: {
          isActive: true,
          ...(userId ? { userId } : {}),
          deals: { some: { isActive: true, ...(clubId ? { clubId } : {}) } },
        },
        ...(clubId ? { clubId } : {}),
      },
      include: {
        week: true,
        account: {
          include: {
            user: { select: { id: true, name: true } },
            deals: {
              where: { isActive: true },
              include: { club: { select: { id: true, name: true } } },
            },
          },
        },
      },
    })

    // Profit by user: sum netResult per user
    const byUser = new Map<number, { userId: number; userName: string; netResult: number; rake: number; weekCount: number }>()
    const byClub = new Map<number, { clubId: number; clubName: string; netResult: number; rake: number; weekCount: number }>()

    for (const r of reports) {
      const user = r.account.user
      const deal = r.account.deals[0]
      const club = deal?.club

      // By user
      if (!byUser.has(user.id)) {
        byUser.set(user.id, { userId: user.id, userName: user.name, netResult: 0, rake: 0, weekCount: 0 })
      }
      const u = byUser.get(user.id)!
      u.netResult += r.netResult ?? 0
      u.rake += r.rake ?? 0
      u.weekCount += 1

      // By club
      if (club) {
        if (!byClub.has(club.id)) {
          byClub.set(club.id, { clubId: club.id, clubName: club.name, netResult: 0, rake: 0, weekCount: 0 })
        }
        const c = byClub.get(club.id)!
        c.netResult += r.netResult ?? 0
        c.rake += r.rake ?? 0
        c.weekCount += 1
      }
    }

    // Fetch available weeks for the filter dropdowns
    const weeks = await prisma.week.findMany({
      orderBy: [{ year: "desc" }, { weekNum: "desc" }],
      select: { id: true, year: true, weekNum: true },
    })

    const profitByUser = Array.from(byUser.values()).sort((a, b) => a.netResult - b.netResult)
    const profitByClub = Array.from(byClub.values()).sort((a, b) => a.netResult - b.netResult)

    return NextResponse.json({ profitByUser, profitByClub, weeks })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

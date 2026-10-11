import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/import
// Body: { type: "users" | "clubs" | "accounts", rows: any[] }
export async function POST(req: NextRequest) {
  try {
    const { type, rows } = await req.json()

    if (type === "users") {
      return importUsers(rows)
    } else if (type === "clubs") {
      return importClubs(rows)
    } else if (type === "accounts") {
      return importAccounts(rows)
    }
    return NextResponse.json({ error: "Unknown type" }, { status: 400 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

async function importUsers(rows: any[]) {
  const results: any[] = []
  for (const row of rows) {
    const name = String(row.name || "").trim()
    if (!name) continue
    const telegramHandle = row.telegram_handle ? String(row.telegram_handle).trim() : null
    const telegramGroupId = row.telegram_group_id ? String(row.telegram_group_id).trim() : null
    const telegramGroupName = row.telegram_group_name ? String(row.telegram_group_name).trim() : null
    const role = row.role && ["ADMIN", "EXECUTIVE", "STAFF", "USER"].includes(String(row.role).toUpperCase())
      ? String(row.role).toUpperCase()
      : "USER"
    try {
      const existing = await prisma.user.findFirst({ where: { name } })
      let user
      if (existing) {
        user = await prisma.user.update({
          where: { id: existing.id },
          data: { telegramHandle, telegramGroupId, telegramGroupName, role: role as any },
        })
        results.push({ name, status: "updated", id: user.id })
      } else {
        user = await prisma.user.create({
          data: { name, telegramHandle, telegramGroupId, telegramGroupName, role: role as any },
        })
        results.push({ name, status: "created", id: user.id })
      }
    } catch (e: any) {
      results.push({ name, status: "error", error: String(e) })
    }
  }
  return NextResponse.json({ type: "users", results })
}

async function importClubs(rows: any[]) {
  // Build user lookup (case-insensitive)
  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  const userMap = new Map<string, number>()
  for (const u of users) {
    userMap.set(u.name.toLowerCase().trim(), u.id)
  }

  const results: any[] = []
  for (const row of rows) {
    const name = String(row.club_name || "").trim()
    if (!name) continue

    const uplineUserId = row.upline_user
      ? (userMap.get(String(row.upline_user).toLowerCase().trim()) ?? null)
      : null
    const referrerUserId = row.referrer_user
      ? (userMap.get(String(row.referrer_user).toLowerCase().trim()) ?? null)
      : null

    const data = {
      app: row.app || null,
      currency: row.currency || "USD",
      chipValue: row.chip_value ? parseFloat(String(row.chip_value)) : 1,
      uplineUserId,
      uplineRakebackPct: row.upline_rb_pct ? parseFloat(String(row.upline_rb_pct)) / 100 : 0,
      uplineRebatePct: row.upline_rebate_pct ? parseFloat(String(row.upline_rebate_pct)) / 100 : 0,
      rebateOnRakeback: String(row.rebate_on_rakeback || "").toLowerCase() === "yes",
      rebateOn100Rake: String(row.rebate_on_100rake || "").toLowerCase() === "yes",
      referrerUserId,
      referrerRakebackPct: row.referrer_rb_pct ? parseFloat(String(row.referrer_rb_pct)) / 100 : 0,
      referrerRebatePct: row.referrer_rebate_pct ? parseFloat(String(row.referrer_rebate_pct)) / 100 : 0,
    }

    try {
      const club = await prisma.club.upsert({
        where: { name },
        update: data,
        create: { name, ...data },
      })
      const warnings: string[] = []
      if (row.upline_user && !uplineUserId) warnings.push(`Upline user '${row.upline_user}' not found`)
      if (row.referrer_user && !referrerUserId) warnings.push(`Referrer '${row.referrer_user}' not found`)
      results.push({ name, status: "ok", id: club.id, warnings })
    } catch (e: any) {
      results.push({ name, status: "error", error: String(e) })
    }
  }
  return NextResponse.json({ type: "clubs", results })
}

async function importAccounts(rows: any[]) {
  // Build lookups
  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  const userMap = new Map<string, number>()
  for (const u of users) userMap.set(u.name.toLowerCase().trim(), u.id)

  const clubs = await prisma.club.findMany({ select: { id: true, name: true } })
  const clubMap = new Map<string, number>()
  for (const c of clubs) clubMap.set(c.name.toLowerCase().trim(), c.id)

  const results: any[] = []
  for (const row of rows) {
    const rawUserName = String(row.user_name || "").trim()
    const nickname = String(row.nickname || "").trim()
    const clubName = String(row.club_name || "").trim()
    if (!rawUserName || !nickname || !clubName) continue

    // user_name format: "UserName-suffix" — strip suffix after last "-"
    // But some names contain "-" (e.g. "Josh ( Pinnacle )"), so we match greedily against known users
    let userId: number | null = null
    let matchedUserName = rawUserName
    // Try full name first
    if (userMap.has(rawUserName.toLowerCase())) {
      userId = userMap.get(rawUserName.toLowerCase())!
      matchedUserName = rawUserName
    } else {
      // Try progressively shorter suffixes (strip last "-word")
      const parts = rawUserName.split("-")
      for (let i = parts.length - 1; i >= 1; i--) {
        const candidate = parts.slice(0, i).join("-").trim()
        if (userMap.has(candidate.toLowerCase())) {
          userId = userMap.get(candidate.toLowerCase())!
          matchedUserName = candidate
          break
        }
      }
    }

    const clubId = clubMap.get(clubName.toLowerCase()) ?? null
    const accountId = row.account_id ? String(row.account_id).trim() : null
    const app = row.app ? String(row.app).trim() : null
    const rakebackPct = row.rakeback_pct ? parseFloat(String(row.rakeback_pct)) / 100 : 0
    const rebatePct = row.rebate_pct ? parseFloat(String(row.rebate_pct)) / 100 : 0

    const ref1Name = row.referrer1_name ? String(row.referrer1_name).trim() : null
    const ref2Name = row.referrer2_name ? String(row.referrer2_name).trim() : null
    const ref1UserId = ref1Name ? (userMap.get(ref1Name.toLowerCase()) ?? null) : null
    const ref2UserId = ref2Name ? (userMap.get(ref2Name.toLowerCase()) ?? null) : null
    const ref1RbPct = row.referrer1_rb_pct ? parseFloat(String(row.referrer1_rb_pct)) / 100 : 0
    const ref2RbPct = row.referrer2_rb_pct ? parseFloat(String(row.referrer2_rb_pct)) / 100 : 0

    const warnings: string[] = []
    if (!userId) warnings.push(`User '${rawUserName}' not found — skipping`)
    if (!clubId) warnings.push(`Club '${clubName}' not found — skipping`)
    if (ref1Name && !ref1UserId) warnings.push(`Referrer1 '${ref1Name}' not found`)
    if (ref2Name && !ref2UserId) warnings.push(`Referrer2 '${ref2Name}' not found`)

    if (!userId || !clubId) {
      results.push({ row: rawUserName + " / " + nickname + " / " + clubName, status: "skip", warnings })
      continue
    }

    try {
      // Find or create account: match by userId + nickname (unique combo)
      let account = await prisma.account.findFirst({
        where: { userId, nickname },
      })
      if (!account) {
        account = await prisma.account.create({
          data: { userId, nickname, accountId, app },
        })
      } else {
        account = await prisma.account.update({
          where: { id: account.id },
          data: { accountId: accountId || account.accountId, app: app || account.app },
        })
      }

      // Upsert deal: deactivate existing active deal for this account+club, then create new
      await prisma.deal.updateMany({
        where: { accountId: account.id, clubId, isActive: true },
        data: { isActive: false },
      })
      const deal = await prisma.deal.create({
        data: {
          accountId: account.id,
          clubId,
          rakebackPct,
          rebatePct,
          referrer1UserId: ref1UserId,
          referrer1RakebackPct: ref1RbPct,
          referrer2UserId: ref2UserId,
          referrer2RakebackPct: ref2RbPct,
        },
      })

      results.push({
        row: matchedUserName + " / " + nickname + " / " + clubName,
        status: "ok",
        accountId: account.id,
        dealId: deal.id,
        warnings,
      })
    } catch (e: any) {
      results.push({
        row: rawUserName + " / " + nickname + " / " + clubName,
        status: "error",
        error: String(e),
        warnings,
      })
    }
  }
  return NextResponse.json({ type: "accounts", results })
}

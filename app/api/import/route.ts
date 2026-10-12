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
  // Build lookups — 2 queries total upfront
  const [users, clubs, existingAccounts] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.club.findMany({ select: { id: true, name: true } }),
    prisma.account.findMany({ select: { id: true, userId: true, nickname: true, accountId: true, app: true } }),
  ])

  const userMap = new Map<string, number>()
  for (const u of users) userMap.set(u.name.toLowerCase().trim(), u.id)

  const clubMap = new Map<string, number>()
  for (const c of clubs) clubMap.set(c.name.toLowerCase().trim(), c.id)

  // accountKey → existing account
  const accountMap = new Map<string, { id: number; accountId: string | null; app: string | null }>()
  for (const a of existingAccounts) accountMap.set(`${a.userId}:${a.nickname}`, { id: a.id, accountId: a.accountId, app: a.app })

  // Parse all rows first — resolve user/club IDs in memory
  type ParsedRow = {
    rawUserName: string
    matchedUserName: string
    nickname: string
    clubName: string
    userId: number
    clubId: number
    accountId: string | null
    app: string | null
    rakebackPct: number
    rebatePct: number
    ref1UserId: number | null
    ref1RbPct: number
    ref2UserId: number | null
    ref2RbPct: number
    warnings: string[]
  }

  const parsed: ParsedRow[] = []
  const skipped: any[] = []

  for (const row of rows) {
    const rawUserName = String(row.user_name || "").trim()
    const nickname = String(row.nickname || "").trim()
    const clubName = String(row.club_name || "").trim()
    if (!rawUserName || !nickname || !clubName) continue

    let userId: number | null = null
    let matchedUserName = rawUserName
    if (userMap.has(rawUserName.toLowerCase())) {
      userId = userMap.get(rawUserName.toLowerCase())!
    } else {
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
      skipped.push({ row: rawUserName + " / " + nickname + " / " + clubName, status: "skip", warnings })
      continue
    }

    parsed.push({ rawUserName, matchedUserName, nickname, clubName, userId, clubId, accountId, app, rakebackPct, rebatePct, ref1UserId, ref1RbPct, ref2UserId, ref2RbPct, warnings })
  }

  // Split into accounts to create vs update
  const toCreate = parsed.filter(r => !accountMap.has(`${r.userId}:${r.nickname}`))
  const toUpdate = parsed.filter(r => accountMap.has(`${r.userId}:${r.nickname}`))

  // Batch-create new accounts
  const createdAccounts = new Map<string, number>() // "userId:nickname" → new id
  if (toCreate.length > 0) {
    // createMany doesn't return ids in Prisma, so we create in a transaction but fetch ids after
    await prisma.account.createMany({
      data: toCreate.map(r => ({ userId: r.userId, nickname: r.nickname, accountId: r.accountId, app: r.app })),
      skipDuplicates: true,
    })
    // Reload newly created accounts
    const newAccounts = await prisma.account.findMany({
      where: { userId: { in: toCreate.map(r => r.userId) } },
      select: { id: true, userId: true, nickname: true },
    })
    for (const a of newAccounts) createdAccounts.set(`${a.userId}:${a.nickname}`, a.id)
  }

  // Batch-update existing accounts (only if accountId/app changed)
  for (const r of toUpdate) {
    const existing = accountMap.get(`${r.userId}:${r.nickname}`)!
    if ((r.accountId && r.accountId !== existing.accountId) || (r.app && r.app !== existing.app)) {
      await prisma.account.update({
        where: { id: existing.id },
        data: { accountId: r.accountId || existing.accountId, app: r.app || existing.app },
      })
    }
  }

  // Resolve all account IDs for deal creation
  const allAccountIds = parsed.map(r => {
    const key = `${r.userId}:${r.nickname}`
    return accountMap.get(key)?.id ?? createdAccounts.get(key) ?? null
  })

  // Batch deactivate all existing active deals for affected account+club combos
  const accountClubPairs = parsed
    .map((r, i) => ({ accountId: allAccountIds[i], clubId: r.clubId }))
    .filter(p => p.accountId !== null) as { accountId: number; clubId: number }[]

  if (accountClubPairs.length > 0) {
    // Prisma doesn't support OR with tuples, so we do it in one updateMany per unique accountId batch
    const accountIds = [...new Set(accountClubPairs.map(p => p.accountId))]
    await prisma.deal.updateMany({
      where: { accountId: { in: accountIds }, isActive: true },
      data: { isActive: false },
    })
  }

  // Batch-create all deals
  const dealData = parsed
    .map((r, i) => {
      const accId = allAccountIds[i]
      if (!accId) return null
      return {
        accountId: accId,
        clubId: r.clubId,
        rakebackPct: r.rakebackPct,
        rebatePct: r.rebatePct,
        referrer1UserId: r.ref1UserId,
        referrer1RakebackPct: r.ref1RbPct,
        referrer2UserId: r.ref2UserId,
        referrer2RakebackPct: r.ref2RbPct,
        isActive: true,
      }
    })
    .filter(Boolean) as any[]

  await prisma.deal.createMany({ data: dealData })

  const results: any[] = [
    ...skipped,
    ...parsed.map((r, i) => ({
      row: r.matchedUserName + " / " + r.nickname + " / " + r.clubName,
      status: allAccountIds[i] ? "ok" : "error",
      warnings: r.warnings,
    })),
  ]

  return NextResponse.json({ type: "accounts", results })
}

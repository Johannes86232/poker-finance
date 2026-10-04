import { NextResponse } from "next/server"

// Partners have been merged into Users. This endpoint is deprecated.
export async function GET() {
  return NextResponse.json({ error: "Partners have been removed. Use /api/users instead." }, { status: 410 })
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { validOn: "desc" },
    })
    return NextResponse.json(rates)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fromCurrency, toCurrency, rate } = body

    if (!fromCurrency || !toCurrency || !rate) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const exchangeRate = await prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency_validOn: {
          fromCurrency,
          toCurrency,
          validOn: today,
        },
      },
      update: { rate: parseFloat(rate) },
      create: {
        fromCurrency,
        toCurrency,
        rate: parseFloat(rate),
        validOn: today,
      },
    })
    return NextResponse.json(exchangeRate, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save rate" }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type FoodRow = {
  id: string
  name: string
  category?: string | null
  brand?: string | null
  servingUnit?: string | null
  servingSize?: number | null
  isPublished?: boolean
  updatedAt?: string
}

function mapRow(r: Record<string, unknown>): FoodRow | null {
  const id = r.id ?? r.ID ?? r.Id ?? r.食品編號 ?? r.代碼 ?? null
  const name = r.name ?? r.名稱 ?? r['食品名稱'] ?? r['Food Name'] ?? null

  if (!id || !name) return null

  const toBool = (v: unknown) =>
    String(v ?? '').toLowerCase() === 'true' || v === true || v === 1
  const toNum = (v: unknown) =>
    v === '' || v == null ? null : Number(v)
  const toStr = (v: unknown) =>
    v == null || v === '' ? null : String(v)

  return {
    id: String(id),
    name: String(name),
    category: toStr(r.category ?? r.分類),
    brand: toStr(r.brand ?? r.品牌),
    servingUnit: toStr(r.serving_unit ?? r.servingUnit ?? r.單位),
    servingSize: toNum(r.serving_size ?? r.servingSize ?? r['每份克數']),
    isPublished: toBool(r.is_published ?? r.isPublished ?? r.發布 ?? r.published),
    updatedAt: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = process.env.SYNC_TOKEN

    if (!token || !auth.startsWith('Bearer ') || auth.substring(7) !== token) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const rows: unknown[] = Array.isArray(body?.rows) ? body.rows : []

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, count: 0, message: 'no rows' })
    }

    const mapped = rows.map((r) => mapRow(r as Record<string, unknown>)).filter(Boolean) as FoodRow[]

    if (mapped.length === 0) {
      return NextResponse.json({ ok: true, count: 0, message: 'no valid rows' })
    }

    await db.$transaction(async (tx) => {
      for (const food of mapped) {
        await tx.food.upsert({
          where: { id: food.id },
          update: {
            name: food.name,
            category: food.category || "其他",
            brand: food.brand,
            servingUnit: food.servingUnit,
            servingSize: food.servingSize,
            caloriesPer100g: 0,
            proteinPer100g: 0,
            carbsPer100g: 0,
            fatPer100g: 0,
            isPublished: food.isPublished,
            updatedAt: new Date(),
          },
          create: {
            id: food.id,
            name: food.name,
            category: food.category || "其他",
            brand: food.brand,
            servingUnit: food.servingUnit,
            servingSize: food.servingSize,
            caloriesPer100g: 0,
            proteinPer100g: 0,
            carbsPer100g: 0,
            fatPer100g: 0,
            isPublished: food.isPublished,
          },
        })
      }
    })

    return NextResponse.json({ ok: true, count: mapped.length })
  } catch (err: unknown) {
    console.error('Sync API error:', err)
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'OK', timestamp: new Date().toISOString() })
}
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q) return NextResponse.json([])

  const tsquery = q.split(' ').filter(Boolean).join(' & ')
  const rows = await db.execute(sql`
    SELECT id, name, common_name, era_start, era_end,
      ts_rank(search_vec, to_tsquery('english', ${tsquery})) AS rank
    FROM species
    WHERE search_vec @@ to_tsquery('english', ${tsquery})
    ORDER BY rank DESC LIMIT 10
  `)

  return NextResponse.json(rows.rows)
}
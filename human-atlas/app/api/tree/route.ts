import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'

export async function GET(req: Request) {
  const era = new URL(req.url).searchParams.get('era')

  const rows = await db.execute(sql`
    SELECT id, name, common_name, path::text,
           era_start, era_end, region, description
    FROM species
    WHERE (${era}::int IS NULL OR era_start <= ${era}::int)
    ORDER BY path
  `)

  return NextResponse.json(rows.rows, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' }
  })
}
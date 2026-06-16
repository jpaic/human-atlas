import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const era = url.searchParams.get('era')
  const region = url.searchParams.get('region')

  const rows = region
    ? await db.execute(sql`
        SELECT id, name, common_name, path::text,
               era_start, era_end, region, description
        FROM species
        WHERE (${era}::int IS NULL OR era_start <= ${era}::int)
          AND region = ${region}
        ORDER BY path
      `)
    : await db.execute(sql`
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
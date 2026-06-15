import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'

export async function GET() {
  const rows = await db.execute(sql`
    SELECT 
      id,
      name,
      common_name,
      path,
      era_start,
      era_end,
      region,
      description
    FROM species
    ORDER BY era_start ASC
  `)

  return NextResponse.json(rows.rows, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate'
    }
  })
}
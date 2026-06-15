import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'

export async function GET() {
  const rows = await db.execute(sql`
    SELECT r.id, r.name, r.era_start, r.era_end,
      json_agg(
        json_build_object(
          'seq', w.seq,
          'lng', ST_X(w.location),
          'lat', ST_Y(w.location),
          'label', w.label,
          'era', w.era
        ) ORDER BY w.seq
      ) AS waypoints
    FROM migration_routes r
    JOIN migration_waypoints w ON w.route_id = r.id
    GROUP BY r.id ORDER BY r.era_start
  `)

  return NextResponse.json(rows.rows, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' }
  })
}
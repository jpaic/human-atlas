import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'

export async function GET() {
  const [nodes, edges] = await Promise.all([
    db.execute(sql`
      SELECT p.id, p.name, p.region, s.name AS species_name
      FROM populations p JOIN species s ON s.id = p.species_id
    `),
    db.execute(sql`
      SELECT source_id, target_id, percentage, era, notes
      FROM gene_flow ORDER BY percentage DESC
    `)
  ])

  return NextResponse.json({ nodes: nodes.rows, edges: edges.rows }, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' }
  })
}
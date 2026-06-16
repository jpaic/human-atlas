'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtlasStore } from '@/store/useAtlasStore'

interface Route {
  id: number
  name: string
  era_start: number
  era_end: number | null
}

const ROUTE_COLORS = [
  '#D97706', '#C2643A', '#7C9E6B',
  '#6B8BA4', '#9B7B9E', '#7EA8A0',
]

function formatEra(era: number) {
  const abs = Math.abs(era)
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M BP`
  if (abs >= 1_000)     return `${(abs / 1_000).toFixed(0)}K BP`
  return `${abs.toLocaleString()} BP`
}

export function MigrationLegend() {
  const { activeEra } = useAtlasStore()

  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ['routes'],
    queryFn: () => fetch('/api/routes').then(r => r.json()),
    staleTime: 60_000 * 5,
  })

  const visible = routes.filter(r => r.era_start <= activeEra)
  const future  = routes.filter(r => r.era_start > activeEra)

  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(var(--timeline-height) + 12px)',
      left: 16,
      zIndex: 20,
      background: 'rgba(31, 28, 24, 0.92)',
      backdropFilter: 'blur(8px)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      padding: '12px 14px',
      minWidth: 200,
      maxWidth: 240,
    }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 10,
      }}>Active routes · {visible.length}</div>

      {visible.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No routes at this era
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visible.map((r, i) => (
            <div key={r.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{
                width: 20,
                height: 2,
                borderRadius: 1,
                background: ROUTE_COLORS[i % ROUTE_COLORS.length],
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {r.name}
                </div>
                <div style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}>
                  {formatEra(r.era_start)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {future.length > 0 && (
        <div style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 6,
          }}>Future · {future.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {future.slice(0, 3).map(r => (
              <div key={r.id} style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {r.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
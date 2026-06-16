'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAtlasStore } from '@/store/useAtlasStore'

interface Species {
  id: number
  name: string
  path: string
  era_start: number
}

function formatEra(era: number) {
  const abs = Math.abs(era)
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${(abs / 1_000).toFixed(0)}K`
  return `${abs}`
}

export function EvolutionControls() {
  const { activeEra, setEra } = useAtlasStore()
  const [expanded, setExpanded] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const { data: allSpecies = [] } = useQuery<Species[]>({
    queryKey: ['species-jump-list'],
    queryFn: () => fetch('/api/species').then(r => r.json()),
  })

  const groups = useMemo(() => {
    const tree = new Map<string, Species[]>()

    allSpecies.forEach((species) => {
      const parts = species.path.split('.')
      const group = parts.length > 1 ? parts[1] : 'Other'
      const bucket = tree.get(group) ?? []
      bucket.push(species)
      tree.set(group, bucket)
    })

    return Array.from(tree.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, list]) => [group, list.sort((a, b) => a.era_start - b.era_start)] as const)
  }, [allSpecies])

  return (
    <div style={{
      position: 'absolute',
      top: 58,
      left: 14,
      zIndex: 30,
      width: expanded ? 220 : undefined,
      height: expanded ? 'calc(100% - 58px - var(--timeline-height))' : undefined,
      background: expanded ? 'rgba(31, 28, 24, 0.84)' : undefined,
      backdropFilter: expanded ? 'blur(12px)' : undefined,
      border: expanded ? '1px solid rgba(245,240,232,0.09)' : undefined,
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: expanded ? '0 18px 40px rgba(0,0,0,0.22)' : undefined,
      display: expanded ? 'flex' : 'block',
      flexDirection: expanded ? 'column' : undefined,
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>Filters</span>
        <span style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          transition: 'transform var(--transition-fast)',
          display: 'inline-block',
        }}>▾</span>
      </button>

      {expanded && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groups.map(([group, members]) => {
              const isCollapsed = collapsedGroups[group]
              return (
                <div key={group}>
                  <button
                    onClick={() => setCollapsedGroups(prev => ({
                      ...prev,
                      [group]: !prev[group],
                    }))}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(245,240,232,0.08)',
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{group}</span>
                    <span style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}>
                      ▾
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 8, marginTop: 10 }}>
                      {members.map((species) => (
                        <button
                          key={species.id}
                          onClick={() => setEra(species.era_start)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: activeEra === species.era_start ? 'var(--text-amber)' : 'var(--text-secondary)',
                            background: activeEra === species.era_start ? 'rgba(217,119,6,0.1)' : 'transparent',
                            border: '1px solid transparent',
                            transition: 'all var(--transition-fast)',
                            cursor: 'pointer',
                          }}
                        >
                          <span>{species.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                            {formatEra(species.era_start)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

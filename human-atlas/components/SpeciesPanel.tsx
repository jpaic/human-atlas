'use client'

import { useAtlasStore } from '@/store/useAtlasStore'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

interface Species {
  id: number
  name: string
  common_name: string | null
  era_start: number
  era_end: number | null
  region: string | null
  description: string | null
  tool_use: string | null
}

function formatEra(era: number | null) {
  if (era === null) return 'Present'
  const abs = Math.abs(era)
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M BP`
  if (abs >= 1_000)     return `${(abs / 1_000).toFixed(0)}K BP`
  return `${abs.toLocaleString()} BP`
}

function durationYears(start: number, end: number | null) {
  const endYear = end ?? 0
  const diff = Math.abs(start - endYear)
  if (diff >= 1_000_000) return `${(diff / 1_000_000).toFixed(1)}M years`
  if (diff >= 1_000)     return `${(diff / 1_000).toFixed(0)}K years`
  return `${diff.toLocaleString()} years`
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '8px 0',
      borderBottom: '1px solid var(--border-subtle)',
      gap: 12,
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right', lineHeight: 1.4 }}>
        {value}
      </span>
    </div>
  )
}

export function SpeciesPanel() {
  const { selectedSpeciesId, selectSpecies } = useAtlasStore()
  const panelRef = useRef<HTMLDivElement>(null)

  const { data: allSpecies } = useQuery<Species[]>({
    queryKey: ['species'],
    queryFn: () => fetch('/api/species').then(r => r.json()),
  })

  const species = allSpecies?.find(s => s.id === selectedSpeciesId) ?? null

  const open = selectedSpeciesId !== null

  // Animate in
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    if (open) {
      el.style.transform = 'translateX(0)'
      el.style.opacity = '1'
    } else {
      el.style.transform = 'translateX(20px)'
      el.style.opacity = '0'
    }
  }, [open])

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 'var(--timeline-height)',
        width: 'var(--panel-width)',
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(20px)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'all var(--transition-base)',
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 6,
          }}>Species record</div>
          {species ? (
            <>
              <div style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                fontStyle: 'italic',
              }}>
                {species.name}
              </div>
              {species.common_name && (
                <div style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginTop: 3,
                }}>
                  {species.common_name}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton" style={{ width: 140, height: 20 }} />
              <div className="skeleton" style={{ width: 90, height: 14 }} />
            </div>
          )}
        </div>

        <button
          onClick={() => selectSpecies(null)}
          aria-label="Close panel"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            background: 'var(--bg-hover)',
            fontSize: 16,
            flexShrink: 0,
            transition: 'all var(--transition-fast)',
          }}
        >
          ×
        </button>
      </div>

      {/* Era bar */}
      {species && (
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Temporal range
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-amber)', fontFamily: 'var(--font-mono)' }}>
              {durationYears(species.era_start, species.era_end)}
            </span>
          </div>
          <div style={{
            height: 3,
            background: 'var(--border-subtle)',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: `${Math.max(0, ((-4_200_000 - species.era_start) / -4_200_000) * 100)}%`,
              width: `${Math.max(2, (Math.abs(species.era_start - (species.era_end ?? 0)) / 4_200_000) * 100)}%`,
              height: '100%',
              background: 'var(--accent-amber)',
              borderRadius: 2,
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {formatEra(species.era_start)}
            </span>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {formatEra(species.era_end)}
            </span>
          </div>
        </div>
      )}

      {/* Data */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 20px 20px',
      }}>
        {species ? (
          <>
            <DataRow label="Region"   value={species.region ?? 'Unknown'} />
            <DataRow label="Appeared" value={formatEra(species.era_start)} />
            <DataRow label="Extinct"  value={formatEra(species.era_end)} />
            {species.tool_use && (
              <DataRow label="Technology" value={species.tool_use} />
            )}

            {species.description && (
              <div style={{ marginTop: 16 }}>
                <div style={{
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}>Overview</div>
                <p style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                }}>
                  {species.description}
                </p>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
            {[80, 60, 90, 70].map((w, i) => (
              <div key={i} className="skeleton" style={{ width: `${w}%`, height: 12 }} />
            ))}
          </div>
        )}
      </div>

      {/* Taxonomic path footer */}
      {species && (
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}>TAXONOMY</div>
          <div style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            wordBreak: 'break-all',
          }}>
            Hominidae → Homo → {species.name.split(' ').pop()}
          </div>
        </div>
      )}
    </div>
  )
}
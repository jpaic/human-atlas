'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAtlasStore } from '@/store/useAtlasStore'

interface Species {
  id: number
  name: string
  common_name: string | null
  era_start: number | null
  era_end: number | null
  region: string | null
}

const MODULE_ACTIONS = [
  { key: 'evolution', label: 'Tree',  color: '#D97706', href: '/evolution' as const },
  { key: 'migration', label: 'Map',   color: '#6B8BA4', href: '/migration' as const },
  { key: 'genetics',  label: 'G',     color: '#7EA8A0', href: '/genetics' as const },
]

function formatShort(era: number | null) {
  if (era === null) return 'Pres'
  const abs = Math.abs(era)
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${(abs / 1_000).toFixed(0)}K`
  return era === 0 ? 'Pres' : `${abs.toLocaleString()}`
}

function getShortName(name: string) {
  const parts = name.split(' ')
  if (parts.length < 2) return name
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
}

export default function Home() {
  const router = useRouter()
  const selectSpecies = useAtlasStore(s => s.selectSpecies)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const { data: allSpecies = [], isLoading } = useQuery<Species[]>({
    queryKey: ['species'],
    queryFn: () => fetch('/api/species').then(r => r.json()),
    staleTime: 60_000 * 5,
  })

  const filtered = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return allSpecies.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.common_name && s.common_name.toLowerCase().includes(q)) ||
      (s.region && s.region.toLowerCase().includes(q))
    )
  }, [allSpecies, query])

  const totalSpan = useMemo(() => {
    const eras = allSpecies.filter(s => s.era_start !== null).map(s => s.era_start!)
    if (eras.length === 0) return 4_200_000
    return Math.abs(Math.min(...eras))
  }, [allSpecies])

  const stats = useMemo(() => ({
    total: allSpecies.length,
    extant: allSpecies.filter(s => s.era_end === null).length,
  }), [allSpecies])

  const handleOpenInModule = useCallback((speciesId: number, href: string) => {
    if (href === '/evolution') selectSpecies(speciesId)
    router.push(href)
  }, [router, selectSpecies])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
    }}>
      <div style={{
        flex: 1,
        overflow: 'auto',
      }}>
        <div style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: query.trim() ? '40px 24px 48px' : '80px 24px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          transition: 'padding 250ms',
        }}>
          {/* Header */}
          <div>
            <div style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 10,
            }}>
              Atlas dashboard
            </div>
            <h1 style={{
              fontSize: 32,
              lineHeight: 1.08,
              fontWeight: 650,
            }}>
              Human ancestry across trees, routes, and genes.
            </h1>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, common name, or region..."
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{
                width: '100%',
                height: 48,
                padding: '0 100px 0 16px',
                background: 'var(--bg-panel)',
                border: `1px solid ${focused ? 'var(--border-amber)' : 'var(--border-default)'}`,
                borderRadius: 10,
                color: 'var(--text-primary)',
                fontSize: 15,
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                transition: 'border-color var(--transition-fast)',
              }}
            />
            <div style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}>
              {query.trim() ? `${filtered.length} found` : `${stats.total} species`}
            </div>
          </div>

          {/* Module links */}
          <div style={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
          }}>
            {[
              { href: '/evolution', label: 'Phylogenetic tree', icon: '⊕', color: '#D97706' },
              { href: '/migration', label: 'Route atlas',       icon: '⟶', color: '#6B8BA4' },
              { href: '/genetics',  label: 'Admixture graph',   icon: '⊗', color: '#7EA8A0' },
            ].map(m => (
              <Link key={m.href} href={m.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--text-muted)',
                transition: 'all var(--transition-fast)',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = m.color; e.currentTarget.style.background = m.color + '0d' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 9, opacity: 0.5 }}>{m.icon}</span>
                {m.label}
              </Link>
            ))}
          </div>

          {/* Stat line */}
          {!query.trim() && (
            <div style={{
              textAlign: 'center',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}>
              {stats.total} species catalogued spanning {formatShort(totalSpan)} years
            </div>
          )}

          {/* Results */}
          {query.trim() && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              marginTop: 4,
            }}>
              {filtered.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}>
                  No species match{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {query}
                  </span>
                </div>
              ) : (
              filtered.map(s => {
                const extant = s.era_end === null
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: extant ? 'var(--text-amber)' : 'var(--border-strong)',
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {s.name}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginLeft: 14,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {s.common_name && <span>{s.common_name}</span>}
                      {s.common_name && s.region && <span style={{ opacity: 0.3 }}>·</span>}
                      {s.region && <span>{s.region}</span>}
                      {(s.common_name || s.region) && <span style={{ opacity: 0.3 }}>·</span>}
                      <span style={{ color: extant ? 'var(--text-amber)' : undefined }}>
                        {formatShort(s.era_start)}–{formatShort(s.era_end)}
                      </span>
                      <div style={{ flex: 1 }} />
                      {MODULE_ACTIONS.map(m => (
                        <button
                          key={m.key}
                          onClick={() => handleOpenInModule(s.id, m.href)}
                          style={{
                            padding: '2px 7px',
                            fontSize: 9,
                            fontWeight: 500,
                            color: m.color,
                            border: '1px solid transparent',
                            borderRadius: 3,
                            background: 'transparent',
                            cursor: 'pointer',
                            opacity: 0.5,
                            transition: 'all var(--transition-fast)',
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.04em',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.opacity = '1'
                            e.currentTarget.style.background = m.color + '14'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.opacity = '0.5'
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
    <div style={{
      textAlign: 'center',
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-muted)',
      opacity: 0.3,
      padding: '16px 24px',
    }}>
      <a href="https://github.com/jpaic/human-atlas"
         target="_blank"
         rel="noopener noreferrer"
         style={{ color: 'inherit', textDecoration: 'none' }}>
        source
      </a>
    </div>
  </div>
  )
}

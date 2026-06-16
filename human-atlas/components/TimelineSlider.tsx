'use client'

import { useAtlasStore } from '@/store/useAtlasStore'
import { useCallback, useRef, useEffect, useState } from 'react'

const ERAS = [
  { era: -4_000_000, label: '4M',  name: 'Australopithecus' },
  { era: -2_500_000, label: '2.5M', name: 'Homo habilis' },
  { era: -1_900_000, label: '1.9M', name: 'H. erectus' },
  { era: -700_000,  label: '700K', name: 'H. heidelbergensis' },
  { era: -400_000,  label: '400K', name: 'Neanderthal' },
  { era: -300_000,  label: '300K', name: 'H. sapiens' },
  { era: -70_000,   label: '70K',  name: 'Out of Africa' },
  { era: -12_000,   label: '12K',  name: 'Agriculture' },
  { era: -5_000,    label: '5K',   name: 'Bronze Age' },
]

const MIN_ERA = -4_200_000
const MAX_ERA = 0

function eraToPercent(era: number) {
  return ((era - MIN_ERA) / (MAX_ERA - MIN_ERA)) * 100
}

function formatEraLabel(era: number) {
  const abs = Math.abs(era)
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M BP`
  if (abs >= 1_000)     return `${(abs / 1_000).toFixed(0)}K BP`
  return era === 0 ? 'Present' : `${abs.toLocaleString()} BP`
}

export function TimelineSlider() {
  const { activeEra, setEra } = useAtlasStore()
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [hoveredEra, setHoveredEra] = useState<typeof ERAS[0] | null>(null)

  const eraFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    const track = trackRef.current
    if (!track) return activeEra
    const rect = track.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const pct = x / rect.width
    return Math.round(MIN_ERA + pct * (MAX_ERA - MIN_ERA))
  }, [activeEra])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    setEra(eraFromEvent(e))
  }, [eraFromEvent, setEra])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => setEra(eraFromEvent(e))
    const onUp   = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, eraFromEvent, setEra])

  const thumbPct = eraToPercent(activeEra)

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--timeline-height)',
      background: 'var(--bg-panel)',
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 24px',
      zIndex: 50,
      userSelect: 'none',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>Timeline</span>
        <span style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-amber)',
          letterSpacing: '0.05em',
        }}>
          {formatEraLabel(activeEra)}
        </span>
      </div>

      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'relative',
          height: 32,
          cursor: 'ew-resize',
        }}
      >
        {/* Geologic strata bar */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 0,
          right: 0,
          height: 4,
          borderRadius: 2,
          background: 'var(--border-subtle)',
          overflow: 'visible',
        }}>
          {/* Filled portion */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${thumbPct}%`,
            height: '100%',
            background: `linear-gradient(90deg, rgba(217,119,6,0.3) 0%, var(--accent-amber) 100%)`,
            borderRadius: 2,
            transition: dragging ? 'none' : 'width var(--transition-fast)',
          }} />
        </div>

        {/* Era markers */}
        {ERAS.map((e) => {
          const pct = eraToPercent(e.era)
          const isActive = Math.abs(activeEra - e.era) < 50_000
          return (
            <div
              key={e.era}
              onMouseEnter={() => setHoveredEra(e)}
              onMouseLeave={() => setHoveredEra(null)}
              onClick={() => setEra(e.era)}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: 6,
                transform: 'translateX(-50%)',
                width: 16,
                height: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                zIndex: 2,
              }}
            >
              {/* Tick */}
              <div style={{
                width: 1,
                height: 6,
                background: isActive ? 'var(--accent-amber)' : 'var(--border-default)',
                marginBottom: 1,
                transition: 'background var(--transition-fast)',
              }} />
              {/* Dot */}
              <div style={{
                width: isActive ? 6 : 4,
                height: isActive ? 6 : 4,
                borderRadius: '50%',
                background: isActive ? 'var(--accent-amber)' : 'var(--border-strong)',
                transition: 'all var(--transition-fast)',
                boxShadow: isActive ? '0 0 0 3px rgba(217,119,6,0.2)' : 'none',
              }} />
            </div>
          )
        })}

        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: `${thumbPct}%`,
          top: 4,
          transform: 'translateX(-50%)',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'var(--accent-amber)',
          border: '2px solid var(--bg-base)',
          boxShadow: '0 0 0 3px rgba(217,119,6,0.25)',
          transition: dragging ? 'none' : 'left var(--transition-fast)',
          zIndex: 3,
          cursor: 'ew-resize',
        }} />

        {/* Hover tooltip */}
        {hoveredEra && (
          <div style={{
            position: 'absolute',
            left: `${eraToPercent(hoveredEra.era)}%`,
            bottom: 22,
            transform: 'translateX(-50%)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 4,
            padding: '3px 8px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-amber)', fontFamily: 'var(--font-mono)' }}>
              {hoveredEra.label} BP
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{hoveredEra.name}</div>
          </div>
        )}

        {/* Era labels — sparse, only show a few */}
        {ERAS.filter((_, i) => i % 3 === 0).map((e) => {
          const pct = eraToPercent(e.era)
          return (
            <div key={`label-${e.era}`} style={{
              position: 'absolute',
              left: `${pct}%`,
              bottom: 0,
              transform: 'translateX(-50%)',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              letterSpacing: '0.03em',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}>
              {e.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
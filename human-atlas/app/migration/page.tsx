'use client'

import dynamic from 'next/dynamic'
import { TimelineSlider } from '@/components/TimelineSlider'
import { MigrationLegend } from '@/components/MigrationLegend'

// SSR-safe map import
const MigrationMap = dynamic(
  () => import('@/components/MigrationMap').then(m => m.MigrationMap),
  { ssr: false, loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-muted)',
      fontSize: 13,
    }}>
      Initialising map…
    </div>
  )}
)

export default function MigrationPage() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Map header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        padding: '14px 20px 10px',
        background: 'linear-gradient(to bottom, rgba(28,25,23,0.85) 0%, transparent 100%)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>Migration routes</div>
        <div style={{
          height: 1,
          flex: 1,
          background: 'var(--border-subtle)',
        }} />
        <div style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          PostGIS · ST_X / ST_Y
        </div>
      </div>

      {/* Leaflet map fills the main area */}
      <div style={{
        position: 'absolute',
        inset: 0,
        bottom: 'var(--timeline-height)',
      }}>
        <MigrationMap />
      </div>

      {/* Legend overlay */}
      <MigrationLegend />

      {/* Timeline */}
      <TimelineSlider />
    </div>
  )
}
'use client'

import dynamic from 'next/dynamic'
import { TimelineSlider } from '@/components/TimelineSlider'

const GeneticsGraph = dynamic(
  () => import('@/components/GeneticsGraph').then(m => m.GeneticsGraph),
  { ssr: false, loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-muted)',
      gap: 10,
      fontSize: 13,
    }}>
      <span style={{
        width: 14,
        height: 14,
        border: '2px solid var(--accent-amber)',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
      }} />
      Loading admixture graph…
    </div>
  )}
)

export default function GeneticsPage() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Graph header */}
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
        }}>Admixture graph</div>
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
          D3 force · gene flow
        </div>
      </div>

      {/* Graph canvas */}
      <div style={{
        position: 'absolute',
        inset: 0,
        bottom: 'var(--timeline-height)',
      }}>
        <GeneticsGraph />
      </div>

      {/* Timeline */}
      <TimelineSlider />
    </div>
  )
}

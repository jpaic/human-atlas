'use client'

import { EvolutionTree } from '@/components/EvolutionTree'
import { SpeciesPanel } from '@/components/SpeciesPanel'
import { TimelineSlider } from '@/components/TimelineSlider'
import { EvolutionControls } from '@/components/EvolutionControls'
import { useAtlasStore } from '@/store/useAtlasStore'

export default function EvolutionPage() {
  const { selectedSpeciesId } = useAtlasStore()

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Main canvas */}
      <div style={{
        position: 'absolute',
        inset: 0,
        bottom: 'var(--timeline-height)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Canvas header */}
        <div style={{
          padding: '14px 20px 10px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>Phylogenetic tree</div>
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
            Hominidae · ltree path encoding
          </div>
        </div>

        {/* Tree canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', paddingRight: selectedSpeciesId ? 'calc(var(--panel-width) + 20px)' : undefined }}>
          <EvolutionTree />
        </div>
      </div>

      {/* Controls (top-left overlay) */}
      <EvolutionControls />

      {/* Right inspector */}
      <SpeciesPanel />

      {/* Timeline */}
      <TimelineSlider />
    </div>
  )
}
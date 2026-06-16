'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAtlasStore } from '@/store/useAtlasStore'
import * as d3 from 'd3'

interface Species {
  id: number
  name: string
  common_name: string | null
  path: string
  era_start: number
  era_end: number | null
  region: string | null
}

type TreeDatum = { name: string; id?: number; path?: string; era_start?: number; era_end?: number | null; isActive?: boolean; children?: TreeDatum[] }
type TreePointNode = d3.HierarchyPointNode<TreeDatum>
type TreePointLink = d3.HierarchyPointLink<TreeDatum>

const KNOWN_LINEAGE: Record<string, string> = {
  'Homo': 'Australopithecus',
  'Homo habilis': 'Homo',
  'Homo erectus': 'Homo habilis',
  'Homo heidelbergensis': 'Homo erectus',
  'Homo neanderthalensis': 'Homo heidelbergensis',
  'Homo sapiens': 'Homo heidelbergensis',
}

function labelFromPathSegment(segment: string) {
  return segment === 'Homo' ? 'Homo' : segment.replaceAll('_', ' ')
}

function buildTree(species: Species[], activeEra: number): TreeDatum {
  const root: TreeDatum = { name: 'Hominidae', children: [] }
  const byName = new Map<string, TreeDatum>([[root.name, root]])
  const branchByPath = new Map<string, TreeDatum>([['Hominidae', root]])
  const allNodes: TreeDatum[] = [root]
  const sorted = [...species].sort((a, b) => a.era_start - b.era_start)

  const attachChild = (parent: TreeDatum, child: TreeDatum) => {
    allNodes.forEach(n => { n.children = n.children?.filter(c => c !== child) })
    parent.children ??= []
    if (!parent.children.includes(child)) parent.children.push(child)
  }

  sorted.forEach(sp => {
    const parts = sp.path.split('.')
    const node: TreeDatum = { ...sp, children: [] }
    byName.set(sp.name, node)
    allNodes.push(node)
    for (let i = 1; i < parts.length - 1; i += 1) {
      const bp = parts.slice(0, i + 1).join('.')
      if (branchByPath.has(bp)) continue
      const pp = parts.slice(0, i).join('.') || 'Hominidae'
      const p = branchByPath.get(pp) ?? root
      const b: TreeDatum = { name: labelFromPathSegment(parts[i]), path: bp, children: [] }
      allNodes.push(b)
      attachChild(p, b)
      branchByPath.set(bp, b)
      byName.set(b.name, b)
    }
  })

  Object.entries(KNOWN_LINEAGE).forEach(([cn, pn]) => {
    const c = byName.get(cn); const p = byName.get(pn)
    if (c && p) attachChild(p, c)
  })

  sorted.forEach(sp => {
    const node = byName.get(sp.name)
    if (!node) return
    const known = KNOWN_LINEAGE[sp.name]
    const pathP = branchByPath.get(sp.path.split('.').slice(0, -1).join('.'))
    const parent = known ? (byName.get(known) ?? pathP ?? root) : (pathP ?? root)
    if (parent !== node) attachChild(parent, node)
  })

  // Mark active/inactive based on era (for dimming, NOT pruning)
  const markActive = (n: TreeDatum): void => {
    if (n.name === 'Hominidae') { n.isActive = true; n.children?.forEach(markActive); return }
    if (n.id !== undefined) {
      n.isActive = n.era_start! <= activeEra && (n.era_end === null || n.era_end! >= activeEra)
      n.children?.forEach(markActive)
      return
    }
    n.children?.forEach(markActive)
    n.isActive = n.children?.some(c => c.isActive) ?? false
  }
  markActive(root)

  return root
}

function formatEra(era: number) {
  const abs = Math.abs(era)
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${(abs / 1_000).toFixed(0)}K`
  return `${abs}`
}

export function EvolutionTree() {
  const svgRef = useRef<SVGSVGElement>(null)
  const contentGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity)
  const dataKeyRef = useRef('')
  const eraRef = useRef(0)

  const { activeEra, selectedSpeciesId, selectSpecies } = useAtlasStore()

  const { data: allSpecies, isLoading } = useQuery<Species[]>({
    queryKey: ['species'],
    queryFn: () => fetch('/api/species').then(r => r.json()),
    staleTime: 120_000,
  })

  const draw = useCallback(() => {
    if (!allSpecies || !svgRef.current) return
    const svgEl = svgRef.current
    const svg = d3.select(svgEl)

    const container = svgEl.parentElement!
    const W = container.clientWidth
    const H = container.clientHeight
    if (W <= 0 || H <= 0) return

    const treeData = buildTree(allSpecies, activeEra)
    const root = d3.hierarchy(treeData)
    const leftGutter = W >= 760 ? 260 : 32
    const contentWidth = Math.max(360, W - leftGutter - 44)
    const contentHeight = Math.max(400, H - 84)

    const treeLayout = d3.tree<TreeDatum>()
      .size([contentHeight, contentWidth])
      .separation((a, b) => a.parent === b.parent ? 1 : 1.15)

    const pointRoot = treeLayout(root)
    const nodesList = pointRoot.descendants()
    const minX = d3.min(nodesList, d => d.x) ?? 0
    const minY = d3.min(nodesList, d => d.y) ?? 0

    const treeW = (d3.max(nodesList, d => d.y) ?? 0) - minY
    const treeH = (d3.max(nodesList, d => d.x) ?? 0) - minX

    const padding = 22
    const visPad = 130

    const clampX0 = minY - padding
    const clampY0 = minX - padding
    const clampX1 = clampX0 + treeW + 2 * padding
    const clampY1 = clampY0 + treeH + 2 * padding

    const visX0 = minY - visPad
    const visY0 = minX - visPad
    const visX1 = visX0 + treeW + 2 * visPad
    const visY1 = visY0 + treeH + 2 * visPad

    const treeLink = d3.linkHorizontal<TreePointLink, TreePointNode>()
      .x(d => d.y)
      .y(d => d.x)

    svg.attr('width', W).attr('height', H)

    // Setup zoom behavior
    if (!zoomBehaviorRef.current) {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .on('zoom', (event) => {
          const t = event.transform
          currentTransformRef.current = t
          contentGroupRef.current?.attr('transform', t.toString())
        })
        .filter(event => {
          if (event.type === 'mousedown')
            return !(event.target as Element).closest('.node')
          return !event.button || event.button === 0
        })

      zoomBehaviorRef.current = zoom
      svg.call(zoom)
      svg.on('dblclick.zoom', null)
    }

    // Ensure content group exists
    let g = contentGroupRef.current
    if (!g) {
      g = svg.append('g').attr('class', 'content-group')
      contentGroupRef.current = g
    }

    // Detect data / era changes
    const dataKey = allSpecies.map(s => s.id).join(',')
    const dataChanged = dataKeyRef.current !== dataKey
    const eraChanged = eraRef.current !== activeEra
    if (dataChanged) dataKeyRef.current = dataKey
    if (eraChanged) eraRef.current = activeEra

    // Zoom range
    //   max-out: 65 % of the "fit padded tree to viewport" level
    //   initial:  3 D3 scroll notches up from max-out (each ~×1.149)
    //   max-in:   5 ×
    const maxOutZoom = Math.min(W / (visX1 - visX0), H / (visY1 - visY0)) * 0.65
    const initialK  = Math.min(0.9, maxOutZoom * Math.pow(2, 100 * 3 / 500))
    const minZoom   = maxOutZoom * 0.6
    const maxZoom   = 5

    // Pan slack: half a viewport beyond the clamp rect
    const marginX = Math.max(W * 0.5, treeW * 0.5)
    const marginY = Math.max(H * 0.5, treeH * 0.5)

    zoomBehaviorRef.current
      .scaleExtent([minZoom, maxZoom])
      .translateExtent([
        [clampX0 - marginX, clampY0 - marginY],
        [clampX1 + marginX, clampY1 + marginY],
      ])

    // Initial transform: place tree at left gutter with initial scale
    const initialTx = leftGutter + padding - minY * initialK
    const initialTy = Math.max(44, (H - treeH * initialK) / 2) - minX * initialK
    const initialTransform = d3.zoomIdentity.translate(initialTx, initialTy).scale(initialK)

    // Reset zoom when source data or active era changes
    if (dataChanged || eraChanged) {
      currentTransformRef.current = initialTransform
      if (svgRef.current) (svgRef.current as any).__zoom = initialTransform
    }

    g.attr('transform', currentTransformRef.current.toString())

    // Rebuild content
    g.selectAll('*').remove()

    // Background
    g.append('rect')
      .attr('x', visX0).attr('y', visY0)
      .attr('width', visX1 - visX0).attr('height', visY1 - visY0)
      .attr('rx', 8)
      .attr('fill', 'rgba(245,240,232,0.012)')
      .attr('stroke', 'rgba(245,240,232,0.035)')

    // Arrow marker
    const defs = g.append('defs')
    defs.append('marker')
      .attr('id', 'evolution-arrow')
      .attr('viewBox', '0 0 10 10').attr('refX', 8).attr('refY', 5)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path')
      .attr('d', 'M2 2L8 5L2 8')
      .attr('fill', 'none').attr('stroke', 'rgba(245,240,232,0.34)')
      .attr('stroke-width', 1.6).attr('stroke-linecap', 'round')

    // Links
    g.selectAll<SVGPathElement, TreePointLink>('.link')
      .data(pointRoot.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none').attr('stroke', 'rgba(245,240,232,0.2)')
      .attr('stroke-width', 1.4)
      .attr('marker-end', 'url(#evolution-arrow)')
      .attr('d', treeLink)

    // Amber accent links for selected path
    if (selectedSpeciesId) {
      const selected = pointRoot.descendants().find(n => n.data.id === selectedSpeciesId)
      if (selected) {
        const ancestors = selected.ancestors()
        const ancestorLinks = pointRoot.links().filter(l =>
          ancestors.includes(l.source) && ancestors.includes(l.target)
        )
        g.selectAll<SVGPathElement, TreePointLink>('.link-accent')
          .data(ancestorLinks)
          .join('path')
          .attr('class', 'link-accent')
          .attr('fill', 'none').attr('stroke', 'rgba(217,119,6,0.6)')
          .attr('stroke-width', 2)
          .attr('marker-end', 'url(#evolution-arrow)')
          .attr('d', treeLink)
      }
    }

    // Nodes
    const nodes = g.selectAll<SVGGElement, TreePointNode>('.node')
      .data(pointRoot.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .style('cursor', d => d.data.id ? 'pointer' : 'default')
      .on('click', (event, d) => { if (d.data.id) selectSpecies(d.data.id) })

    nodes.append('circle')
      .attr('r', d => d.data.id ? 6 : 4)
      .attr('fill', d => {
        if (!d.data.id) return 'rgba(245,240,232,0.15)'
        if (d.data.id === selectedSpeciesId) return '#D97706'
        return d.data.isActive ? 'rgba(245,240,232,0.4)' : 'rgba(245,240,232,0.12)'
      })
      .attr('stroke', d => d.data.id === selectedSpeciesId ? '#FCD34D' : 'transparent')
      .attr('stroke-width', 2)

    nodes.filter(d => Boolean(d.data.id))
      .append('circle')
      .attr('r', 12)
      .attr('fill', 'transparent')
      .attr('stroke', d => d.data.id === selectedSpeciesId ? 'rgba(252,211,77,0.28)' : 'rgba(245,240,232,0.06)')
      .attr('stroke-width', 1)

    // Era badge for leaf nodes
    nodes.filter(d => !d.children && d.data.era_start !== undefined)
      .append('text')
      .attr('x', 12).attr('y', -8)
      .attr('font-size', '9px').attr('font-family', 'monospace')
      .attr('fill', 'rgba(245,240,232,0.35)')
      .text(d => d.data.era_start === undefined ? '' : formatEra(d.data.era_start) + ' BP')

    nodes.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? -10 : 12)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .attr('font-size', d => d.data.id ? '12px' : '11px')
      .attr('font-weight', d => d.data.id === selectedSpeciesId ? '600' : '400')
      .attr('font-style', d => d.data.id ? 'italic' : 'normal')
      .attr('fill', d => {
        if (d.data.id === selectedSpeciesId) return '#FCD34D'
        if (!d.data.id) return 'rgba(245,240,232,0.4)'
        return d.data.isActive ? 'rgba(245,240,232,0.85)' : 'rgba(245,240,232,0.3)'
      })
      .text(d => d.data.name)

    // Hover
    nodes.on('mouseenter', function (this: SVGGElement, _, d) {
      if (!d.data.id) return
      d3.select(this).select('circle').attr('r', 7).attr('fill', '#F59E0B')
    })
    .on('mouseleave', function (this: SVGGElement, _, d) {
      if (!d.data.id) return
      d3.select(this).select('circle')
        .attr('r', 6)
        .attr('fill', d.data.id === selectedSpeciesId ? '#D97706' : 'rgba(245,240,232,0.4)')
    })
  }, [allSpecies, activeEra, selectedSpeciesId, selectSpecies])

  useEffect(() => {
    draw()
    const ro = new ResizeObserver(draw)
    const container = svgRef.current?.parentElement
    if (container) ro.observe(container)
    return () => ro.disconnect()
  }, [draw])

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--text-muted)', gap: 10, fontSize: 13,
      }}>
        <span style={{
          width: 14, height: 14,
          border: '2px solid var(--accent-amber)', borderTopColor: 'transparent',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
          display: 'inline-block',
        }} />
        Loading phylogenetic data&hellip;
      </div>
    )
  }

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
    />
  )
}

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'

interface PopNode {
  id: number
  name: string
  region: string
  species_name: string
}

interface GeneEdge {
  source_id: number
  target_id: number
  percentage: string
  era: number | null
  notes: string | null
}

interface AdmixtureData {
  nodes: PopNode[]
  edges: GeneEdge[]
}

interface SimNode extends PopNode, d3.SimulationNodeDatum {}

interface SimLink extends GeneEdge, d3.SimulationLinkDatum<SimNode> {
  source: SimNode
  target: SimNode
  pct: number
}

const REGION_COLORS: Record<string, string> = {
  'East Africa':    '#D97706',
  'Africa':         '#C2643A',
  'Africa, Asia':   '#7C9E6B',
  'Europe, Africa': '#6B8BA4',
  'Europe, W. Asia':'#9B7B9E',
  'Global':         '#7EA8A0',
}

function regionColor(region: string) {
  return REGION_COLORS[region] ?? '#6B6560'
}

export function GeneticsGraph() {
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null)

  const { data, isLoading } = useQuery<AdmixtureData>({
    queryKey: ['admixture'],
    queryFn: () => fetch('/api/admixture').then(r => r.json()),
    staleTime: 60_000 * 5,
  })

  const draw = useCallback(() => {
    if (!data || !svgRef.current) return
    const { nodes, edges } = data

    const el = svgRef.current
    const W = el.parentElement!.clientWidth
    const H = el.parentElement!.clientHeight

    // Clear previous
    d3.select(el).selectAll('*').remove()
    simRef.current?.stop()

    // Compute min/max percentage for edge width scaling
    const pcts = edges.map(e => parseFloat(e.percentage))
    const maxPct = Math.max(...pcts, 1)

    // Build id-indexed nodes for simulation
    const nodeMap: Record<number, SimNode> = {}
    const simNodes = nodes.map(n => {
      const node: SimNode = { ...n, x: W / 2 + (Math.random() - 0.5) * 200, y: H / 2 + (Math.random() - 0.5) * 200 }
      nodeMap[n.id] = node
      return node
    })

    const simLinks: SimLink[] = edges
      .filter(e => nodeMap[e.source_id] && nodeMap[e.target_id])
      .map(e => ({
        ...e,
        source: nodeMap[e.source_id],
        target: nodeMap[e.target_id],
        pct: parseFloat(e.percentage),
      }))

    const svg = d3.select(el)
      .attr('width', W)
      .attr('height', H)

    // Defs: arrow markers per percentage level
    const defs = svg.append('defs')
    ;['low', 'mid', 'high'].forEach(level => {
      const color = level === 'high' ? '#D97706' : level === 'mid' ? '#9CA3AF' : '#4B4844'
      defs.append('marker')
        .attr('id', `arrow-${level}`)
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 18)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M2 2L8 5L2 8')
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('stroke-linecap', 'round')
    })

    // Links group
    const linkG = svg.append('g').attr('class', 'links')
    const link = linkG.selectAll<SVGLineElement, SimLink>('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', d => {
        const r = d.pct / maxPct
        if (r > 0.6) return 'rgba(217,119,6,0.7)'
        if (r > 0.3) return 'rgba(156,163,175,0.5)'
        return 'rgba(75,72,68,0.5)'
      })
      .attr('stroke-width', d => Math.max(0.5, (d.pct / maxPct) * 3))
      .attr('marker-end', d => {
        const r = d.pct / maxPct
        if (r > 0.6) return 'url(#arrow-high)'
        if (r > 0.3) return 'url(#arrow-mid)'
        return 'url(#arrow-low)'
      })

    // Nodes group
    const nodeG = svg.append('g').attr('class', 'nodes')
    const node = nodeG.selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'grab')
      .call(
        d3.drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )

    // Node circle
    node.append('circle')
      .attr('r', 8)
      .attr('fill', d => regionColor(d.region))
      .attr('fill-opacity', 0.85)
      .attr('stroke', d => {
        const c = regionColor(d.region)
        return c
      })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.4)

    // Node label
    node.append('text')
      .attr('dy', '-12px')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('fill', 'rgba(245,240,232,0.75)')
      .attr('pointer-events', 'none')
      .text(d => d.name.length > 16 ? d.name.slice(0, 14) + '…' : d.name)

    // Species tag
    node.append('text')
      .attr('dy', '22px')
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('fill', 'rgba(245,240,232,0.35)')
      .attr('pointer-events', 'none')
      .text(d => d.species_name.split(' ').pop() ?? '')

    // Hover tooltip
    node
      .on('mouseenter', function(this: SVGGElement) {
        d3.select(this).select('circle')
          .attr('r', 11)
          .attr('stroke-opacity', 0.8)
      })
      .on('mouseleave', function(this: SVGGElement) {
        d3.select(this).select('circle')
          .attr('r', 8)
          .attr('stroke-opacity', 0.4)
      })

    // Edge labels (percentage)
    const edgeLabels = svg.append('g').attr('class', 'edge-labels')
    const edgeLabel = edgeLabels.selectAll<SVGTextElement, SimLink>('text')
      .data(simLinks.filter(d => d.pct > maxPct * 0.3))
      .join('text')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', 'rgba(245,240,232,0.4)')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text(d => `${d.pct.toFixed(0)}%`)

    // Force simulation
    const sim = d3.forceSimulation<SimNode>(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).strength(d => d.pct / maxPct * 0.4).distance(140))
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(24))

    simRef.current = sim

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x ?? 0)
        .attr('y1', d => d.source.y ?? 0)
        .attr('x2', d => d.target.x ?? 0)
        .attr('y2', d => d.target.y ?? 0)

      node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)

      edgeLabel
        .attr('x', d => ((d.source.x ?? 0) + (d.target.x ?? 0)) / 2)
        .attr('y', d => ((d.source.y ?? 0) + (d.target.y ?? 0)) / 2)
    })
  }, [data])

  useEffect(() => {
    draw()
    const ro = new ResizeObserver(draw)
    const container = svgRef.current?.parentElement
    if (container) ro.observe(container)
    return () => {
      ro.disconnect()
      simRef.current?.stop()
    }
  }, [draw])

  if (isLoading) {
    return (
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
        Loading gene flow data…
      </div>
    )
  }

  if (!data?.nodes?.length) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-muted)',
        fontSize: 13,
        flexDirection: 'column',
        gap: 8,
      }}>
        <span style={{ fontSize: 24, opacity: 0.3 }}>⊗</span>
        <span>No admixture data seeded yet</span>
      </div>
    )
  }

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}

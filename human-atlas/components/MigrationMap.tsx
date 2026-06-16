'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAtlasStore } from '@/store/useAtlasStore'
import type * as Leaflet from 'leaflet'

interface Waypoint {
  seq: number
  lng: number
  lat: number
  label: string
  era: number | null
}

interface Route {
  id: number
  name: string
  era_start: number
  era_end: number | null
  waypoints: Waypoint[]
}

// Colors for different routes
const ROUTE_COLORS = [
  '#D97706', // amber
  '#C2643A', // coral
  '#7C9E6B', // olive green
  '#6B8BA4', // slate blue
  '#9B7B9E', // muted purple
  '#7EA8A0', // teal
]

function formatEra(era: number) {
  const abs = Math.abs(era)
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M BP`
  if (abs >= 1_000)     return `${(abs / 1_000).toFixed(0)}K BP`
  return `${abs.toLocaleString()} BP`
}

// We need to dynamically import Leaflet to avoid SSR issues
function MigrationMapInner({ routes }: { routes: Route[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Leaflet.Map | null>(null)
  const layersRef = useRef<Leaflet.Layer[]>([])
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    let cancelled = false

    // Dynamic import of leaflet
    import('leaflet').then(L => {
      if (cancelled || !mapRef.current) return

      // Fix marker icon issue with Next.js
      delete (L.Icon.Default.prototype as Leaflet.Icon.Default & { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        center: [10, 20],
        zoom: 2,
        minZoom: 2,
        maxZoom: 8,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
        maxBounds: [[-85, -Infinity] as [number, number], [85, Infinity] as [number, number]],
        maxBoundsViscosity: 1,
      })

      // Dark map tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 19 }
      ).addTo(map)

      // Custom attribution
      L.control.attribution({ position: 'bottomright', prefix: '' })
        .addAttribution('© <a href="https://carto.com/">CARTO</a>')
        .addTo(map)

      // Zoom control top-right
      L.control.zoom({ position: 'topright' }).addTo(map)

      mapInstanceRef.current = map
      setMapReady(true)
    })

    return () => {
      cancelled = true
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      setMapReady(false)
    }
  }, [])

  // Draw routes when data arrives
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!mapReady || !map) return

    import('leaflet').then(L => {
      // Clear old layers
      layersRef.current.forEach(l => l.remove())
      layersRef.current = []

      routes.forEach((route, i) => {
        const color = ROUTE_COLORS[i % ROUTE_COLORS.length]
        const sortedWaypoints = [...route.waypoints].sort((a, b) => a.seq - b.seq)
        const coords = sortedWaypoints
          .map(w => [w.lat, w.lng] as [number, number])

        if (coords.length < 2) return

        // Animated dashed line
        const line = L.polyline(coords, {
          color,
          weight: 2,
          opacity: 0.7,
          dashArray: '6 4',
        }).addTo(map)

        line.bindTooltip(`
          <div style="font-family:system-ui;font-size:12px;line-height:1.5;">
            <strong style="color:${color}">${route.name}</strong><br/>
            <span style="opacity:0.7">${formatEra(route.era_start)}</span>
          </div>
        `, { sticky: true, opacity: 0.95 })

        layersRef.current.push(line)

        // Waypoint markers (small circles)
        sortedWaypoints.forEach((wp, wi) => {
          const isFirst = wi === 0
          const isLast = wi === sortedWaypoints.length - 1

          const marker = L.circleMarker([wp.lat, wp.lng], {
            radius: isFirst || isLast ? 5 : 3,
            color,
            weight: isFirst || isLast ? 2 : 1,
            fillColor: isFirst ? '#28251F' : color,
            fillOpacity: isFirst || isLast ? 1 : 0.5,
            opacity: 0.9,
          }).addTo(map)

          if (wp.label) {
            marker.bindTooltip(
              `<div style="font-size:11px;font-family:system-ui">${wp.label}</div>`,
              { sticky: true, opacity: 0.9 }
            )
          }

          layersRef.current.push(marker)
        })

        // Arrow in the middle of route
        if (coords.length >= 2) {
          const mid = Math.floor(coords.length / 2)
          const arrowIcon = L.divIcon({
            html: `<span style="color:${color};font-size:14px;opacity:0.8">→</span>`,
            className: '',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })
          const arrowMarker = L.marker(coords[mid], { icon: arrowIcon }).addTo(map)
          layersRef.current.push(arrowMarker)
        }
      })

      if (layersRef.current.length > 0) {
        const group = L.featureGroup(layersRef.current)
        map.fitBounds(group.getBounds().pad(0.2), { animate: false, maxZoom: 4 })
      }
    })
  }, [mapReady, routes])

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#0F0D0A',
      }}
    />
  )
}

export function MigrationMap() {
  const { activeEra } = useAtlasStore()

  const { data: routes = [], isLoading } = useQuery<Route[]>({
    queryKey: ['routes'],
    queryFn: () => fetch('/api/routes').then(r => r.json()),
    staleTime: 60_000 * 5,
  })

  // Filter routes visible at this era
  const visibleRoutes = routes.filter(r => r.era_start <= activeEra)

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
        Loading migration routes…
      </div>
    )
  }

  return <MigrationMapInner routes={visibleRoutes} />
}

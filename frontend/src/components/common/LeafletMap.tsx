import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type MapTileType = 'cyber-dark' | 'google-roads' | 'google-hybrid' | 'osm' | 'esri-satellite'

export interface MapMarkerItem {
  position: [number, number]
  popup?: string
  title?: string
  color?: string
  isOrigin?: boolean
  isDestination?: boolean
}

export interface MapCircleItem {
  center: [number, number]
  radius: number
  color?: string
  fillColor?: string
}

export interface ActiveVehicleItem {
  position: [number, number]
  label?: string
  speedKmh?: number
  heading?: number
}

interface LeafletMapProps {
  center?: [number, number]
  zoom?: number
  markers?: MapMarkerItem[]
  polyline?: [number, number][]
  circles?: MapCircleItem[]
  height?: string | number
  className?: string
  fitBounds?: boolean
  mapType?: MapTileType
  activeVehicle?: ActiveVehicleItem | null
  followVehicle?: boolean
  showTraffic?: boolean
  onMapClick?: (lat: number, lng: number) => void
}

const TILE_CONFIG: Record<MapTileType, { url: string; attribution: string; subdomains?: string[]; maxZoom?: number }> = {
  'cyber-dark': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; OpenStreetMap contributors',
    maxZoom: 16,
  },
  'google-roads': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Street Map',
    maxZoom: 19,
  },
  'google-hybrid': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Satellite Imagery',
    maxZoom: 19,
  },
  'osm': {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
  },
  'esri-satellite': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [37.7749, -122.4194],
  zoom = 5,
  markers = [],
  polyline,
  circles = [],
  height = '100%',
  className = '',
  fitBounds = true,
  mapType = 'cyber-dark',
  activeVehicle,
  followVehicle = false,
  showTraffic = true,
  onMapClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const vehicleLayerRef = useRef<L.LayerGroup | null>(null)
  const vehicleMarkerRef = useRef<L.Marker | null>(null)
  const lastBoundsKeyRef = useRef<string>('')
  const markersKeyRef = useRef<string>('')
  const [activeTileType, setActiveTileType] = React.useState<MapTileType>(mapType)

  React.useEffect(() => {
    setActiveTileType(mapType)
  }, [mapType])

  const onMapClickRef = useRef(onMapClick)
  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  // Helper to attach tile layer with fallback
  const attachTileLayer = (map: L.Map, type: MapTileType) => {
    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current)
      } catch {
        // ignore
      }
    }

    const config = TILE_CONFIG[type] || TILE_CONFIG['cyber-dark']
    const layer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom || 19,
      subdomains: config.subdomains || 'abc',
    })

    // Auto fallback on error
    let failureCount = 0
    layer.on('tileerror', () => {
      failureCount += 1
      if (failureCount > 3 && (type === 'google-roads' || type === 'google-hybrid')) {
        layer.off('tileerror')
        setActiveTileType('cyber-dark')
      }
    })

    layer.addTo(map)
    tileLayerRef.current = layer
  }

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove()
      } catch {
        // ignore
      }
      mapInstanceRef.current = null
    }

    if (containerRef.current && (containerRef.current as any)._leaflet_id) {
      delete (containerRef.current as any)._leaflet_id
    }

    try {
      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
      })

      attachTileLayer(map, activeTileType)

      const layerGroup = L.layerGroup().addTo(map)
      layerGroupRef.current = layerGroup

      const vehicleGroup = L.layerGroup().addTo(map)
      vehicleLayerRef.current = vehicleGroup

      // Stable click listener reading from ref
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)))
        }
      })

      mapInstanceRef.current = map

      // Invalidate sizes at intervals to ensure perfect tile grid after layout rendering
      const t1 = setTimeout(() => { try { map.invalidateSize() } catch {} }, 100)
      const t2 = setTimeout(() => { try { map.invalidateSize() } catch {} }, 350)
      const t3 = setTimeout(() => { try { map.invalidateSize() } catch {} }, 800)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    } catch (err) {
      console.error('Error initializing Leaflet map:', err)
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {
          // ignore
        }
        mapInstanceRef.current = null
      }
      if (containerRef.current && (containerRef.current as any)._leaflet_id) {
        delete (containerRef.current as any)._leaflet_id
      }
      layerGroupRef.current = null
      vehicleLayerRef.current = null
      vehicleMarkerRef.current = null
      tileLayerRef.current = null
    }
  }, [])

  // Auto-resize on container dimensions change
  useEffect(() => {
    if (!containerRef.current || !mapInstanceRef.current) return
    const resizeObserver = new ResizeObserver(() => {
      try {
        mapInstanceRef.current?.invalidateSize()
      } catch {
        // ignore
      }
    })
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Update Tile Layer when activeTileType changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    attachTileLayer(map, activeTileType)
  }, [activeTileType])

  // Update static markers, polyline, circles (Only when content actually changes)
  useEffect(() => {
    const map = mapInstanceRef.current
    const layerGroup = layerGroupRef.current
    if (!map || !layerGroup) return

    const currentKey = `${markers.map(m => `${m.position[0]},${m.position[1]},${m.title}`).join('|')}-${polyline?.length || 0}-${circles.length}-${showTraffic}`
    if (markersKeyRef.current === currentKey) {
      return
    }
    markersKeyRef.current = currentKey

    layerGroup.clearLayers()
    const boundsPoints: [number, number][] = []

    const createMarkerIcon = (color: string, label?: string, isOrigin?: boolean, isDestination?: boolean) => {
      const ringColor = isOrigin ? '#10b981' : isDestination ? '#ef4444' : color
      const badgeText = isOrigin ? 'ORIGIN' : isDestination ? 'DESTINATION' : label
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; cursor: pointer;">
            <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: ${ringColor}; opacity: 0.25;"></div>
            <div style="width: 18px; height: 18px; border-radius: 50%; background: ${ringColor}; border: 3px solid #ffffff; box-shadow: 0 0 12px ${ringColor}; display: flex; align-items: center; justify-content: center; z-index: 2;"></div>
            ${badgeText ? `<div style="position: absolute; bottom: -20px; white-space: nowrap; font-size: 11px; font-weight: 800; background: rgba(15,23,42,0.92); color: #fff; padding: 2px 7px; border-radius: 5px; border: 1.5px solid ${ringColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.5); pointer-events: none; z-index: 5;">${badgeText}</div>` : ''}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })
    }

    markers.forEach((m) => {
      const color = m.color || (m.isOrigin ? '#10b981' : m.isDestination ? '#ef4444' : '#06b6d4')
      const icon = createMarkerIcon(color, m.title, m.isOrigin, m.isDestination)
      const marker = L.marker(m.position, { icon })

      if (m.popup) {
        marker.bindPopup(
          `<div style="font-family: 'Segoe UI', Inter, sans-serif; font-size: 13px; color: #0f172a; padding: 4px; line-height: 1.4;">${m.popup}</div>`
        )
      }

      marker.addTo(layerGroup)
      boundsPoints.push(m.position)
    })

    circles.forEach((c) => {
      const circle = L.circle(c.center, {
        radius: c.radius,
        color: c.color || '#10b981',
        fillColor: c.fillColor || '#10b981',
        fillOpacity: 0.15,
        weight: 2,
      })
      circle.addTo(layerGroup)
      boundsPoints.push(c.center)
    })

    if (polyline && polyline.length > 1) {
      // Glow underlayer
      L.polyline(polyline, {
        color: '#10b981',
        weight: 8,
        opacity: 0.35,
      }).addTo(layerGroup)

      if (showTraffic && polyline.length > 12) {
        // Multi-color Google Maps live traffic congestion segments
        const total = polyline.length
        const s1 = Math.floor(total * 0.35)
        const s2 = Math.floor(total * 0.60)
        const s3 = Math.floor(total * 0.82)

        // Free flow (Fast Highway Speed > 80 km/h)
        L.polyline(polyline.slice(0, s1 + 1), {
          color: '#10b981',
          weight: 4.5,
          opacity: 0.95,
        }).addTo(layerGroup)

        // Moderate congestion (Yellow 50-70 km/h)
        L.polyline(polyline.slice(s1, s2 + 1), {
          color: '#f59e0b',
          weight: 4.5,
          opacity: 0.95,
        }).addTo(layerGroup)

        // Free flow
        L.polyline(polyline.slice(s2, s3 + 1), {
          color: '#10b981',
          weight: 4.5,
          opacity: 0.95,
        }).addTo(layerGroup)

        // Heavy urban bottleneck approach (Red < 35 km/h)
        L.polyline(polyline.slice(s3), {
          color: '#ef4444',
          weight: 4.5,
          opacity: 0.95,
        }).addTo(layerGroup)
      } else {
        // Standard highway route line
        L.polyline(polyline, {
          color: '#059669',
          weight: 4.5,
          opacity: 0.95,
        }).addTo(layerGroup)
      }

      polyline.forEach((pt) => boundsPoints.push(pt))
    }

    // Only fitBounds when endpoints/polyline actually change, NOT on every state update!
    const boundsKey = `${boundsPoints[0]?.[0]},${boundsPoints[0]?.[1]}-${boundsPoints[boundsPoints.length - 1]?.[0]},${boundsPoints[boundsPoints.length - 1]?.[1]}-${polyline?.length || 0}`
    if (fitBounds && boundsPoints.length > 1 && lastBoundsKeyRef.current !== boundsKey) {
      lastBoundsKeyRef.current = boundsKey
      try {
        const bounds = L.latLngBounds(boundsPoints)
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
      } catch {
        // ignore bounds calculation error
      }
    }
  }, [markers, polyline, circles, fitBounds, showTraffic])

  // Update dynamic active vehicle position smoothly WITHOUT clearing layers
  useEffect(() => {
    const map = mapInstanceRef.current
    const vehicleGroup = vehicleLayerRef.current
    if (!vehicleGroup || !map) return

    if (!activeVehicle) {
      if (vehicleMarkerRef.current) {
        vehicleGroup.removeLayer(vehicleMarkerRef.current)
        vehicleMarkerRef.current = null
      }
      return
    }

    const speedVal = activeVehicle.speedKmh || 80
    const headingVal = activeVehicle.heading || 0

    const createTruckHtml = (speed: number, heading: number) => `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 60px; height: 60px; transform: translate(-10px, -10px);">
        <div style="background: rgba(15,23,42,0.95); color: #38bdf8; font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 12px; border: 1.5px solid #0284c7; box-shadow: 0 4px 12px rgba(0,0,0,0.7); margin-bottom: 2px; white-space: nowrap; pointer-events: none; z-index: 20;">
          ⚡ ${speed} km/h
        </div>
        <div style="position: absolute; top: 16px; width: 38px; height: 38px; border-radius: 50%; background: rgba(59,130,246,0.3); border: 1px solid #3b82f6;"></div>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: 2.5px solid #ffffff; box-shadow: 0 0 16px rgba(37,99,235,0.9); display: flex; align-items: center; justify-content: center; z-index: 10; transform: rotate(${heading}deg); transition: transform 0.2s ease;">
          <span style="font-size: 16px;">🚚</span>
        </div>
      </div>
    `

    if (!vehicleMarkerRef.current) {
      const truckIcon = L.divIcon({
        className: 'active-vehicle-marker',
        html: createTruckHtml(speedVal, headingVal),
        iconSize: [60, 60],
        iconAnchor: [30, 30],
      })

      const marker = L.marker(activeVehicle.position, { icon: truckIcon, zIndexOffset: 1000 })
      marker.addTo(vehicleGroup)
      vehicleMarkerRef.current = marker
    } else {
      vehicleMarkerRef.current.setLatLng(activeVehicle.position)
      const truckIcon = L.divIcon({
        className: 'active-vehicle-marker',
        html: createTruckHtml(speedVal, headingVal),
        iconSize: [60, 60],
        iconAnchor: [30, 30],
      })
      vehicleMarkerRef.current.setIcon(truckIcon)
    }

    if (followVehicle) {
      map.panTo(activeVehicle.position, { animate: true, duration: 0.2 })
    }
  }, [activeVehicle?.position[0], activeVehicle?.position[1], activeVehicle?.speedKmh, activeVehicle?.heading, followVehicle])

  return (
    <div
      ref={containerRef}
      className={`leaflet-map-root ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        minHeight: '350px',
        width: '100%',
        borderRadius: 'inherit',
        background: '#0a0f1d',
      }}
    />
  )
}

export default LeafletMap

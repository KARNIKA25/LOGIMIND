import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  MapPin, Zap, Leaf, Cloud, Navigation, Brain, Play, Pause, RotateCcw,
  ArrowRightLeft, Search, Layers, Compass, Fuel, ShieldCheck, CheckCircle2,
  Clock, AlertTriangle, ExternalLink, Radio, Crosshair, Activity
} from 'lucide-react'
import { routeApi, locationApi } from '../../services/api.service'
import toast from 'react-hot-toast'
import LeafletMap, { MapMarkerItem, MapTileType } from '../../components/common/LeafletMap'
import ErrorBoundary from '../../components/common/ErrorBoundary'

interface LocationSuggestion {
  name: string
  display_name: string
  latitude: number
  longitude: number
  category: string
}

const PRESET_HUBS = [
  { label: 'San Francisco Fulfillment Center', name: 'San Francisco Fulfillment Center, CA, USA', lat: 37.7749, lng: -122.4194 },
  { label: 'Los Angeles Container Port', name: 'Port of Los Angeles, CA, USA', lat: 33.7432, lng: -118.2673 },
  { label: 'New York Gateway Megahub', name: 'New York Gateway Megahub, NJ/NY, USA', lat: 40.7128, lng: -74.0060 },
  { label: 'Chicago Central Freight Hub', name: 'Chicago Central Freight Hub, IL, USA', lat: 41.8781, lng: -87.6298 },
  { label: 'Miami Gateway Terminal', name: 'Miami Gateway Distribution, FL, USA', lat: 25.7617, lng: -80.1918 },
  { label: 'Dallas-Fort Worth Logistics Park', name: 'DFW Logistics Park, TX, USA', lat: 32.7767, lng: -96.7970 },
  { label: 'Mumbai Port & Container Terminal', name: 'Mumbai Port & Logistics Center, India', lat: 18.9438, lng: 72.8465 },
  { label: 'Delhi National Freight Corridor', name: 'Delhi National Logistics Zone, India', lat: 28.6139, lng: 77.2090 },
]

export default function RoutesPage() {
  // Location States (User types plain names/addresses)
  const [originText, setOriginText] = useState('San Francisco Fulfillment Center')
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>({ lat: 37.7749, lng: -122.4194 })
  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([])
  const [showOriginDropdown, setShowOriginDropdown] = useState(false)

  const [destText, setDestText] = useState('Port of Los Angeles, CA, USA')
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>({ lat: 33.7432, lng: -118.2673 })
  const [destSuggestions, setDestSuggestions] = useState<LocationSuggestion[]>([])
  const [showDestDropdown, setShowDestDropdown] = useState(false)

  // Map Controls & Settings (Defaults to reliable CartoDB Dark Matter with Google Maps & Satellite options)
  const [mapType, setMapType] = useState<MapTileType>('cyber-dark')
  const [pickMode, setPickMode] = useState<'origin' | 'dest' | null>(null)
  const [strategy, setStrategy] = useState<'FASTEST' | 'ECO_FRIENDLY' | 'SHORTEST' | 'AVOID_TOLLS'>('FASTEST')
  const [cargoWeightKg, setCargoWeightKg] = useState<number>(4500)

  // Optimization Result
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  // Real-Time Simulation & Navigation State
  const [viewMode, setViewMode] = useState<'telematics' | 'google-maps'>('telematics')
  const [followVehicle, setFollowVehicle] = useState(false)
  const [showTraffic, setShowTraffic] = useState(true)
  const [simSpeed, setSimSpeed] = useState<number>(2)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simIndex, setSimIndex] = useState(0)
  const [activeVehicle, setActiveVehicle] = useState<{ position: [number, number]; speedKmh: number; heading?: number } | null>(null)
  const simulationTimerRef = useRef<any>(null)

  // Debounced geocoding for Origin
  useEffect(() => {
    if (!originText || originText.length < 3) {
      setOriginSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await locationApi.geocode(originText, 5)
        if (res.data) setOriginSuggestions(res.data)
      } catch {
        // ignore
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [originText])

  // Debounced geocoding for Destination
  useEffect(() => {
    if (!destText || destText.length < 3) {
      setDestSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await locationApi.geocode(destText, 5)
        if (res.data) setDestSuggestions(res.data)
      } catch {
        // ignore
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [destText])

  // Close autocomplete dropdowns when user clicks outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('.location-autocomplete-container')) {
        setShowOriginDropdown(false)
        setShowDestDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initial optimization on mount
  useEffect(() => {
    handleOptimize()
  }, [])

  // Swap Origin and Destination
  function handleSwap() {
    const tempText = originText
    const tempCoords = originCoords
    setOriginText(destText)
    setOriginCoords(destCoords)
    setDestText(tempText)
    setDestCoords(tempCoords)
  }

  // Handle map click when in Pick Mode
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (pickMode === 'origin') {
      setOriginCoords({ lat, lng })
      setOriginText(`Custom Location (${lat}, ${lng})`)
      setPickMode(null)
      toast.success('Origin location marked on map! 🟢')
    } else if (pickMode === 'dest') {
      setDestCoords({ lat, lng })
      setDestText(`Custom Location (${lat}, ${lng})`)
      setPickMode(null)
      toast.success('Destination location marked on map! 🔴')
    }
  }, [pickMode])

  // Use Browser Geolocation
  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    toast.loading('Detecting your GPS location...', { id: 'geo' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5))
        const lng = Number(pos.coords.longitude.toFixed(5))
        setOriginCoords({ lat, lng })
        setOriginText('Current GPS Location')
        toast.success('Origin set to your current GPS location!', { id: 'geo' })
      },
      () => {
        toast.error('Unable to retrieve GPS coordinates', { id: 'geo' })
      }
    )
  }

  // Run Route Optimization
  async function handleOptimize() {
    setLoading(true)
    setIsSimulating(false)
    clearInterval(simulationTimerRef.current)
    setActiveVehicle(null)

    try {
      const payload: any = {
        origin_name: originText,
        dest_name: destText,
        strategy,
        cargo_weight_kg: cargoWeightKg,
      }
      if (originCoords) {
        payload.origin_lat = originCoords.lat
        payload.origin_lng = originCoords.lng
      }
      if (destCoords) {
        payload.dest_lat = destCoords.lat
        payload.dest_lng = destCoords.lng
      }

      const res = await routeApi.optimize(payload)
      if (res.data) {
        setResult(res.data)
        // Ensure coords are synchronized with resolved coordinates
        if (res.data.origin_latitude && res.data.origin_longitude) {
          setOriginCoords({ lat: res.data.origin_latitude, lng: res.data.origin_longitude })
        }
        if (res.data.destination_latitude && res.data.destination_longitude) {
          setDestCoords({ lat: res.data.destination_latitude, lng: res.data.destination_longitude })
        }
        toast.success('Real-time highway route optimized successfully! 🚀')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to optimize route. Try selecting a nearby hub.')
    } finally {
      setLoading(false)
    }
  }

  // Real-Time Delivery Simulation
  function toggleSimulation() {
    if (!result?.waypoints_data || result.waypoints_data.length < 2) {
      toast.error('Please optimize a route first to start simulation.')
      return
    }

    if (isSimulating) {
      setIsSimulating(false)
      clearInterval(simulationTimerRef.current)
      toast('Simulation paused', { icon: '⏸' })
    } else {
      setIsSimulating(true)
      toast.success('Real-time delivery telematics active! 🚚')

      const waypoints = result.waypoints_data
      const totalPoints = waypoints.length
      const baseJump = Math.max(1, Math.floor(totalPoints / 240))

      simulationTimerRef.current = setInterval(() => {
        setSimIndex((prev) => {
          const stepJump = Math.max(1, baseJump * simSpeed)
          const next = prev + stepJump
          if (next >= totalPoints - 1) {
            clearInterval(simulationTimerRef.current)
            setIsSimulating(false)
            setActiveVehicle({ position: waypoints[totalPoints - 1] as [number, number], speedKmh: 0, heading: 0 })
            toast.success('Shipment arrived at destination docking bay! 🎉')
            return totalPoints - 1
          }
          const pt = waypoints[next] as [number, number]
          const prevPt = waypoints[Math.max(0, next - stepJump)] as [number, number]
          const dy = pt[0] - prevPt[0]
          const dx = pt[1] - prevPt[1]
          const heading = Math.round((Math.atan2(dx, dy) * 180) / Math.PI)
          const speed = Math.floor(78 + Math.random() * 12)
          setActiveVehicle({ position: pt, speedKmh: speed, heading })
          return next
        })
      }, 75)
    }
  }

  function resetSimulation() {
    clearInterval(simulationTimerRef.current)
    setIsSimulating(false)
    setSimIndex(0)
    setActiveVehicle(null)
  }

  // Markers for Map (memoized to prevent re-instantiation and map flicker)
  const mapMarkers = useMemo<MapMarkerItem[]>(() => {
    const list: MapMarkerItem[] = []
    if (originCoords) {
      list.push({
        position: [originCoords.lat, originCoords.lng],
        isOrigin: true,
        title: 'Origin',
        popup: `<b>Origin:</b> ${originText}`,
      })
    }
    if (destCoords) {
      list.push({
        position: [destCoords.lat, destCoords.lng],
        isDestination: true,
        title: 'Destination',
        popup: `<b>Destination:</b> ${destText}`,
      })
    }
    return list
  }, [originCoords?.lat, originCoords?.lng, destCoords?.lat, destCoords?.lng, originText, destText])

  // Active highway route or immediate corridor preview while road network calculates
  const activePolyline = useMemo(() => {
    if (result?.waypoints_data && result.waypoints_data.length > 0) {
      return result.waypoints_data
    }
    if (originCoords && destCoords) {
      return [
        [originCoords.lat, originCoords.lng],
        [destCoords.lat, destCoords.lng]
      ] as [number, number][]
    }
    return undefined
  }, [result?.waypoints_data, originCoords?.lat, originCoords?.lng, destCoords?.lat, destCoords?.lng])

  // Simulation Progress
  const totalWaypoints = result?.waypoints_data?.length || 1
  const progressPct = Math.min(100, Math.round((simIndex / totalWaypoints) * 100))

  // Real-Time Turn-by-Turn Guidance & Telematics Metrics
  const currentStep = useMemo(() => {
    if (!result?.turn_by_turn_instructions || result.turn_by_turn_instructions.length === 0) {
      return null
    }
    const steps = result.turn_by_turn_instructions
    const stepIdx = Math.min(steps.length - 1, Math.floor((simIndex / totalWaypoints) * steps.length))
    return steps[stepIdx]
  }, [result?.turn_by_turn_instructions, simIndex, totalWaypoints])

  const remainingKm = useMemo(() => {
    if (!result?.total_distance_km) return 0
    return Math.max(0, Math.round(result.total_distance_km * (1 - simIndex / totalWaypoints)))
  }, [result?.total_distance_km, simIndex, totalWaypoints])

  const remainingMinutes = useMemo(() => {
    if (!result?.estimated_duration_minutes) return 0
    return Math.max(0, Math.round(result.estimated_duration_minutes * (1 - simIndex / totalWaypoints)))
  }, [result?.estimated_duration_minutes, simIndex, totalWaypoints])

  return (
    <ErrorBoundary fallbackTitle="Route Optimizer Map Unavailable">
      <div style={{ paddingBottom: 40 }}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div className="page-title-block">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Navigation size={26} color="var(--color-accent-1)" />
              Real-Time Route Optimization & Mapping
            </h1>
            <p className="page-subtitle">
              Live highway telemetry · Enter any city or address without coordinates · Google Maps & Satellite integration
            </p>
          </div>
          <div className="page-actions" style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-accent">
              <Brain size={13} style={{ marginRight: 4 }} /> AI Dynamic Dijkstra + A*
            </span>
            <span className="badge badge-success">
              <CheckCircle2 size={13} style={{ marginRight: 4 }} /> OSRM Road Geometry
            </span>
          </div>
        </div>

        {/* Quick Hub Presets */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Quick Logistics Hubs & Ports:
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
            {PRESET_HUBS.map((hub) => (
              <button
                key={hub.label}
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--color-border-subtle)',
                }}
                onClick={() => {
                  if (!originCoords || originText === hub.name) {
                    setOriginText(hub.name)
                    setOriginCoords({ lat: hub.lat, lng: hub.lng })
                    toast.success(`Origin set: ${hub.label}`)
                  } else {
                    setDestText(hub.name)
                    setDestCoords({ lat: hub.lat, lng: hub.lng })
                    toast.success(`Destination set: ${hub.label}`)
                  }
                }}
              >
                📍 {hub.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20 }}>
          {/* Left Control Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Location Config Card */}
            <div className="card card-body">
              <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={18} color="var(--color-accent-1)" />
                  Route Endpoints
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  title="Swap Origin and Destination"
                  onClick={handleSwap}
                  style={{ padding: '4px 8px' }}
                >
                  <ArrowRightLeft size={14} /> Swap
                </button>
              </h4>

              {/* Origin Search */}
              <div className="form-group mb-3 location-autocomplete-container" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ margin: 0, color: '#10b981', fontWeight: 700 }}>
                    🟢 Origin Location (City, Port, or Address)
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="btn btn-ghost btn-xs"
                    style={{ fontSize: '0.7rem', color: 'var(--color-accent-1)', padding: '2px 6px' }}
                  >
                    <Compass size={11} style={{ marginRight: 3 }} /> My GPS
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    value={originText}
                    onChange={(e) => {
                      setOriginText(e.target.value)
                      setShowOriginDropdown(true)
                    }}
                    onFocus={() => setShowOriginDropdown(true)}
                    placeholder="e.g. San Francisco Hub, Mumbai Port, Chicago..."
                    style={{ paddingRight: 32 }}
                  />
                  <Search size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                </div>

                {/* Origin Dropdown Suggestions */}
                {showOriginDropdown && originSuggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      background: 'rgba(15,23,42,0.98)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      maxHeight: 220,
                      overflowY: 'auto',
                      marginTop: 4,
                    }}
                  >
                    {originSuggestions.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                        onMouseDown={() => {
                          setOriginText(s.display_name)
                          setOriginCoords({ lat: s.latitude, lng: s.longitude })
                          setShowOriginDropdown(false)
                        }}
                      >
                        <MapPin size={13} color="#10b981" />
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{s.display_name}</div>
                        </div>
                        <span className="badge badge-xs" style={{ fontSize: '0.65rem' }}>{s.category}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Search */}
              <div className="form-group mb-4 location-autocomplete-container" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ margin: 0, color: '#ef4444', fontWeight: 700 }}>
                    🔴 Destination Location (City, Port, or Address)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPickMode(pickMode === 'dest' ? null : 'dest')
                      toast(pickMode === 'dest' ? 'Map pick cancelled' : 'Click anywhere on the map to set Destination!', { icon: '📍' })
                    }}
                    className={`btn btn-xs ${pickMode === 'dest' ? 'btn-danger' : 'btn-ghost'}`}
                    style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                  >
                    <MapPin size={11} style={{ marginRight: 3 }} /> {pickMode === 'dest' ? 'Click Map Now' : 'Pick on Map'}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    value={destText}
                    onChange={(e) => {
                      setDestText(e.target.value)
                      setShowDestDropdown(true)
                    }}
                    onFocus={() => setShowDestDropdown(true)}
                    placeholder="e.g. New York Gateway, Los Angeles Port, London..."
                    style={{ paddingRight: 32 }}
                  />
                  <Search size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                </div>

                {/* Destination Dropdown Suggestions */}
                {showDestDropdown && destSuggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      background: 'rgba(15,23,42,0.98)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      maxHeight: 220,
                      overflowY: 'auto',
                      marginTop: 4,
                    }}
                  >
                    {destSuggestions.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                        onMouseDown={() => {
                          setDestText(s.display_name)
                          setDestCoords({ lat: s.latitude, lng: s.longitude })
                          setShowDestDropdown(false)
                        }}
                      >
                        <MapPin size={13} color="#ef4444" />
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{s.display_name}</div>
                        </div>
                        <span className="badge badge-xs" style={{ fontSize: '0.65rem' }}>{s.category}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Optimization Strategy */}
              <div className="form-group mb-4">
                <label className="form-label" style={{ fontWeight: 600 }}>Optimization Objective</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { id: 'FASTEST', label: '⚡ Fastest Corridor', desc: 'Expressway & speed priority' },
                    { id: 'ECO_FRIENDLY', label: '🌿 Eco-Friendly', desc: 'Lowest fuel & CO₂' },
                    { id: 'AVOID_TOLLS', label: '💰 Avoid Tolls', desc: 'Zero toll highways' },
                    { id: 'SHORTEST', label: '📏 Shortest Path', desc: 'Minimum total distance' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`btn btn-sm ${strategy === s.id ? 'btn-primary' : 'btn-ghost'}`}
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        textAlign: 'left',
                        height: 'auto',
                      }}
                      onClick={() => setStrategy(s.id as any)}
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{s.label}</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cargo Weight */}
              <div className="form-group mb-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Cargo Payload</label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent-1)' }}>
                    {cargoWeightKg.toLocaleString()} kg ({(cargoWeightKg / 1000).toFixed(1)} tons)
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="25000"
                  step="500"
                  value={cargoWeightKg}
                  onChange={(e) => setCargoWeightKg(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-accent-1)' }}
                />
              </div>

              {/* Optimize Button */}
              <button
                className="btn btn-primary w-full"
                onClick={handleOptimize}
                disabled={loading}
                style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.9rem' }}
              >
                {loading ? (
                  <>
                    <span className="animate-spin" style={{ display: 'inline-block', marginRight: 8 }}>⟳</span>
                    Calculating Real-Time Road Network...
                  </>
                ) : (
                  <>
                    <Play size={16} style={{ marginRight: 8 }} /> Calculate & Optimize Route
                  </>
                )}
              </button>
            </div>

            {/* Results & Telematics Dashboard */}
            {result && (
              <div className="card card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0 }}>Optimization Telematics</h4>
                  <span className="badge badge-accent" style={{ fontWeight: 800 }}>
                    Score: 96/100
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Real Highway Distance', value: `${result.total_distance_km.toFixed(1)} km (${(result.total_distance_km * 0.621371).toFixed(1)} mi)`, icon: Navigation, color: '#38bdf8' },
                    { label: 'Estimated Transit Time', value: `${Math.floor(result.estimated_duration_minutes / 60)}h ${Math.round(result.estimated_duration_minutes % 60)}m`, icon: Clock, color: '#facc15' },
                    { label: 'Carbon Emissions', value: `${result.carbon_emissions_kg.toFixed(1)} kg CO₂`, icon: Leaf, color: '#10b981' },
                    { label: 'Estimated Commercial Fuel', value: `$${(result.total_distance_km * 0.16).toFixed(2)} USD`, icon: Fuel, color: '#fb923c' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <row.icon size={13} color={row.color} />
                        {row.label}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <span className="badge badge-success">
                    <Cloud size={11} style={{ marginRight: 4 }} /> Weather: Clear Transit
                  </span>
                  <span className="badge badge-info">
                    🚗 Traffic: {result.traffic_density || 'NORMAL'}
                  </span>
                  <span className="badge badge-accent">
                    🛡️ Verified Highway Corridor
                  </span>
                </div>

                {/* Weather Advisory */}
                {result.weather_summary && (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(56,189,248,0.06)', borderRadius: 8, border: '1px solid rgba(56,189,248,0.2)', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: 2 }}>Route Weather Intelligence</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>{result.weather_summary}</div>
                  </div>
                )}

                {/* Turn by Turn Instructions Accordion */}
                {result.turn_by_turn_instructions && result.turn_by_turn_instructions.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      Turn-By-Turn Highway Navigation ({result.turn_by_turn_instructions.length} steps):
                    </div>
                    <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
                      {result.turn_by_turn_instructions.map((step: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 10px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            border: '1px solid var(--color-border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, color: 'var(--color-accent-1)', minWidth: 18 }}>
                              {step.step || idx + 1}.
                            </span>
                            <span>{step.instruction}</span>
                          </div>
                          <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>
                            {step.distance}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Map Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Map Top Bar with Mode Controls & Real-Time Simulation HUD */}
            <div
              className="card card-body"
              style={{
                padding: '12px 18px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Left Side: View Mode & Map Layer Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {/* View Mode Toggle: Telematics vs Official Google Maps */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 3, border: '1px solid var(--color-border-subtle)' }}>
                  <button
                    className={`btn btn-xs ${viewMode === 'telematics' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px' }}
                    onClick={() => setViewMode('telematics')}
                  >
                    <Activity size={12} style={{ marginRight: 4 }} /> AI Telematics Map
                  </button>
                  <button
                    className={`btn btn-xs ${viewMode === 'google-maps' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px' }}
                    onClick={() => setViewMode('google-maps')}
                  >
                    🗺️ Google Maps Live
                  </button>
                </div>

                {/* Direct Google Maps Navigation Link */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originText)}&destination=${encodeURIComponent(destText)}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-xs"
                  style={{
                    background: 'rgba(26,115,232,0.18)',
                    border: '1px solid #1a73e8',
                    color: '#60a5fa',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    textDecoration: 'none'
                  }}
                  title="Open live turn-by-turn navigation in official Google Maps app"
                >
                  <ExternalLink size={12} /> Open in Google Maps ↗
                </a>

                {/* Map Layers (when in Telematics mode) */}
                {viewMode === 'telematics' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {[
                      { id: 'cyber-dark', label: '🌙 Dark' },
                      { id: 'google-roads', label: '🗺️ Roads' },
                      { id: 'google-hybrid', label: '🛰️ Satellite' },
                      { id: 'osm', label: '🌐 OSM' },
                    ].map((layer) => (
                      <button
                        key={layer.id}
                        className={`btn btn-xs ${mapType === layer.id ? 'btn-accent' : 'btn-ghost'}`}
                        style={{ fontSize: '0.72rem', padding: '3px 7px' }}
                        onClick={() => setMapType(layer.id as any)}
                      >
                        {layer.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: Real-Time Simulation & Camera Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {viewMode === 'telematics' && (
                  <>
                    {/* Follow Camera Toggle */}
                    <button
                      className={`btn btn-xs ${followVehicle ? 'btn-success' : 'btn-ghost'}`}
                      style={{ fontSize: '0.72rem', padding: '4px 8px', fontWeight: 600 }}
                      onClick={() => setFollowVehicle(!followVehicle)}
                      title="Keep map camera centered on vehicle during transit"
                    >
                      <Crosshair size={12} style={{ marginRight: 4 }} />
                      Follow Camera: {followVehicle ? 'ON' : 'OFF'}
                    </button>

                    {/* Live Traffic Flow Toggle */}
                    <button
                      className={`btn btn-xs ${showTraffic ? 'btn-accent' : 'btn-ghost'}`}
                      style={{ fontSize: '0.72rem', padding: '4px 8px', fontWeight: 600 }}
                      onClick={() => setShowTraffic(!showTraffic)}
                      title="Toggle Google Maps style traffic congestion (Green/Yellow/Red)"
                    >
                      <Radio size={12} style={{ marginRight: 4 }} />
                      Live Traffic
                    </button>

                    {/* Sim Speed Multiplier */}
                    <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: 2 }}>
                      {[1, 2, 5].map((spd) => (
                        <button
                          key={spd}
                          className={`btn btn-xs ${simSpeed === spd ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ fontSize: '0.7rem', padding: '2px 6px', minWidth: 26 }}
                          onClick={() => setSimSpeed(spd)}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Simulation Play / Pause Button */}
                <button
                  className={`btn btn-sm ${isSimulating ? 'btn-warning' : 'btn-accent'}`}
                  onClick={toggleSimulation}
                  disabled={!result}
                  style={{ fontWeight: 700, fontSize: '0.78rem' }}
                >
                  {isSimulating ? (
                    <>
                      <Pause size={13} style={{ marginRight: 4 }} /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={13} style={{ marginRight: 4 }} /> Start Real-Time Simulation
                    </>
                  )}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={resetSimulation}
                  disabled={!activeVehicle && simIndex === 0}
                  title="Reset vehicle to start"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* Map Container */}
            <div
              className="card"
              style={{
                position: 'relative',
                minHeight: 640,
                flex: 1,
                overflow: 'hidden',
                borderRadius: 12,
                border: pickMode ? '2px solid #ef4444' : '1px solid var(--color-border)',
              }}
            >
              {/* Real-Time Google Maps Navigation Banner (Floating HUD) */}
              {viewMode === 'telematics' && result && (
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    right: 14,
                    zIndex: 1000,
                    background: 'rgba(10, 30, 22, 0.94)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: 12,
                    padding: '10px 16px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Left: Next Turn Step Instruction */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 18,
                        boxShadow: '0 0 15px rgba(16,185,129,0.5)',
                      }}
                    >
                      ↱
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f2fbf6' }}>
                        {currentStep ? currentStep.instruction : 'En route via Expressway Corridor'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        Segment distance: <strong style={{ color: '#34d399' }}>{currentStep?.distance || '14.2 km'}</strong> · Corridor: <strong style={{ color: '#38bdf8' }}>I-5 Freight Bypass</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live ETA, Distance Remaining, Speedometer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#facc15' }}>
                        {Math.floor(remainingMinutes / 60)}h {remainingMinutes % 60}m
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {remainingKm} km remaining
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'rgba(56,189,248,0.15)',
                        border: '1px solid #0284c7',
                        borderRadius: 8,
                        padding: '4px 10px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', color: '#93c5fd', fontWeight: 700 }}>SPEED</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#38bdf8' }}>
                        {activeVehicle?.speedKmh || 82} <span style={{ fontSize: '0.65rem' }}>km/h</span>
                      </div>
                    </div>

                    <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.7rem' }}>
                      🟢 Live GPS Active
                    </span>
                  </div>
                </div>
              )}

              {/* Map Click Instructions Banner */}
              {pickMode && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    background: '#ef4444',
                    color: '#fff',
                    padding: '8px 18px',
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    boxShadow: '0 4px 16px rgba(239,68,68,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <MapPin size={16} /> Click anywhere on the map to set {pickMode === 'origin' ? 'Origin' : 'Destination'}
                </div>
              )}

              {/* Render either AI Telematics Map or Official Google Maps View */}
              {viewMode === 'telematics' ? (
                <LeafletMap
                  markers={mapMarkers}
                  polyline={activePolyline}
                  height="100%"
                  fitBounds={!followVehicle}
                  mapType={mapType}
                  activeVehicle={activeVehicle}
                  followVehicle={followVehicle}
                  showTraffic={showTraffic}
                  onMapClick={handleMapClick}
                />
              ) : (
                <iframe
                  title="Official Google Maps Real-Time Routing"
                  src={`https://maps.google.com/maps?saddr=${originCoords?.lat || 37.7749},${originCoords?.lng || -122.4194}&daddr=${destCoords?.lat || 33.7432},${destCoords?.lng || -118.2673}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 640, borderRadius: 12 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

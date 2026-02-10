'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'
import { Database } from '@/types/supabase'

type Item = Database['public']['Tables']['items']['Row']

interface MapProps {
  items: Item[]
  center?: [number, number]
  zoom?: number
  selectable?: boolean
  selectedPosition?: [number, number] | null
  onSelect?: (lat: number, lng: number) => void
}

function LocationSelector({
  position,
  onChange,
}: {
  position: [number, number] | null
  onChange: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const m = e.target
          const p = m.getLatLng()
          onChange(p.lat, p.lng)
        },
      }}
    >
      <Popup>Selected location</Popup>
    </Marker>
  ) : null
}

function Recenter({ position }: { position: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position)
    }
  }, [position, map])
  return null
}

function MyLocationButton({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false)
        setError(null)
        const { latitude, longitude } = pos.coords
        onSelect(latitude, longitude)
      },
      (err) => {
        setLoading(false)
        setError(err.message || 'Failed to get location')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }
  return (
    <div className="absolute bottom-3 left-3 z-[100] flex items-center gap-2">
      <button
        type="button"
        onClick={handleLocate}
        className="rounded-md bg-white/90 px-3 py-1 text-sm shadow border border-zinc-200 hover:bg-white"
        title="Use my current location"
      >
        {loading ? 'Locating…' : 'My Location'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

export default function Map({
  items,
  center = [40.7128, -74.0060],
  zoom = 13,
  selectable = false,
  selectedPosition = null,
  onSelect,
}: MapProps) {
  const [internalPos, setInternalPos] = useState<[number, number] | null>(selectedPosition)

  const handleSelect = (lat: number, lng: number) => {
    setInternalPos([lat, lng])
    onSelect?.(lat, lng)
  }

  return (
    <div className="relative h-full w-full rounded-lg z-0">
      <MapContainer
        center={internalPos ?? center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {internalPos && <Recenter position={internalPos} />}

        {selectable ? (
          <LocationSelector position={internalPos} onChange={handleSelect} />
        ) : (
          items.map((item) =>
            item.latitude && item.longitude ? (
              <Marker key={item.id} position={[item.latitude, item.longitude]}>
                <Popup>
                  <div className="min-w-[150px]">
                    <h3 className="font-bold text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.type === 'lost'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {item.type.toUpperCase()}
                      </span>
                      <a
                        href={`/items/${item.id}`}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ) : null
          )
        )}
      </MapContainer>
      {selectable && <MyLocationButton onSelect={handleSelect} />}
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Search, MapPin, List, Map as MapIcon, SlidersHorizontal, X } from 'lucide-react'
import Image from 'next/image'
import { formatDateUTC } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Loading Map...</div>
})

type Item = Database['public']['Tables']['items']['Row']

function ItemCard({ item }: { item: Item }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
      <a href={`/items/${item.id}`} className="block">
        <div className="aspect-video w-full bg-muted relative">
          {item.images && item.images[0] ? (
            <Image 
              src={item.images[0]} 
              alt={item.title} 
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Search className="h-8 w-8" />
            </div>
          )}
          <Badge className={`absolute top-2 right-2 border ${
            item.type === 'lost' ? 'bg-red-500/10 text-red-700 border-red-200' : 'bg-green-500/10 text-green-700 border-green-200'
          }`}>
            {item.type.toUpperCase()}
          </Badge>
        </div>
      </a>
      <CardHeader className="pb-2">
        <a href={`/items/${item.id}`} className="block">
          <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
        </a>
        <p className="text-xs text-muted-foreground pt-1">{formatDateUTC(item.created_at)}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
        {item.location_name && (
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{item.location_name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ClientSearchPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
  })
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [useLocationSearch, setUseLocationSearch] = useState(false)
  const [radius, setRadius] = useState(10) // km
  const [showFilters, setShowFilters] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => setUserLocation({ lat: 40.7128, lng: -74.0060 }) // Default to NYC
      )
    }
  }, [])

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      try {
        let query
        if (useLocationSearch && userLocation) {
          query = supabase.rpc('get_items_nearby', {
            lat: userLocation.lat,
            long: userLocation.lng,
            radius_km: radius
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)
        } else {
          query = supabase.from('items').select('*')
        }

        if (searchQuery) query = query.ilike('title', `%${searchQuery}%`)
        if (filters.type !== 'all') query = query.eq('type', filters.type)
        if (filters.category !== 'all') query = query.eq('category', filters.category)
        
        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) throw error
        setItems(data || [])
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [searchQuery, filters, userLocation, useLocationSearch, radius, supabase])

  const filteredItems = useMemo(() => items, [items])

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Items</h1>
          <p className="text-muted-foreground mt-1">Find what you&apos;ve lost, or report what you&apos;ve found.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => setViewMode('list')} size="icon"><List className="w-4 h-4" /></Button>
           <Button variant={viewMode === 'map' ? 'secondary' : 'ghost'} onClick={() => setViewMode('map')} size="icon"><MapIcon className="w-4 h-4" /></Button>
           <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="md:hidden"><SlidersHorizontal className="w-4 h-4 mr-2" /> Filters</Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className={`w-full md:w-72 flex-shrink-0 ${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="sticky top-20 space-y-6">
            <div className="flex justify-between items-center md:hidden">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="E.g., 'red wallet'" className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="found">Found</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="keys">Keys</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="nearMe" className={!userLocation ? 'text-muted-foreground' : ''}>Search Near Me</Label>
                <Switch id="nearMe" checked={useLocationSearch} onCheckedChange={setUseLocationSearch} disabled={!userLocation} />
              </div>
              {useLocationSearch && (
                <div className="space-y-2">
                  <Label>Radius ({radius} km)</Label>
                  <Slider value={[radius]} onValueChange={([val]) => setRadius(val)} min={1} max={100} step={1} />
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {viewMode === 'map' ? (
            <div className="h-[calc(100vh-10rem)] rounded-lg border overflow-hidden shadow-sm sticky top-20">
              <Map items={filteredItems} center={userLocation ? [userLocation.lat, userLocation.lng] : undefined} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                 Array(6).fill(0).map((_, i) => (
                   <Card key={i} className="h-80"><div className="h-full w-full bg-muted animate-pulse" /></Card>
                 ))
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => <ItemCard key={item.id} item={item} />)
              ) : (
                <div className="col-span-full text-center py-16 text-muted-foreground border rounded-lg bg-card">
                  <h3 className="text-xl font-semibold">No items found</h3>
                  <p>Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

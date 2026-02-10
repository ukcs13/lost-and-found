'use client'

import { Database } from '@/types/supabase'
import { MatchResult } from '@/lib/matching'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDateUTC } from '@/lib/utils'

type Item = Database['public']['Tables']['items']['Row']

interface ClientMatchPageProps {
  sourceItem: Item
  matches: MatchResult[]
}

export default function ClientMatchPage({ sourceItem, matches }: ClientMatchPageProps) {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-yellow-500" />
          AI Match Results
        </h1>
        <p className="text-muted-foreground mt-2">
          Based on your {sourceItem.type} item &quot;<strong>{sourceItem.title}</strong>&quot;, we found these potential matches.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No matches found yet. Check back later!</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href={`/items/${sourceItem.id}`}>Back to Item</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <Card key={match.item.id} className="overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={match.score > 70 ? "default" : "secondary"} className="mb-2">
                    {Math.round(match.score)}% Match
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">{match.item.type}</span>
                </div>
                <CardTitle className="line-clamp-1">{match.item.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {match.item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-4">
                  {match.item.location_name && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="truncate">{match.item.location_name}</span>
                    </div>
                  )}
                  {match.item.date_lost_found && (
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDateUTC(match.item.date_lost_found)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {match.reasons.map((reason, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-muted/50">
                      {reason}
                    </Badge>
                  ))}
                </div>

                <Button asChild className="w-full">
                  <Link href={`/items/${match.item.id}`}>
                    View Details <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

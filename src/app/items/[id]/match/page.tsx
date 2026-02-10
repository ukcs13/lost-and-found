import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { findMatches } from '@/lib/matching'
import ClientMatchPage from './ClientMatchPage'
import { Database } from '@/types/supabase'

type Item = Database['public']['Tables']['items']['Row']

export default async function MatchPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()

  // 1. Fetch source item
  const { data: sourceItemData, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', params.id)
    .single()

  const sourceItem = sourceItemData as Item | null

  if (error || !sourceItem) {
    notFound()
  }

  // 2. Fetch candidates (items of opposite type)
  // Optimization: Only fetch items from last 30 days or limit to 100 recent items
  const oppositeType = sourceItem.type === 'lost' ? 'found' : 'lost'
  
  const { data: candidatesData } = await supabase
    .from('items')
    .select('*')
    .eq('type', oppositeType)
    .eq('status', 'open') // Only match open items
    .order('created_at', { ascending: false })
    .limit(100)

  const candidates = candidatesData as Item[] | null

  // 3. Calculate matches
  const matches = findMatches(sourceItem, candidates || [])

  return <ClientMatchPage sourceItem={sourceItem} matches={matches} />
}

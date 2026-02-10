import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ItemDetailClient from './ItemDetailClient'
import { Database } from '@/types/supabase'

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: itemData, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !itemData) {
    notFound()
  }

  const item = itemData as Database['public']['Tables']['items']['Row']

  // Fetch owner profile
  const { data: owner } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', item.user_id)
    .single()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Item Details...</div>}>
      <ItemDetailClient 
        item={item} 
        owner={owner} 
        currentUser={user ? { id: user.id } : null} 
      />
    </Suspense>
  )
}

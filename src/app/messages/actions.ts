'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/supabase'

export async function sendMessage(itemId: string, receiverId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('messages') as any)
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      item_id: itemId,
      content: content
    })

  if (error) {
    throw new Error('Failed to send message')
  }
  
  revalidatePath('/messages')
}

type ReturnMessage = Database['public']['Tables']['messages']['Row'] & {
  item: { id: string; title: string; images: string[] | null }
  sender: { id: string; full_name: string | null; avatar_url: string | null }
  receiver: { id: string; full_name: string | null; avatar_url: string | null }
}

export async function getMessages(): Promise<ReturnMessage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  // Fetch messages where user is sender or receiver, and include item relation
  // Profiles are fetched separately because messages.sender_id does not reference profiles directly
  type MessageRow = Database['public']['Tables']['messages']['Row']
  type ItemRow = Database['public']['Tables']['items']['Row']
  type ProfileRow = Database['public']['Tables']['profiles']['Row']

  const { data: msgs, error } = await supabase
    .from('messages')
    .select(`
      *,
      item:items (
        id,
        title,
        images
      )
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: true })
    .returns<(MessageRow & { item: Pick<ItemRow, 'id' | 'title' | 'images'> | null })[]>()

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  const messages = (msgs || []) as (MessageRow & { item: Pick<ItemRow, 'id' | 'title' | 'images'> | null })[]
  const ids = Array.from(new Set(messages.flatMap((m) => [m.sender_id, m.receiver_id]).filter(Boolean))) as string[]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', ids)
    .returns<Pick<ProfileRow, 'id' | 'full_name' | 'avatar_url'>[]>()

  const profileMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>()
  ;(profiles || []).forEach((p) =>
    profileMap.set(p.id, { id: p.id, full_name: p.full_name ?? null, avatar_url: p.avatar_url ?? null })
  )

  const enriched: ReturnMessage[] = messages.map((m) => {
    const item = m.item
      ? { id: m.item.id, title: m.item.title, images: m.item.images ?? [] }
      : { id: m.item_id, title: 'Unknown Item', images: [] }
    return {
      ...m,
      item,
      sender: profileMap.get(m.sender_id) || { id: m.sender_id, full_name: null, avatar_url: null },
      receiver: profileMap.get(m.receiver_id) || { id: m.receiver_id, full_name: null, avatar_url: null },
    }
  })

  return enriched
}

export async function markAsRead(messageIds: string[]) {
  const supabase = await createClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('messages') as any)
    .update({ is_read: true })
    .in('id', messageIds)

  if (error) {
    console.error('Error marking messages as read:', error)
  }
  
  revalidatePath('/messages')
}

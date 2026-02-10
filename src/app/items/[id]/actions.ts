'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteItem(itemId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId)

  if (error) {
    throw new Error('Failed to delete item')
  }

  revalidatePath('/search')
  revalidatePath('/dashboard')
  redirect('/search')
}

export async function markAsResolved(itemId: string) {
  const supabase = await createClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('items') as any)
    .update({ status: 'resolved' })
    .eq('id', itemId)

  if (error) {
    throw new Error('Failed to update item status')
  }

  revalidatePath(`/items/${itemId}`)
}

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
  
  // No redirect here, we'll handle UI update in client
}

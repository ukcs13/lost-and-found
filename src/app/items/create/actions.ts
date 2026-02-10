 'use server'
 
 import { createClient } from '@/lib/supabase/server'
 import { Database } from '@/types/supabase'
 
type ItemInsert = Database['public']['Tables']['items']['Insert']
 
export async function createItem(payload: ItemInsert) {
   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) {
     throw new Error('Not authenticated')
   }
   
   console.log('[createItem] User:', user.id)
   console.log('[createItem] Payload user_id:', payload.user_id)

   if (payload.user_id !== user.id) {
     throw new Error(`Invalid user_id: payload ${payload.user_id} != auth ${user.id}`)
   }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('items') as any).insert(payload)
   if (error) {
    console.error('[createItem] Insert error:', error)
    const msg = String(error.message).toLowerCase()
    if (msg.includes('row level security')) {
      throw new Error('Insert blocked by RLS. Apply items table policies in Supabase SQL Editor.')
    }
     throw error
   }
 
   return { ok: true }
 }

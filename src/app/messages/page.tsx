import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ClientInbox from './ClientInbox'
import { getMessages } from './actions'
import { redirect } from 'next/navigation'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const messages = await getMessages()

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Messages...</div>}>
      <ClientInbox initialMessages={messages || []} currentUserId={user.id} />
    </Suspense>
  )
}

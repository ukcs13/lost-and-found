import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Search } from 'lucide-react'
import { Database } from '@/types/supabase'
import { formatDateUTC } from '@/lib/utils'

// A new component for displaying an item card
function ItemCard({ item }: { item: Database['public']['Tables']['items']['Row'] }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <Link href={`/items/${item.id}`} className="block">
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
        <CardHeader className="pb-2">
          <CardTitle className="text-lg truncate">{item.title}</CardTitle>
          <div className="flex justify-between items-center pt-1">
             <Badge variant={item.status === 'open' ? 'outline' : 'secondary'}>
              {item.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDateUTC(item.created_at)}
            </span>
          </div>
        </CardHeader>
      </Link>
    </Card>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: myItems } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .returns<Database['public']['Tables']['items']['Row'][]>()

  return (
    <div className="flex-1 space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back!</h1>
          <p className="text-muted-foreground">Here&apos;s a list of your reported items.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/items/create?type=lost">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Report an Item
            </Button>
          </Link>
        </div>
      </div>

      {myItems && myItems.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              You have no reported items
            </h3>
            <p className="text-sm text-muted-foreground">
              You can start reporting items as soon as you find or lose something.
            </p>
            <Link href="/items/create?type=lost" className="mt-4">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Report an Item
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

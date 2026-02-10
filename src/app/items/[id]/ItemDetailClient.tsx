'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Calendar, Tag, User, MessageCircle, CheckCircle, Trash2, ArrowLeft, Sparkles } from 'lucide-react'
import { deleteItem, markAsResolved, sendMessage } from './actions'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatDateUTC } from '@/lib/utils'

// Dynamically import Map with no SSR
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Map...</div>
})

type Item = Database['public']['Tables']['items']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface ItemDetailClientProps {
  item: Item
  owner: Profile | null
  currentUser: { id: string } | null
}

export default function ItemDetailClient({ item, owner, currentUser }: ItemDetailClientProps) {
  const router = useRouter()
  const isOwner = currentUser?.id === item.user_id
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)

  const { toast } = useToast()

  const handleSendMessage = async () => {
    if (!message.trim()) return
    setIsSending(true)
    try {
      await sendMessage(item.id, item.user_id, message)
      setMessageOpen(false)
      setMessage('')
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      })
      router.push('/messages') // Redirect to inbox after sending
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleResolve = async () => {
    if (!confirm('Are you sure you want to mark this item as resolved?')) return
    setIsResolving(true)
    try {
      await markAsResolved(item.id)
      toast({
        title: "Status updated",
        description: "Item marked as resolved.",
      })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsResolving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return
    setIsDeleting(true)
    try {
      await deleteItem(item.id)
      toast({
        title: "Item deleted",
        description: "The item has been deleted successfully.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <Button variant="ghost" className="mb-6 hover:bg-accent" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Images & Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-card rounded-lg overflow-hidden aspect-video relative border">
             {item.images && item.images.length > 0 ? (
               <Image 
                 src={item.images[0]} 
                 alt={item.title} 
                 fill
                 className="object-cover" 
               />
             ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                 No Image Available
               </div>
             )}
             <div className="absolute top-4 right-4">
                <Badge className={
                  item.type === 'lost' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }>
                  {item.type.toUpperCase()}
                </Badge>
             </div>
          </div>

          {/* Map */}
          {item.latitude && item.longitude && (
            <div className="h-[300px] rounded-lg overflow-hidden border shadow-sm">
              <Map items={[item]} center={[item.latitude, item.longitude]} zoom={15} />
            </div>
          )}
        </div>

        {/* Right Column: Details & Actions */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
            <div className="flex items-center text-muted-foreground mb-4">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{item.date_lost_found ? formatDateUTC(item.date_lost_found) : 'Date unknown'}</span>
              <span className="mx-2">•</span>
              <MapPin className="h-4 w-4 mr-1" />
              <span>{item.location_name || 'Location unknown'}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
               <Badge variant="secondary" className="flex items-center">
                 <Tag className="h-3 w-3 mr-1" /> {item.category}
               </Badge>
               <Badge variant={item.status === 'open' ? 'outline' : 'default'} className="uppercase">
                 {item.status}
               </Badge>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-foreground whitespace-pre-wrap">{item.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={owner?.avatar_url || ''} />
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Posted by</p>
                <p className="font-medium">{owner?.full_name || 'Anonymous'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full shadow-sm hover:shadow-md border-primary/50 text-primary hover:text-primary hover:bg-primary/5" 
              onClick={() => router.push(`/items/${item.id}/match`)}
            >
              <Sparkles className="mr-2 h-4 w-4" /> Find AI Matches
            </Button>

            {isOwner ? (
              <>
                {item.status === 'open' && (
                  <Button className="w-full shadow-sm hover:shadow-md" onClick={handleResolve} disabled={isResolving}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved
                  </Button>
                )}
                <Button variant="destructive" className="w-full shadow-sm hover:shadow-md" onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                </Button>
              </>
            ) : (
              <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full shadow-sm hover:shadow-md" size="lg">
                    <MessageCircle className="mr-2 h-4 w-4" /> Contact {item.type === 'lost' ? 'Owner' : 'Finder'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Message</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Start a conversation about <strong>{item.title}</strong>.
                    </p>
                    <Textarea 
                      placeholder="Hi, I think I found your item..." 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSendMessage} disabled={isSending || !message.trim()}>
                      {isSending ? 'Sending...' : 'Send Message'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

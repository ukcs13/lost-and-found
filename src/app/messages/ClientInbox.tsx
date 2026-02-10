'use client'

import { useState, useEffect, useRef } from 'react'
import { Database } from '@/types/supabase'
import { sendMessage, markAsRead } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, User, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
// import { useRouter } from 'next/navigation'

// Extended types to include relations
type Message = Database['public']['Tables']['messages']['Row'] & {
  item: { id: string; title: string; images: string[] | null }
  sender: { id: string; full_name: string | null; avatar_url: string | null }
  receiver: { id: string; full_name: string | null; avatar_url: string | null }
}

interface Conversation {
  id: string // composite key: itemId_otherUserId
  itemId: string
  otherUserId: string
  itemTitle: string
  itemImage: string | null
  otherUserName: string
  otherUserAvatar: string | null
  lastMessage: Message
  messages: Message[]
  unreadCount: number
}

interface ClientInboxProps {
  initialMessages: Message[] // Fixed type from any[] to Message[]
  currentUserId: string
}

export default function ClientInbox({ initialMessages, currentUserId }: ClientInboxProps) {
  // const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Group messages into conversations
  useEffect(() => {
    const groups: { [key: string]: Conversation } = {}

    initialMessages.forEach((msg: Message) => {
      const isSender = msg.sender_id === currentUserId
      const otherUser = isSender ? msg.receiver : msg.sender
      const key = `${msg.item_id}_${otherUser.id}`

      if (!groups[key]) {
        groups[key] = {
          id: key,
          itemId: msg.item_id,
          otherUserId: otherUser.id,
          itemTitle: msg.item?.title || 'Unknown Item',
          itemImage: msg.item?.images?.[0] || null,
          otherUserName: otherUser.full_name || 'Anonymous',
          otherUserAvatar: otherUser.avatar_url,
          lastMessage: msg,
          messages: [],
          unreadCount: 0
        }
      }

      groups[key].messages.push(msg)
      
      // Update last message (assuming sorted by date asc)
      groups[key].lastMessage = msg
      
      if (!isSender && !msg.is_read) {
        groups[key].unreadCount++
      }
    })

    // Sort conversations by last message date desc
    const sortedConversations = Object.values(groups).sort((a, b) => 
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    )

    setConversations(sortedConversations)
  }, [initialMessages, currentUserId])

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [selectedConversationId, conversations])

  // Mark as read when opening conversation
  useEffect(() => {
    if (selectedConversationId) {
      const conversation = conversations.find(c => c.id === selectedConversationId)
      if (conversation && conversation.unreadCount > 0) {
        const unreadIds = conversation.messages
          .filter(m => m.receiver_id === currentUserId && !m.is_read) // I am receiver and not read
          .map(m => m.id)
        
        if (unreadIds.length > 0) {
          markAsRead(unreadIds)
          // Optimistic update
          setConversations(prev => prev.map(c => 
            c.id === selectedConversationId ? { ...c, unreadCount: 0 } : c
          ))
        }
      }
    }
  }, [selectedConversationId, conversations, currentUserId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversationId) return

    const conversation = conversations.find(c => c.id === selectedConversationId)
    if (!conversation) return

    setIsSending(true)
    try {
      await sendMessage(conversation.itemId, conversation.otherUserId, newMessage)
      setNewMessage('')
      // In a real app with subscriptions, this would auto-update.
      // For now, we rely on revalidatePath in the action, but simpler to just reload or optimistic add.
      // Let's reload to be safe and simple.
      // router.refresh() // Wait, router.refresh might not update props instantly in client component.
      // Optimistic add:
      const optimisticMsg: Message = {
        id: 'temp-' + Date.now(),
        content: newMessage,
        created_at: new Date().toISOString(),
        sender_id: currentUserId,
        receiver_id: conversation.otherUserId,
        item_id: conversation.itemId,
        is_read: false, // Adding is_read to satisfy Database type
        sender: { id: currentUserId, full_name: 'Me', avatar_url: null }, // mock
        receiver: { id: conversation.otherUserId, full_name: conversation.otherUserName, avatar_url: conversation.otherUserAvatar },
        item: { id: conversation.itemId, title: conversation.itemTitle, images: [] }
      }
      
      setConversations(prev => prev.map(c => {
        if (c.id === selectedConversationId) {
          return {
            ...c,
            messages: [...c.messages, optimisticMsg],
            lastMessage: optimisticMsg
          }
        }
        return c
      }))
      
    } catch (error) {
      console.error(error)
      alert('Failed to send')
    } finally {
      setIsSending(false)
    }
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  return (
    <div className="container mx-auto p-4 md:p-8 h-[calc(100vh-100px)]">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {/* Sidebar: Conversation List */}
        <Card className="col-span-1 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b bg-card font-medium text-sm text-muted-foreground">
            Recent Conversations
          </div>
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No messages yet.
              </div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={cn(
                    "p-4 border-b cursor-pointer hover:bg-accent transition-colors flex gap-3",
                    selectedConversationId === conv.id ? "bg-accent" : ""
                  )}
                >
                  <Avatar>
                    <AvatarImage src={conv.otherUserAvatar || ''} />
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-semibold text-sm truncate">{conv.otherUserName}</h4>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate flex items-center mt-1">
                      <span className="font-medium text-foreground mr-1">{conv.itemTitle}</span>
                    </p>
                    <p className={cn(
                      "text-sm truncate mt-1",
                      conv.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                    )}>
                      {conv.lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                      {conv.lastMessage.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Main: Chat Area */}
        <Card className="col-span-1 md:col-span-2 flex flex-col h-full overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                   <Avatar>
                    <AvatarImage src={selectedConversation.otherUserAvatar || ''} />
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold">{selectedConversation.otherUserName}</h3>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Re: {selectedConversation.itemTitle}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/items/${selectedConversation.itemId}`}>View Item</a>
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-accent/30" ref={scrollRef}>
                <div className="space-y-4">
                  {selectedConversation.messages.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUserId
                    return (
                      <div key={msg.id || idx} className={cn(
                        "flex w-full",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        <div className={cn(
                          "max-w-[70%] rounded-lg px-4 py-2 text-sm",
                          isMe ? "bg-blue-600 text-white shadow-sm" : "bg-card border shadow-sm text-foreground"
                        )}>
                          <MessageContent content={msg.content} />
                          <div className={cn(
                            "text-[10px] mt-1 text-right",
                            isMe ? "text-blue-100" : "text-muted-foreground"
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-card">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input 
                    placeholder="Type your message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (!selectedConversationId) return
                      const conversation = conversations.find(c => c.id === selectedConversationId)
                      if (!conversation) return
                      if (!navigator.geolocation) {
                        alert('Geolocation not supported on this device')
                        return
                      }
                      setIsSending(true)
                      try {
                        await new Promise<void>((resolve, reject) => {
                          navigator.geolocation.getCurrentPosition(
                            async (pos) => {
                              const { latitude, longitude } = pos.coords
                              const url = `https://www.google.com/maps?q=${latitude},${longitude}`
                              const content = `My location: ${url}`
                              await sendMessage(conversation.itemId, conversation.otherUserId, content)
                              const optimisticMsg: Message = {
                                id: 'temp-' + Date.now(),
                                content,
                                created_at: new Date().toISOString(),
                                sender_id: currentUserId,
                                receiver_id: conversation.otherUserId,
                                item_id: conversation.itemId,
                                is_read: false,
                                sender: { id: currentUserId, full_name: 'Me', avatar_url: null },
                                receiver: { id: conversation.otherUserId, full_name: conversation.otherUserName, avatar_url: conversation.otherUserAvatar },
                                item: { id: conversation.itemId, title: conversation.itemTitle, images: [] }
                              }
                              setConversations(prev => prev.map(c => {
                                if (c.id === selectedConversationId) {
                                  return {
                                    ...c,
                                    messages: [...c.messages, optimisticMsg],
                                    lastMessage: optimisticMsg
                                  }
                                }
                                return c
                              }))
                              resolve()
                            },
                            (err) => reject(err),
                            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                          )
                        })
                      } catch (err) {
                        console.error(err)
                        alert('Failed to get location')
                      } finally {
                        setIsSending(false)
                      }
                    }}
                    disabled={isSending}
                  >
                    Share Location
                  </Button>
                  <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-4 opacity-20" />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function MessageCircle({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  )
}

function MessageContent({ content }: { content: string }) {
  const mapRegex = /(https?:\/\/(?:www\.)?google\.com\/maps\?q=[^ \n]+|https?:\/\/maps\.google\.com\/\?q=[^ \n]+|https?:\/\/www\.google\.com\/maps\/search\/\?api=1&query=[^ \n]+)/gi
  const parts = content.split(mapRegex)
  const matches = content.match(mapRegex) || []
  const elements: React.ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    elements.push(<span key={`t-${i}`}>{parts[i]}</span>)
    if (i < matches.length) {
      const url = matches[i]
      elements.push(
        <a key={`l-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="underline">
          Open Map
        </a>
      )
    }
  }
  return <>{elements}</>
}

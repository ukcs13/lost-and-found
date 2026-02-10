'use server'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { LogOut, Search, MessageSquare, LayoutDashboard, PlusCircle, Compass } from 'lucide-react'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4">
        <Link href="/" className="mr-8 flex items-center space-x-2 transition-opacity hover:opacity-90">
          <div className="bg-primary/10 p-1 rounded-md">
            <Compass className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
            Lost & Found
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/search"
            className="transition-colors hover:text-primary text-muted-foreground flex items-center gap-1"
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {user ? (
              <>
                <Link href="/items/create?type=lost">
                  <Button size="sm" className="gap-2 hidden sm:flex">
                    <PlusCircle className="h-4 w-4" /> Post Item
                  </Button>
                  <Button size="icon" className="sm:hidden">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/messages">
                  <Button variant="ghost" size="icon" title="Messages" className="relative">
                    <MessageSquare className="h-5 w-5" />
                    <span className="sr-only">Messages</span>
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon" title="Dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="sr-only">Dashboard</span>
                  </Button>
                </Link>
                <form action={async () => {
                  'use server'
                  const supabase = await createClient()
                  await supabase.auth.signOut()
                }}>
                  <Button variant="ghost" size="icon" title="Sign Out">
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="font-medium">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="font-medium shadow-sm">Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

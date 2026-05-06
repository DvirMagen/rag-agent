'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Bot } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [email, setEmail] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setEmail(user.email || '')
      }
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold text-sm">RAG Agent</span>
          </div>
          <nav className="flex gap-1">
            <Link
              href="/chat"
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/chat'
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Chat
            </Link>
            <Link
              href="/admin"
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/admin'
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">{email[0]?.toUpperCase()}</span>
            </div>
            <span className="text-sm text-muted-foreground hidden sm:block">{email}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs">
            Sign out
          </Button>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
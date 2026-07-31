'use client'

import { useAppStore, type ViewName } from '@/store/app-store'
import { useEffect } from 'react'
import { LandingPage } from '@/components/portal/landing'
import { AppShell } from '@/components/portal/nav'

export default function Home() {
  const { isAuthenticated, isLoading } = useAppStore()

  // Auto-dismiss toasts
  const toasts = useAppStore(s => s.toasts)
  const removeToast = useAppStore(s => s.removeToast)

  useEffect(() => {
    toasts.forEach(t => {
      const timer = setTimeout(() => removeToast(t.id), 4000)
      return () => clearTimeout(timer)
    })
  }, [toasts, removeToast])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LandingPage />
  }

  return <AppShell />
}

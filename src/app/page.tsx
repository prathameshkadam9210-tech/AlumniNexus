'use client'

import { useAppStore, type ViewName } from '@/store/app-store'
import { useEffect } from 'react'
import { LandingPage } from '@/components/portal/landing'
import { AppShell } from '@/components/portal/nav'

export default function Home() {
  const { isAuthenticated, isLoading } = useAppStore()
  const currentUser = useAppStore(s => s.currentUser)
  const setCurrentUser = useAppStore(s => s.setCurrentUser)
  const addToast = useAppStore(s => s.addToast)

  // Auto-dismiss toasts
  const toasts = useAppStore(s => s.toasts)
  const removeToast = useAppStore(s => s.removeToast)

  useEffect(() => {
    toasts.forEach(t => {
      const timer = setTimeout(() => removeToast(t.id), 4000)
      return () => clearTimeout(timer)
    })
  }, [toasts, removeToast])

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return
    let cancelled = false

    const refreshAccountStatus = async () => {
      try {
        const response = await fetch(`/api/auth?action=status&id=${encodeURIComponent(currentUser.id)}`)
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to refresh account status')
        if (cancelled) return

        const latestUser = useAppStore.getState().currentUser
        if (!latestUser || latestUser.id !== data.id) return
        const statusChanged = latestUser.verificationStatus !== data.verificationStatus
        const roleChanged = latestUser.role !== data.role
        if (
          statusChanged ||
          roleChanged ||
          latestUser.isVerified !== data.isVerified ||
          latestUser.batch !== data.batch ||
          latestUser.graduationYear !== data.graduationYear
        ) {
          const updatedUser = { ...latestUser, ...data }
          setCurrentUser(updatedUser)
          const loadDataForUser = useAppStore.getState().loadDataForUser
          if (roleChanged && loadDataForUser) await loadDataForUser(updatedUser)
          if (statusChanged && data.verificationStatus === 'APPROVED') {
            addToast('Your account has been approved.', 'success')
          } else if (statusChanged && data.verificationStatus === 'REJECTED') {
            addToast('Your account verification was rejected. Please contact your department admin.', 'error')
          }
        }
      } catch (error) {
        if (!cancelled) console.error('Account status refresh error:', error)
      }
    }

    void refreshAccountStatus()
    const interval = window.setInterval(() => { void refreshAccountStatus() }, 15000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [isAuthenticated, currentUser?.id, setCurrentUser, addToast])

  if (isAuthenticated && isLoading) {
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

  const showVerificationStatus = currentUser &&
    (currentUser.role === 'STUDENT' || currentUser.role === 'ALUMNI') &&
    currentUser.verificationStatus !== 'APPROVED'

  return (
    <>
      {showVerificationStatus && (
        <div
          role="status"
          aria-live="polite"
          className={`px-4 py-3 text-center text-sm ${
            currentUser.verificationStatus === 'REJECTED'
              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
              : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
          }`}
        >
          {currentUser.verificationStatus === 'REJECTED'
            ? 'Account verification rejected. Contact your department admin for assistance.'
            : 'Account verification is pending with your department admin or main admin.'}
        </div>
      )}
      <AppShell />
    </>
  )
}

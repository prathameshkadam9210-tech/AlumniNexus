'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAppStore, type EventItem, type NotificationItem } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Bell,
  CheckCircle2,
  Info,
  AlertCircle,
  Star,
  Trophy,
  Monitor,
  Presentation,
  Video,
  Briefcase,
  CheckCheck,
  Megaphone,
} from 'lucide-react'

// ============================================================
// Helpers
// ============================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getEventBounds(event: Pick<EventItem, 'date' | 'endTime' | 'time'>) {
  const start = new Date(event.date)
  if (event.time) {
    const [hours, minutes] = event.time.split(':').map(Number)
    start.setHours(hours || 0, minutes || 0, 0, 0)
  }
  const end = event.endTime ? new Date(event.endTime) : new Date(start)
  if (!event.endTime) end.setHours(23, 59, 59, 999)
  return { start, end }
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(dateStr)
}

function EventTypeIcon({ type, className }: { type: string; className?: string }) {
  const cls = className || 'h-3 w-3'
  switch (type.toLowerCase()) {
    case 'workshop': return <Trophy className={cls} />
    case 'campus_drive': return <Briefcase className={cls} />
    case 'seminar': return <Presentation className={cls} />
    case 'webinar': return <Video className={cls} />
    default: return <Calendar className={cls} />
  }
}

function getEventTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'workshop': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'campus_drive': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'seminar': return 'bg-violet-100 text-violet-800 border-violet-200'
    case 'webinar': return 'bg-sky-100 text-sky-800 border-sky-200'
    default: return 'bg-muted text-muted-foreground'
  }
}

function NotificationIcon({ type, className }: { type: string; className?: string }) {
  const cls = className || 'h-5 w-5'
  switch (type.toUpperCase()) {
    case 'INFO': return <Info className={cls} />
    case 'SUCCESS': return <CheckCircle2 className={cls} />
    case 'REMINDER': return <Bell className={cls} />
    case 'ERROR': return <AlertCircle className={cls} />
    default: return <Bell className={cls} />
  }
}

function getNotificationColor(type: string): string {
  switch (type.toUpperCase()) {
    case 'INFO': return 'text-blue-500'
    case 'SUCCESS': return 'text-emerald-500'
    case 'REMINDER': return 'text-amber-500'
    case 'ERROR': return 'text-red-500'
    default: return 'text-muted-foreground'
  }
}

// ============================================================
// Event Card
// ============================================================

function EventCard({ event, onRegister, canRegister }: { event: EventItem; onRegister: (id: string) => void; canRegister: boolean }) {
  const typeColor = getEventTypeColor(event.type)
  const capacityPercent = event.maxAttendees ? Math.min((event.currentAttendees / event.maxAttendees) * 100, 100) : 0
  const isFull = event.maxAttendees ? event.currentAttendees >= event.maxAttendees : false
  const { end } = getEventBounds(event)
  const isPast = end.getTime() < Date.now()
  const registrationClosed = isPast || Boolean(event.registrationDeadline && new Date(event.registrationDeadline).getTime() <= Date.now())

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow">
      {event.isFeatured && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-1.5 flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-primary fill-primary" />
          <span className="text-xs font-medium text-primary">Featured Event</span>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight line-clamp-2">{event.title}</h3>
            {event.organizerName && (
              <p className="text-xs text-muted-foreground mt-1">Organized by {event.organizerName}</p>
            )}
          </div>
          <Badge variant="outline" className={`${typeColor} flex-shrink-0 gap-1 text-xs`}>
            <EventTypeIcon type={event.type} className="h-3 w-3" />
            {event.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </Badge>
        </div>
        {isPast && <Badge variant="secondary" className="mb-2">Past event</Badge>}

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>

        <div className="space-y-1.5 text-sm text-muted-foreground">
 <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.registrationDeadline && (
            <p className="mt-2 text-xs text-muted-foreground">
              Registration closes {formatDate(event.registrationDeadline)}
            </p>
          )}
          {event.time && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{event.time}{event.endTime ? ` - ${event.endTime}` : ''}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Capacity Progress */}
        {event.maxAttendees && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{event.currentAttendees} / {event.maxAttendees} registered</span>
              </div>
              <span className={isFull ? 'text-red-500 font-medium' : ''}>{isFull ? 'Full' : `${Math.round(100 - capacityPercent)}% spots left`}</span>
            </div>
            <Progress value={capacityPercent} className={`h-1.5 ${isFull ? '[&>div]:bg-red-500' : ''}`} />
          </div>
        )}

        {/* Register Button */}
        {canRegister && (
          <div className="mt-3">
            <Button
              size="sm"
              className="w-full"
              disabled={isFull || registrationClosed}
              onClick={() => onRegister(event.id)}
            >
              {isPast ? (
                <>Event completed</>
              ) : registrationClosed ? (
                <>Registration closed</>
              ) : isFull ? (
                <><Users className="h-4 w-4 mr-1" /> Event Full</>
              ) : (
                <><Plus className="h-4 w-4 mr-1" /> Register</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Featured Events Grid
// ============================================================

function FeaturedEvents({ events, onRegister, canRegister }: { events: EventItem[]; onRegister: (id: string) => void; canRegister: boolean }) {
  if (events.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-5 w-5 text-primary fill-primary" />
        <h2 className="text-lg font-semibold">Featured Events</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map(event => (
          <EventCard key={event.id} event={event} onRegister={onRegister} canRegister={canRegister} />
        ))}
      </div>
      <Separator className="mt-6" />
    </div>
  )
}

// ============================================================
// Create Event Dialog
// ============================================================

function CreateEventDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: (event: EventItem) => void }) {
  const { currentUser, addToast, setLoading } = useAppStore()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    registrationDeadline: '',
    location: '',
    type: 'WORKSHOP',
    maxAttendees: '',
    isFeatured: false,
  })

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.date.trim()) {
      addToast('Title and date are required', 'error')
      return
    }

    setCreating(true)
    setLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          organizerId: currentUser?.id,
          registrationDeadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : null,
          maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create event')
      const event = await res.json()
      onCreated(event)
      onOpenChange(false)
      setForm({ title: '', description: '', date: '', registrationDeadline: '', time: '', location: '', type: 'WORKSHOP', maxAttendees: '', isFeatured: false })
      addToast('Event created successfully', 'success')
    } catch {
      addToast('Failed to create event', 'error')
    } finally {
      setCreating(false)
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>Add a new event for the community. Fill in the details below.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="event-title">Title *</Label>
            <Input
              id="event-title"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Event title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-desc">Description</Label>
            <Textarea
              id="event-desc"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe the event, agenda, and what participants will learn..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date">Date *</Label>
              <Input
                id="event-date"
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration-deadline">Registration closes (optional)</Label>
              <Input
                id="registration-deadline"
                type="datetime-local"
                value={form.registrationDeadline}
                onChange={(event) => setForm((previous) => ({ ...previous, registrationDeadline: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-time">Time</Label>
              <Input
                id="event-time"
                type="time"
                value={form.time}
                onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              placeholder="Venue or online meeting link"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-type">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORKSHOP">Workshop</SelectItem>
                  <SelectItem value="CAMPUS_DRIVE">Campus Drive</SelectItem>
                  <SelectItem value="SEMINAR">Seminar</SelectItem>
                  <SelectItem value="WEBINAR">Webinar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-max">Max Attendees</Label>
              <Input
                id="event-max"
                type="number"
                value={form.maxAttendees}
                onChange={e => setForm(p => ({ ...p, maxAttendees: e.target.value }))}
                placeholder="e.g. 100"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={creating || !form.title.trim() || !form.date.trim()}>
            {creating ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Events View
// ============================================================

function EventsViewContent() {
  const { events, currentUser, addEvent, addToast, setLoading } = useAppStore()
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [registering, setRegistering] = useState<string | null>(null)

  const isAdminOrPlacement = currentUser?.role === 'ADMIN' || currentUser?.role === 'PLACEMENT_CELL'
  const isStudent = currentUser?.role === 'STUDENT'

  const featuredEvents = useMemo(() => events.filter((event) => {
    if (!event.isFeatured) return false
    const { start, end } = getEventBounds(event)
    const now = Date.now()
    if (dateFilter === 'past') return end.getTime() < now
    if (dateFilter === 'current') return start.getTime() <= now && end.getTime() >= now
    if (dateFilter === 'upcoming') return start.getTime() > now
    return true
  }), [events, dateFilter])
  const filteredEvents = useMemo(() => {
    let filtered = events.filter(e => !e.isFeatured)
    if (filter !== 'all') {
      filtered = events.filter(e => e.type.toLowerCase() === filter.toLowerCase())
    }
    if (dateFilter !== 'all') {
      filtered = filtered.filter((event) => {
        const { start, end } = getEventBounds(event)
        const now = Date.now()
        if (dateFilter === 'past') return end.getTime() < now
        if (dateFilter === 'current') return start.getTime() <= now && end.getTime() >= now
        return start.getTime() > now
      })
    }
    const statusRank = (event: EventItem) => getEventBounds(event).end.getTime() < Date.now() ? 1 : 0
    return filtered.sort((a, b) => {
      const rankDifference = statusRank(a) - statusRank(b)
      if (rankDifference !== 0) return rankDifference
      const dateDifference = new Date(a.date).getTime() - new Date(b.date).getTime()
      return statusRank(a) ? -dateDifference : dateDifference
    })
  }, [events, filter, dateFilter])

  const handleRegister = async (eventId: string) => {
    setRegistering(eventId)
    try {
      if (!currentUser) return
      const event = events.find(e => e.id === eventId)
      if (!event) return
      if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
        addToast('Event is full', 'error')
        return
      }
      if (event.registrationDeadline && new Date(event.registrationDeadline).getTime() <= Date.now()) {
        addToast('Registration for this event is closed.', 'error')
        return
      }
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id, eventId }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to register for event')
      if (result.requiresPayment) {
        if (!window.Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Unable to load Razorpay Checkout'))
            document.body.appendChild(script)
          })
        }
        const orderResponse = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            amount: result.amount,
            currency: result.currency,
            type: 'EVENT',
            description: `Event registration: ${event.title}`,
            referenceId: event.id,
          }),
        })
        const order = await orderResponse.json()
        if (!orderResponse.ok) throw new Error(order.error || 'Unable to create event payment')
        const Checkout = window.Razorpay
        if (!Checkout) throw new Error('Razorpay Checkout is unavailable')
        const checkout = new Checkout({
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: 'AlumniNexus',
          description: `Event registration: ${event.title}`,
          order_id: order.orderId,
          prefill: { name: currentUser.name, email: currentUser.email, contact: currentUser.phone || undefined },
          theme: { color: '#059669' },
          handler: async (paymentResult) => {
            const verificationResponse = await fetch('/api/payments', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId: order.payment.id,
                status: 'COMPLETED',
                razorpayId: paymentResult.razorpay_payment_id,
                razorpayOrderId: paymentResult.razorpay_order_id,
                razorpaySignature: paymentResult.razorpay_signature,
              }),
            })
            const verifiedPayment = await verificationResponse.json()
            if (!verificationResponse.ok) {
              addToast(verifiedPayment.error || 'Event payment verification failed', 'error')
              return
            }
            if (verifiedPayment.registrationExpired) {
              addToast('Payment verified, but event registration has closed. Contact the college about your payment.', 'error')
              return
            }
            useAppStore.getState().setEvents(useAppStore.getState().events.map((item) =>
              item.id === eventId ? { ...item, currentAttendees: item.currentAttendees + 1 } : item
            ))
            useAppStore.getState().setRegistrations([
              ...useAppStore.getState().registrations,
              { id: `payment-${verifiedPayment.id}`, userId: currentUser.id, eventId, status: 'REGISTERED', createdAt: verifiedPayment.createdAt },
            ])
            addToast('Payment verified and event registration confirmed!', 'success')
          },
          modal: { ondismiss: () => addToast('Payment window closed.', 'info') },
        })
        checkout.on('payment.failed', async (paymentFailure) => {
          await fetch('/api/payments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: order.payment.id, status: 'FAILED' }),
          }).catch(() => undefined)
          addToast(paymentFailure.error?.description || 'Event payment failed.', 'error')
        })
        checkout.open()
        return
      }
      const latestEvents = useAppStore.getState().events
      useAppStore.getState().setEvents(latestEvents.map((item) =>
        item.id === eventId ? { ...item, currentAttendees: item.currentAttendees + 1 } : item
      ))
      useAppStore.getState().setRegistrations([
        ...useAppStore.getState().registrations,
        { id: result.id, userId: result.userId, eventId: result.eventId, status: result.status, createdAt: result.createdAt },
      ])
      addToast('Registered successfully!', 'success')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to register', 'error')
    } finally {
      setRegistering(null)
    }
  }

  const handleEventCreated = (event: EventItem) => {
    addEvent(event)
  }

  const eventTypes = [
    { value: 'all', label: 'All' },
    { value: 'workshop', label: 'Workshops' },
    { value: 'campus_drive', label: 'Campus Drives' },
    { value: 'seminar', label: 'Seminars' },
    { value: 'webinar', label: 'Webinars' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground text-sm mt-1">Discover workshops, campus drives, seminars, and more</p>
        </div>
        {isAdminOrPlacement && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Event
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Label htmlFor="event-time-filter">Show</Label>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger id="event-time-filter" className="w-48">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Upcoming and past</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="current">Current</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="mb-4">
          {eventTypes.map(type => (
            <TabsTrigger key={type.value} value={type.value} className="text-xs sm:text-sm">
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filter} className="mt-0">
          {/* Featured Events */}
          {filter === 'all' && featuredEvents.length > 0 && (
            <FeaturedEvents events={featuredEvents} onRegister={handleRegister} canRegister={isStudent} />
          )}

          {/* All Events Grid */}
          {filteredEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={handleRegister}
                  canRegister={isStudent}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No events found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {filter === 'all'
                  ? 'There are no upcoming events right now. Check back later or create one if you have admin access.'
                  : `No ${eventTypes.find(t => t.value === filter)?.label.toLowerCase() || ''} events available at the moment.`}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Event Dialog */}
      {isAdminOrPlacement && (
        <CreateEventDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handleEventCreated}
        />
      )}
    </div>
  )
}

// ============================================================
// Notification Card
// ============================================================

function NotificationCard({ notification, onClick }: { notification: NotificationItem; onClick: (id: string) => void }) {
  const iconColor = getNotificationColor(notification.type)

  return (
    <button
      onClick={() => onClick(notification.id)}
      className={`w-full text-left transition-colors rounded-lg border p-4 hover:bg-accent/50 ${
        !notification.isRead ? 'bg-primary/5 border-primary/20' : ''
      }`}
      aria-label={`Mark notification as read: ${notification.title}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${iconColor}`}>
          <NotificationIcon type={notification.type} className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm font-medium leading-tight ${!notification.isRead ? 'font-semibold' : ''}`}>
              {notification.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{getTimeAgo(notification.createdAt)}</span>
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
        </div>
      </div>
    </button>
  )
}

// ============================================================
// Notifications View
// ============================================================

function NotificationsViewContent() {
  const { currentUser, notifications, markNotificationRead, addToast, setLoading } = useAppStore()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [markingAll, setMarkingAll] = useState(false)

  const filteredNotifications = useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    if (filter === 'unread') {
      return sorted.filter(n => !n.isRead)
    }
    return sorted
  }, [notifications, filter])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id)
    if (!notif || notif.isRead) return

    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, userId: currentUser?.id, isRead: true }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Unable to mark notification as read')
      markNotificationRead(id)
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to mark notification as read', 'error')
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    setLoading(true)
    try {
      const unread = notifications.filter(n => !n.isRead)
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id, isRead: true }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to mark notifications as read')
      unread.forEach((notification) => markNotificationRead(notification.id))
      addToast('All notifications marked as read', 'success')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to mark notifications as read', 'error')
    } finally {
      setMarkingAll(false)
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You are all caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-1" />
            )}
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={v => setFilter(v as 'all' | 'unread')}>
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="text-sm">
            All
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">{notifications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-sm">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">{unreadCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-0">
          <ScrollArea className="max-h-[calc(100vh-16rem)]">
            <div className="space-y-2">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map(notif => (
                  <NotificationCard key={notif.id} notification={notif} onClick={handleMarkRead} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bell className="h-16 w-16 text-muted-foreground/20 mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No notifications yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {filter === 'unread'
                      ? 'You have no unread notifications. Everything is up to date!'
                      : 'Notifications about events, applications, and updates will appear here.'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// Main Export
// ============================================================

interface EventsViewProps {
  view: 'events' | 'notifications'
}

export function EventsView({ view }: EventsViewProps) {
  const { isLoading } = useAppStore()

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'notifications') {
    return <NotificationsViewContent />
  }

  return <EventsViewContent />
}

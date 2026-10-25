'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAppStore, type User, type Mentorship as MentorshipType } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Check,
  ChevronsUpDown,
  CalendarDays, CalendarPlus,
  Clock,
  MapPin,
  Briefcase,
  GraduationCap,
  Plus,
  CheckCircle2,
  XCircle,
  HourglassIcon,
  Video,
  MessageSquare,
  Users,
  ShieldCheck,
  Building2,
  ArrowLeft,
  UserPlus,
  CalendarClock,
  BookOpen,
  Filter,
} from 'lucide-react'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
]

const DURATIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function statusColor(status: string) {
  switch (status.toUpperCase()) {
    case 'ACCEPTED':
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400'
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400'
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

function statusIcon(status: string) {
  switch (status.toUpperCase()) {
    case 'ACCEPTED':
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    case 'REJECTED':
    case 'CANCELLED':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <HourglassIcon className="h-4 w-4 text-amber-500" />
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Student Mentorship View ───────────────────────────────────────────────────

function StudentMentorshipView() {
  const { mentorships, currentUser, addMentorship, addToast, setLoading, setCurrentView } = useAppStore()
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [alumniList, setAlumniList] = useState<User[]>([])
  const [mentorPickerOpen, setMentorPickerOpen] = useState(false)
  const [mentorBatch, setMentorBatch] = useState('ALL')
  const [bookingForm, setBookingForm] = useState({
    mentorId: '',
    date: '',
    timeSlot: '',
    duration: '',
    topic: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch alumni list for booking
  useEffect(() => {
    async function fetchAlumni() {
      try {
        const res = await fetch('/api/auth?action=alumni')
        if (res.ok) {
          const data = await res.json()
          setAlumniList(data)
        }
      } catch {
        // Silent fail
      }
    }
    fetchAlumni()
  }, [])

  const myMentorships = mentorships.filter((m) => m.menteeId === currentUser?.id)
  const mentorBatches = useMemo(
    () => Array.from(new Set(alumniList.map((alumni) => alumni.batch).filter((batch): batch is string => Boolean(batch?.trim())))).sort(),
    [alumniList]
  )
  const selectableMentors = useMemo(() => {
    return alumniList.filter((alumni) =>
      mentorBatch === 'ALL' || alumni.batch === mentorBatch
    )
  }, [alumniList, mentorBatch])
  const selectedMentor = alumniList.find((alumni) => alumni.id === bookingForm.mentorId)

  const upcoming = myMentorships.filter(
    (m) => m.status === 'ACCEPTED' || m.status === 'PENDING'
  )
  const past = myMentorships.filter(
    (m) => m.status === 'COMPLETED' || m.status === 'REJECTED' || m.status === 'CANCELLED'
  )

  const updateField = (field: string, value: string) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateBooking = () => {
    const errs: Record<string, string> = {}
    if (!bookingForm.mentorId) errs.mentorId = 'Please select a mentor'
    if (!bookingForm.date) errs.date = 'Please pick a date'
    if (!bookingForm.timeSlot) errs.timeSlot = 'Please select a time slot'
    if (!bookingForm.duration) errs.duration = 'Please select a duration'
    if (!bookingForm.topic.trim()) errs.topic = 'Please enter a topic'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleBookSession = async () => {
    if (!validateBooking() || !currentUser) return

    setLoading(true)
    try {
      const res = await fetch('/api/mentorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: bookingForm.mentorId,
          menteeId: currentUser.id,
          date: bookingForm.date,
          timeSlot: bookingForm.timeSlot,
          duration: Number(bookingForm.duration),
          topic: bookingForm.topic.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        addToast(err.error || 'Failed to book session.', 'error')
        return
      }

      const newMentorship = await res.json()
      addMentorship(newMentorship)
      setShowBookingDialog(false)
      setBookingForm({ mentorId: '', date: '', timeSlot: '', duration: '', topic: '' })
      addToast('Mentorship session booked successfully!', 'success')
    } catch {
      addToast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const renderSessionCard = (session: MentorshipType) => (
    <Card key={session.id} className="transition-all hover:shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {statusIcon(session.status)}
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{session.topic || 'Mentorship Session'}</h3>
              <p className="text-sm text-muted-foreground">
                with {session.mentorName || 'Alumni Mentor'}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(session.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {session.timeSlot}
                </span>
                <span className="flex items-center gap-1">
                  <HourglassIcon className="h-3 w-3" />
                  {session.duration} min
                </span>
              </div>
              {session.meetingLink && (
                <a
                  href={session.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Video className="h-3.5 w-3.5" />
                  Join Meeting
                </a>
              )}
            </div>
          </div>
          <Badge className={statusColor(session.status)}>{session.status}</Badge>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentorship</h1>
          <p className="text-sm text-muted-foreground">
            Connect with alumni mentors for guidance and career advice.
          </p>
        </div>
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Book a Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Book a Mentorship Session</DialogTitle>
              <DialogDescription>
                Choose a mentor, pick a time, and describe what you would like to discuss.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Mentor Select */}
              <div className="space-y-2">
                <Label>Select Mentor *</Label>
                <Popover open={mentorPickerOpen} onOpenChange={setMentorPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={mentorPickerOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {selectedMentor
                          ? `${selectedMentor.name} — ${selectedMentor.batch || 'Batch not provided'}`
                          : 'Search and choose an alumni mentor'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search alumni by name..." />
                      <CommandList>
                        <CommandEmpty>No mentors match your search.</CommandEmpty>
                        <CommandGroup>
                          {selectableMentors.map((alumni) => (
                            <CommandItem
                              key={alumni.id}
                              value={`${alumni.name} ${alumni.batch || ''} ${alumni.designation || ''} ${alumni.company || ''} ${alumni.id}`}
                              onSelect={() => {
                                updateField('mentorId', alumni.id)
                                setMentorPickerOpen(false)
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  bookingForm.mentorId === alumni.id ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              <span className="truncate">
                                {alumni.name} — {alumni.batch || 'Batch not provided'} — {alumni.designation || alumni.company || 'Alumni'}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Select value={mentorBatch} onValueChange={setMentorBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by passout batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All passout batches</SelectItem>
                    {mentorBatches.map((batch) => <SelectItem key={batch} value={batch}>{batch}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.mentorId && <p className="text-xs text-destructive">{errors.mentorId}</p>}
              </div>

              {/* Date & Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="session-date">Date *</Label>
                  <Input
                    id="session-date"
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Time Slot *</Label>
                  <Select value={bookingForm.timeSlot} onValueChange={(v) => updateField('timeSlot', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.timeSlot && <p className="text-xs text-destructive">{errors.timeSlot}</p>}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label>Duration *</Label>
                <Select value={bookingForm.duration} onValueChange={(v) => updateField('duration', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value.toString()}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.duration && <p className="text-xs text-destructive">{errors.duration}</p>}
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <Label htmlFor="session-topic">Topic / Discussion Points *</Label>
                <Textarea
                  id="session-topic"
                  placeholder="e.g. Career advice for switching from engineering to product management..."
                  rows={3}
                  value={bookingForm.topic}
                  onChange={(e) => updateField('topic', e.target.value)}
                />
                {errors.topic && <p className="text-xs text-destructive">{errors.topic}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBookSession} className="gap-2">
                <CalendarPlus className="h-4 w-4" />
                Book Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs: Upcoming / Past */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Upcoming
            {upcoming.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {upcoming.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Past
            {past.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {past.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <CalendarClock className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="mt-3 text-sm font-semibold">No upcoming sessions</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Book a mentorship session to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">{upcoming.map(renderSessionCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="mt-3 text-sm font-semibold">No past sessions</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your completed and past mentorship sessions will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">{past.map(renderSessionCard)}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Alumni Mentorship View ────────────────────────────────────────────────────

function AlumniMentorshipView() {
  const { mentorships, currentUser, updateMentorship, addToast, setLoading } = useAppStore()

  const myMentorships = mentorships.filter((m) => m.mentorId === currentUser?.id)

  const pending = myMentorships.filter((m) => m.status === 'PENDING')
  const active = myMentorships.filter(
    (m) => m.status === 'ACCEPTED' || m.status === 'COMPLETED'
  )
  const others = myMentorships.filter(
    (m) => m.status === 'REJECTED' || m.status === 'CANCELLED'
  )

  const handleStatusUpdate = async (mentorshipId: string, status: string) => {
    setLoading(true)
    try {
      const body: Record<string, unknown> = { mentorshipId, status }
      const res = await fetch('/api/mentorships', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        addToast(err.error || 'Failed to update session.', 'error')
        return
      }

      updateMentorship(mentorshipId, { status })
      addToast(`Session ${status.toLowerCase()}.`, 'success')
    } catch {
      addToast('Something went wrong.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const renderRequestCard = (session: MentorshipType) => (
    <Card key={session.id} className="transition-all hover:shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(session.menteeName || '?')}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{session.menteeName || 'Student'}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(session.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {session.timeSlot}
                </span>
                <span className="flex items-center gap-1">
                  <HourglassIcon className="h-3 w-3" />
                  {session.duration} min
                </span>
              </div>
              {session.topic && (
                <div className="mt-2 rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    Topic
                  </p>
                  <p className="text-sm">{session.topic}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge className={statusColor(session.status)}>{session.status}</Badge>
            {session.status === 'PENDING' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleStatusUpdate(session.id, 'ACCEPTED')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={() => handleStatusUpdate(session.id, 'REJECTED')}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentorship Requests</h1>
          <p className="text-sm text-muted-foreground">
            Manage mentorship sessions and help students with career guidance.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white"
        >
          <MessageSquare className="h-4 w-4" />
          Offer Mentorship Slot
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <HourglassIcon className="h-3.5 w-3.5" />
            Pending
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active / Completed
            {active.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {active.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="other" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            Rejected / Cancelled
            {others.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {others.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <HourglassIcon className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="mt-3 text-sm font-semibold">No pending requests</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  New mentorship requests will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">{pending.map(renderRequestCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {active.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="mt-3 text-sm font-semibold">No active sessions</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Accepted and completed sessions will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">{active.map(renderRequestCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="other" className="mt-4">
          {others.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <XCircle className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="mt-3 text-sm font-semibold">No rejected sessions</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Rejected or cancelled sessions will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">{others.map(renderRequestCard)}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Read-Only Mentorship View (Admin / Placement Cell) ────────────────────────

function ReadOnlyMentorshipView() {
  const { mentorships } = useAppStore()

  const stats = useMemo(() => {
    const total = mentorships.length
    const pending = mentorships.filter((m) => m.status === 'PENDING').length
    const accepted = mentorships.filter((m) => m.status === 'ACCEPTED').length
    const completed = mentorships.filter((m) => m.status === 'COMPLETED').length
    const rejected = mentorships.filter((m) => m.status === 'REJECTED').length
    return { total, pending, accepted, completed, rejected }
  }, [mentorships])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mentorship Overview</h1>
        <p className="text-sm text-muted-foreground">
          Summary of all mentorship sessions across the platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.accepted}</p>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Session List */}
      {mentorships.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No mentorship sessions yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Mentorship sessions will appear here as students and alumni connect.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mentorships.map((session) => (
            <Card key={session.id} className="transition-all hover:shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{session.topic || 'Mentorship Session'}</h3>
                      <Badge className={statusColor(session.status)}>{session.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.menteeName || 'Student'} &rarr; {session.mentorName || 'Alumni'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(session.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.timeSlot}
                      </span>
                      <span className="flex items-center gap-1">
                        <HourglassIcon className="h-3 w-3" />
                        {session.duration} min
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Alumni Directory ──────────────────────────────────────────────────────────

function AlumniDirectory() {
  const { currentUser, setCurrentView } = useAppStore()
  const [alumniList, setAlumniList] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [batchFilter, setBatchFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAlumni() {
      setLoading(true)
      try {
        const res = await fetch('/api/auth?action=alumni')
        if (res.ok) {
          const data = await res.json()
          setAlumniList(data)
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }
    fetchAlumni()
  }, [])

  const filteredAlumni = useMemo(() => {
    const q = search.toLowerCase()
    return alumniList.filter(
      (a) =>
        (batchFilter === 'ALL' || a.batch === batchFilter) &&
        (!q.trim() ||
          a.name.toLowerCase().includes(q) ||
          a.designation?.toLowerCase().includes(q) ||
          a.company?.toLowerCase().includes(q) ||
          a.department?.toLowerCase().includes(q) ||
          a.skills?.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q))
    )
  }, [alumniList, search, batchFilter])

  const availableBatches = useMemo(
    () => Array.from(new Set(alumniList.map((alumni) => alumni.batch).filter((batch): batch is string => Boolean(batch?.trim())))).sort(),
    [alumniList]
  )

  const handleRequestMentorship = (alumni: User) => {
    setCurrentView('mentorship')
    // The student mentorship view has its own booking dialog
    // The user can select this alumni from the mentor dropdown
  }

  const isStudent = currentUser?.role === 'STUDENT'

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alumni Directory</h1>
        <p className="text-sm text-muted-foreground">
          Browse and connect with verified alumni across industries.
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, skills, or location..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by passout batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All passout batches</SelectItem>
            {availableBatches.map((batch) => (
              <SelectItem key={batch} value={batch}>{batch}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredAlumni.length} {filteredAlumni.length === 1 ? 'alumnus' : 'alumni'}
      </p>

      {/* Alumni Grid */}
      {filteredAlumni.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No alumni found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAlumni.map((alumni) => (
            <Card
              key={alumni.id}
              className="transition-all hover:shadow-md hover:border-primary/30"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="text-lg">
                        {getInitials(alumni.name)}
                      </AvatarFallback>
                    </Avatar>
                    {alumni.isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <ShieldCheck className="h-3 w-3" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{alumni.name}</h3>
                      {alumni.isVerified && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px] px-1.5 py-0">
                          Verified
                        </Badge>
                      )}
                    </div>

                    {alumni.designation && (
                      <p className="text-sm text-muted-foreground truncate">
                        {alumni.designation}
                      </p>
                    )}

                    {alumni.company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        {alumni.company}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {alumni.batch && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          Batch {alumni.batch}
                        </span>
                      )}
                      {alumni.department && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {alumni.department}
                        </span>
                      )}
                      {alumni.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {alumni.location}
                        </span>
                      )}
                    </div>

                    {/* Skills */}
                    {alumni.skills && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {alumni.skills
                          .split(',')
                          .slice(0, 5)
                          .map((skill) => (
                            <Badge
                              key={skill.trim()}
                              variant="outline"
                              className="text-[11px] font-normal px-2 py-0"
                            >
                              {skill.trim()}
                            </Badge>
                          ))}
                        {alumni.skills.split(',').length > 5 && (
                          <Badge variant="outline" className="text-[11px] font-normal px-2 py-0">
                            +{alumni.skills.split(',').length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Action */}
                    {isStudent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 gap-1.5"
                        onClick={() => handleRequestMentorship(alumni)}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Request Mentorship
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Export ────────────────────────────────────────────────────────────────

export function MentorshipView() {
  const { currentView, isLoading, currentUser } = useAppStore()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (currentView === 'alumni-directory') {
    return <AlumniDirectory />
  }

  // Mentorship view based on role
  switch (currentUser?.role) {
    case 'STUDENT':
      return <StudentMentorshipView />
    case 'ALUMNI':
      return <AlumniMentorshipView />
    default:
      return <ReadOnlyMentorshipView />
  }
}

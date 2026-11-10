'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAppStore, type EventItem, type User } from '@/store/app-store'
import { DEPARTMENTS, getDepartmentChartLabel, normalizeDepartment } from '@/lib/departments'
import { getGraduationYearOptions, getStartYearOptions, getStudyYearLabel, matchesGraduationYear, matchesStartYear, STUDY_YEAR_LABELS } from '@/lib/batches'
import { RoleAnalyticsChart } from '@/components/portal/role-analytics-chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Briefcase,
  Users,
  Calendar,
  Brain,
  GraduationCap,
  FileText,
  Search,
  UserPlus,
  BarChart3,
  Bell,
  ArrowRight,
  Clock,
  MapPin,
  Building,
  Mail,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Shield,
  ClipboardCheck,
  Lightbulb,
} from 'lucide-react'

// --- Stat Card ---
function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl md:text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Quick Action Card ---
function QuickActionCard({ icon: Icon, title, description, onClick, color }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; onClick: () => void; color: string }) {
  return (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 md:p-5 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Notification Item ---
function NotificationRow({ title, message, time, isRead }: { title: string; message: string; time: string; isRead: boolean }) {
  return (
    <div className={`flex items-start gap-3 py-3 ${!isRead ? 'bg-emerald-50/50 dark:bg-emerald-950/20 -mx-2 px-2 rounded-lg' : ''}`}>
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!isRead ? 'bg-emerald-500' : 'bg-transparent'}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{message}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{time}</span>
    </div>
  )
}

// --- Utility ---
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface PublicPlacement {
  id: string
  company: string
  title: string
  packageAmount: number | null
  packageCurrency: string
  placementDate: string
  student: Pick<User, 'name' | 'avatar' | 'department'>
}

function CommunityHighlights() {
  const currentUser = useAppStore((state) => state.currentUser)
  const events = useAppStore((state) => state.events)
  const addToast = useAppStore((state) => state.addToast)
  const [placements, setPlacements] = useState<PublicPlacement[]>([])
  const upcomingEvents = useMemo(() => events
    .filter((event: EventItem) => {
      const end = new Date(event.endTime || event.date)
      if (!event.endTime && event.time) {
        const [hours, minutes] = event.time.split(':').map(Number)
        end.setHours(hours || 0, minutes || 0, 0, 0)
      } else if (!event.endTime) {
        end.setHours(23, 59, 59, 999)
      }
      return end.getTime() >= Date.now()
    })
    .slice(0, 3), [events])

  useEffect(() => {
    if (!currentUser) return
    let active = true
    fetch(`/api/placements?actorId=${encodeURIComponent(currentUser.id)}&public=true`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load placement highlights')
        if (active) setPlacements(Array.isArray(data) ? data : [])
      })
      .catch((error: unknown) => {
        if (active) addToast(error instanceof Error ? error.message : 'Unable to load placement highlights', 'error')
      })
    return () => { active = false }
  }, [addToast, currentUser])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Upcoming college events</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {upcomingEvents.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming events.</p> :
            upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.location || event.type}</p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{formatDate(event.date)}</span>
              </div>
            ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Recently placed students</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {placements.length === 0 ? <p className="text-sm text-muted-foreground">No placement highlights available yet.</p> :
            placements.map((record) => (
              <div key={record.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={record.student.avatar || undefined} alt={record.student.name} />
                  <AvatarFallback>{record.student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{record.student.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{record.student.department || 'Department not listed'} · {record.company} · {record.title}</p>
                </div>
                {record.packageAmount != null && <span className="shrink-0 text-sm font-medium">{record.packageCurrency} {record.packageAmount.toLocaleString('en-IN')}</span>}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}

// --- Student Dashboard ---
function StudentDashboard() {
  const currentUser = useAppStore((s) => s.currentUser)!
  const analytics = useAppStore((s) => s.analytics)
  const jobs = useAppStore((s) => s.jobs)
  const events = useAppStore((s) => s.events)
  const notifications = useAppStore((s) => s.notifications)
  const applications = useAppStore((s) => s.applications)
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  const totalUsers = analytics.find((a) => a.metric === 'total_users')?.value ?? 0
  const openJobs = analytics.find((a) => a.metric === 'open_jobs')?.value ?? jobs.filter((j) => j.status === 'OPEN').length
  const activeMentorships = analytics.find((a) => a.metric === 'active_mentorships')?.value ?? 0
  const totalEvents = analytics.find((a) => a.metric === 'total_events')?.value ?? events.length

  const recentJobs = jobs.slice(0, 3)
  const recentEvents = events.slice(0, 3)
  const recentNotifs = notifications.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {currentUser.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening in your career journey today.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers || '-'} color="bg-emerald-500" />
        <StatCard icon={Briefcase} label="Open Jobs" value={openJobs || '-'} color="bg-teal-500" />
        <StatCard icon={Brain} label="Mentorships" value={activeMentorships || '-'} color="bg-cyan-500" />
        <StatCard icon={Calendar} label="Events" value={totalEvents || '-'} color="bg-emerald-600" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard icon={Briefcase} title="Apply to Jobs" description="Browse and apply to open positions" onClick={() => setCurrentView('jobs')} color="bg-emerald-500" />
          <QuickActionCard icon={Users} title="Book a Mentor" description="Schedule a session with an alumni mentor" onClick={() => setCurrentView('mentorship')} color="bg-teal-500" />
          <QuickActionCard icon={GraduationCap} title="Build Resume" description="Create a professional resume with AI" onClick={() => setCurrentView('resume-builder')} color="bg-cyan-500" />
          <QuickActionCard icon={Brain} title="AI Chat" description="Get career advice from your AI assistant" onClick={() => setCurrentView('ai-assistant')} color="bg-emerald-600" />
        </div>
      </div>

      {/* Two-column: Recent Jobs + Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Jobs</CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-500" onClick={() => setCurrentView('jobs')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No jobs posted yet.</p>
            ) : (
              <div className="space-y-1">
                {recentJobs.map((job) => {
                  const alreadyApplied = applications.some((a) => a.jobId === job.id)
                  return (
                    <div key={job.id} className="flex items-start gap-3 py-3 border-b last:border-0">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <Building className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{job.company} &middot; {job.location}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{job.type}</Badge>
                          {alreadyApplied && <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-0">Applied</Badge>}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{formatRelativeTime(job.createdAt)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-500" onClick={() => setCurrentView('events')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events.</p>
            ) : (
              <div className="space-y-1">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 py-3 border-b last:border-0">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(event.date)}</span>
                        {event.time && <span>&middot; {event.time}</span>}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      {recentNotifs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Notifications</CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-500" onClick={() => setCurrentView('notifications')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentNotifs.map((notif) => (
              <NotificationRow
                key={notif.id}
                title={notif.title}
                message={notif.message}
                time={formatRelativeTime(notif.createdAt)}
                isRead={notif.isRead}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// --- Alumni Dashboard ---
function AlumniDashboard() {
  const currentUser = useAppStore((s) => s.currentUser)!
  const analytics = useAppStore((s) => s.analytics)
  const jobs = useAppStore((s) => s.jobs)
  const events = useAppStore((s) => s.events)
  const mentorships = useAppStore((s) => s.mentorships)
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  const totalUsers = analytics.find((a) => a.metric === 'total_users')?.value ?? 0
  const openJobs = analytics.find((a) => a.metric === 'open_jobs')?.value ?? jobs.length
  const activeMentorships = analytics.find((a) => a.metric === 'active_mentorships')?.value ?? 0
  const totalEvents = analytics.find((a) => a.metric === 'total_events')?.value ?? events.length

  const pendingRequests = mentorships.filter((m) => m.status === 'PENDING' && m.mentorId === currentUser.id)
  const recentEvents = events.slice(0, 3)
  const mentorshipAnalytics = ['PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'].map((status) => ({
    label: status[0] + status.slice(1).toLowerCase(),
    value: mentorships.filter((item) => item.mentorId === currentUser.id && item.status === status).length,
  }))

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {currentUser.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground mt-1">Thank you for being part of the alumni community.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers || '-'} color="bg-emerald-500" />
        <StatCard icon={Briefcase} label="Open Jobs" value={openJobs || '-'} color="bg-teal-500" />
        <StatCard icon={Brain} label="Mentorships" value={activeMentorships || '-'} color="bg-cyan-500" />
        <StatCard icon={Calendar} label="Events" value={totalEvents || '-'} color="bg-emerald-600" />
      </div>

      <RoleAnalyticsChart title="My mentorship activity" data={mentorshipAnalytics} color="#0891b2" />

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickActionCard icon={Users} title="Offer Mentorship" description="Help students with career guidance" onClick={() => setCurrentView('mentorship')} color="bg-emerald-500" />
          <QuickActionCard icon={UserPlus} title="Post a Job" description="Share opportunities from your company" onClick={() => setCurrentView('post-job')} color="bg-teal-500" />
          <QuickActionCard icon={MessageSquare} title="Share Experience" description="Write about your career journey" onClick={() => setCurrentView('alumni-directory')} color="bg-cyan-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Mentorship Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Mentorship Requests</CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-500" onClick={() => setCurrentView('mentorship')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending mentorship requests.</p>
            ) : (
              <div className="space-y-1">
                {pendingRequests.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                        {(m.menteeName || '??').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.menteeName || 'Student'}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.topic || 'General mentoring'} &middot; {formatDate(m.date)}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-500" onClick={() => setCurrentView('events')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events.</p>
            ) : (
              <div className="space-y-1">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 py-3 border-b last:border-0">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.date)}{event.time ? ` at ${event.time}` : ''}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">{event.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// --- Recruiter Dashboard ---
function RecruiterDashboard() {
  const currentUser = useAppStore((s) => s.currentUser)!
  const jobs = useAppStore((s) => s.jobs)
  const setCurrentView = useAppStore((s) => s.setCurrentView)
  const addToast = useAppStore((s) => s.addToast)
  const [placements, setPlacements] = useState<Array<{
    id: string
    company: string
    title: string
    packageAmount: number | null
    packageCurrency: string
    status: string
    student: { id: string; name: string; department: string | null; batch: string | null; graduationYear: number | null }
  }>>([])
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loadingPlacements, setLoadingPlacements] = useState(true)

  useEffect(() => {
    let active = true
    fetch(`/api/placements?actorId=${encodeURIComponent(currentUser.id)}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load company placement reports')
        if (active) setPlacements(Array.isArray(data) ? data : [])
      })
      .catch((error: unknown) => {
        if (active) addToast(error instanceof Error ? error.message : 'Unable to load company placement reports', 'error')
      })
      .finally(() => { if (active) setLoadingPlacements(false) })
    return () => { active = false }
  }, [addToast, currentUser.id])

  const companyName = currentUser.company || currentUser.name
  const openJobs = jobs.filter((j) => j.status === 'OPEN').length
  const departments = Array.from(new Set(placements
    .map((record) => normalizeDepartment(record.student.department) || '')
    .filter(Boolean))).sort()
  const batches = Array.from(new Set(placements.flatMap((record) => [
    record.student.batch,
    record.student.graduationYear?.toString(),
  ]).filter((value): value is string => !!value))).sort()
  const roles = Array.from(new Set(placements.map((record) => record.title.trim()).filter(Boolean))).sort()
  const filteredPlacements = placements.filter((record) =>
    (!departmentFilter || normalizeDepartment(record.student.department) === departmentFilter) &&
    (!batchFilter || record.student.graduationYear?.toString() === batchFilter || record.student.batch === batchFilter) &&
    (!roleFilter || record.title === roleFilter),
  )
  const outcomeRecords = filteredPlacements.filter((record) => record.status === 'SELECTED' || record.status === 'PLACED')
  const selectedCount = new Set(filteredPlacements.filter((record) => record.status === 'SELECTED').map((record) => record.student.id)).size
  const placedCount = new Set(filteredPlacements.filter((record) => record.status === 'PLACED').map((record) => record.student.id)).size
  const countStudentsBy = (getLabel: (record: (typeof placements)[number]) => string) => {
    const studentsByLabel = new Map<string, Set<string>>()
    for (const record of outcomeRecords) {
      const label = getLabel(record)
      const students = studentsByLabel.get(label) || new Set<string>()
      students.add(record.student.id)
      studentsByLabel.set(label, students)
    }
    return Array.from(studentsByLabel, ([label, students]) => ({ label, value: students.size }))
  }
  const departmentStatsByName = countStudentsBy((record) =>
    normalizeDepartment(record.student.department) || 'Unspecified',
  )
  const departmentStats = departmentStatsByName.map((item) => ({
    ...item,
    label: getDepartmentChartLabel(item.label),
  }))
  const batchStats = countStudentsBy((record) =>
    record.student.batch || record.student.graduationYear?.toString() || 'Batch not listed',
  )
  const roleStats = countStudentsBy((record) => record.title || 'Role not listed')

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Welcome, {companyName}!</h1>
        <p className="text-muted-foreground mt-1">Share opportunities with the placement cell and review your company&apos;s placement outcomes.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Briefcase} label="Open opportunities" value={openJobs} color="bg-teal-500" />
        <StatCard icon={GraduationCap} label="Selected for your company" value={selectedCount} color="bg-amber-500" />
        <StatCard icon={GraduationCap} label="Placed by your company" value={placedCount} color="bg-emerald-500" />
        <StatCard icon={Users} label="Departments represented" value={departmentStats.length} color="bg-cyan-500" />
        <StatCard icon={Calendar} label="Batches represented" value={batchStats.length} color="bg-emerald-600" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuickActionCard icon={MessageSquare} title="Share Opportunity" description="Send a job or internship lead to the placement cell for review" onClick={() => setCurrentView('opportunities')} color="bg-violet-500" />
          <QuickActionCard icon={ClipboardCheck} title="Placement Analysis" description="Review students placed by department and batch" onClick={() => document.getElementById('recruiter-placement-analysis')?.scrollIntoView({ behavior: 'smooth' })} color="bg-cyan-500" />
        </div>
      </div>

      <div id="recruiter-placement-analysis" className="space-y-4">
        <h2 className="text-lg font-semibold">Company placement analysis</h2>
        <div className="flex flex-wrap gap-3">
          <select aria-label="Filter by department" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">All departments / branches</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
          <select aria-label="Filter by batch or graduation year" value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">All batches / graduation years</option>{batches.map((batch) => <option key={batch} value={batch}>{batch}</option>)}
          </select>
          <select aria-label="Filter by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">All roles</option>{roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
        {loadingPlacements ? <p className="text-sm text-muted-foreground">Loading placement analysis...</p> :
          <div className="grid gap-6 lg:grid-cols-2">
            <RoleAnalyticsChart title="Selected / placed students by department" data={departmentStats} color="#0d9488" />
            <RoleAnalyticsChart title="Selected / placed students by batch" data={batchStats} color="#4f46e5" />
            <RoleAnalyticsChart title="Selected / placed students by role" data={roleStats} color="#7c3aed" />
          </div>}
        <Card>
          <CardHeader><CardTitle className="text-base">Placement records</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {filteredPlacements.length === 0 ? <p className="text-sm text-muted-foreground">No placement records match these filters.</p> :
              filteredPlacements.map((record) => (
                <div key={record.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0">
                  <div><p className="font-medium">{record.student.name} · {record.title}</p><p className="text-sm text-muted-foreground">{record.student.department || 'Department not listed'} · {record.student.graduationYear || record.student.batch || 'Batch not listed'}</p></div>
                  <div className="text-right"><Badge variant="outline">{record.status}</Badge>{record.packageAmount != null && <p className="mt-1 text-sm">{record.packageCurrency} {record.packageAmount.toLocaleString('en-IN')}</p>}</div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// --- Admin / Placement Cell Dashboard ---
function AdminDashboard() {
  const currentUser = useAppStore((s) => s.currentUser)!
  const users = useAppStore((s) => s.users)
  const analytics = useAppStore((s) => s.analytics)
  const jobs = useAppStore((s) => s.jobs)
  const applications = useAppStore((s) => s.applications)
  const events = useAppStore((s) => s.events)
  const setCurrentView = useAppStore((s) => s.setCurrentView)
  const setAnalytics = useAppStore((s) => s.setAnalytics)
  const addToast = useAppStore((s) => s.addToast)
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [startYearFilter, setStartYearFilter] = useState('')
  const [graduationYearFilter, setGraduationYearFilter] = useState('')
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const isMainAdmin = currentUser.role === 'ADMIN' && currentUser.department === 'Administration'
  const startYears = getStartYearOptions(users)
  const graduationYears = getGraduationYearOptions(users)

  const totalUsers = analytics.find((a) => a.metric === 'total_users')?.value ?? users.length
  const totalJobs = analytics.find((a) => a.metric === 'open_jobs')?.value ?? jobs.length
  const totalApps = analytics.find((a) => a.metric === 'total_applications')?.value ?? applications.length
  const totalEvents = analytics.find((a) => a.metric === 'total_events')?.value ?? events.length

  const recentUsers = users.filter((user) =>
    (!departmentFilter || normalizeDepartment(user.department) === normalizeDepartment(departmentFilter)) &&
    (!startYearFilter || matchesStartYear(user, Number(startYearFilter))) &&
    (!graduationYearFilter || matchesGraduationYear(user, Number(graduationYearFilter))),
  ).slice(0, 5)
  const distributionUsers = users.filter((user) =>
    (!departmentFilter || normalizeDepartment(user.department) === normalizeDepartment(departmentFilter)) &&
    (!startYearFilter || matchesStartYear(user, Number(startYearFilter))) &&
    (!graduationYearFilter || matchesGraduationYear(user, Number(graduationYearFilter))),
  )
  const studyYearCounts = new Map<string, number>()
  const roleCounts = new Map<string, number>()
  for (const user of distributionUsers) {
    const studyYear = getStudyYearLabel(user)
    if (studyYear) studyYearCounts.set(studyYear, (studyYearCounts.get(studyYear) || 0) + 1)
    roleCounts.set(user.role, (roleCounts.get(user.role) || 0) + 1)
  }
  const studyYearData = STUDY_YEAR_LABELS
    .filter((label) => studyYearCounts.has(label))
    .map((label) => ({ label, value: studyYearCounts.get(label) || 0 }))
  const roleData = Array.from(roleCounts, ([label, value]) => ({ label: label.replace('_', ' '), value }))

  const handleDashboardFilters = async (department: string, startYear: string, graduationYear: string) => {
    setDepartmentFilter(department)
    setStartYearFilter(startYear)
    setGraduationYearFilter(graduationYear)
    const params = new URLSearchParams({ actorId: currentUser.id })
    if (department) params.set('department', department)
    if (startYear) params.set('startYear', startYear)
    if (graduationYear) params.set('graduationYear', graduationYear)
    const query = params.size > 0 ? `?${params.toString()}` : ''
    setLoadingAnalytics(true)
    try {
      const response = await fetch(`/api/analytics${query}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load dashboard analytics')
      setAnalytics(data)
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to load dashboard analytics', 'error')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const roleLabel = currentUser.role === 'PLACEMENT_CELL' ? 'Placement Cell' : 'Admin'
  const adminChartData = [
    { label: 'Students', value: analytics.find((a) => a.metric === 'total_students')?.value ?? 0 },
    { label: 'Alumni', value: analytics.find((a) => a.metric === 'total_alumni')?.value ?? 0 },
    { label: 'Recruiters', value: analytics.find((a) => a.metric === 'total_recruiters')?.value ?? 0 },
    { label: 'Open jobs', value: analytics.find((a) => a.metric === 'open_jobs')?.value ?? 0 },
    { label: 'On campus', value: analytics.find((a) => a.metric === 'on_campus_placements')?.value ?? 0 },
    { label: 'Off campus', value: analytics.find((a) => a.metric === 'off_campus_placements')?.value ?? 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{roleLabel} Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of the AlumniNexus platform activity.</p>
      </div>

      {(currentUser.role === 'PLACEMENT_CELL' || (currentUser.role === 'ADMIN' && currentUser.department === 'Administration')) && (
        <div className="flex flex-wrap items-center gap-3">
          {currentUser.role === 'PLACEMENT_CELL' && (
            <select aria-label="Department view" value={departmentFilter} onChange={(event) => handleDashboardFilters(event.target.value, startYearFilter, graduationYearFilter)} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">All Departments</option>
              {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          )}
          {currentUser.role === 'ADMIN' && currentUser.department === 'Administration' && (
            <>
              <label htmlFor="dashboard-department" className="text-sm font-medium">Department view</label>
              <select id="dashboard-department" value={departmentFilter} onChange={(event) => handleDashboardFilters(event.target.value, startYearFilter, graduationYearFilter)} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">All Departments</option>
                {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="dashboard-start-year" className="text-sm font-medium">Intake</label>
              <select id="dashboard-start-year" value={startYearFilter} onChange={(event) => handleDashboardFilters(departmentFilter, event.target.value, graduationYearFilter)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">All Intake Years</option>
                {startYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="dashboard-graduation-year" className="text-sm font-medium">Graduation</label>
              <select id="dashboard-graduation-year" value={graduationYearFilter} onChange={(event) => handleDashboardFilters(departmentFilter, startYearFilter, event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">All Graduation Years</option>
                {graduationYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers || 0} color="bg-emerald-500" />
        <StatCard icon={Briefcase} label="Jobs Posted" value={totalJobs || 0} color="bg-teal-500" />
        <StatCard icon={FileText} label="Applications" value={totalApps || 0} color="bg-cyan-500" />
        <StatCard icon={Calendar} label="Events" value={totalEvents || 0} color="bg-emerald-600" />
      </div>

      <RoleAnalyticsChart title="Placement and platform overview" data={adminChartData} />
      {currentUser.role === 'ADMIN' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <RoleAnalyticsChart title="Student and alumni distribution by class" data={studyYearData} color="#0891b2" />
          {isMainAdmin && <RoleAnalyticsChart title="User distribution by role" data={roleData} color="#7c3aed" />}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentUser.role === 'ADMIN' && (
            <QuickActionCard icon={Shield} title="Manage Users" description="View, edit, and manage user accounts" onClick={() => setCurrentView('user-management')} color="bg-emerald-500" />
          )}
          <QuickActionCard icon={ClipboardCheck} title="Placement Records" description="Manage department and batch placement outcomes" onClick={() => setCurrentView('placements')} color="bg-indigo-500" />
          <QuickActionCard icon={BarChart3} title="View Reports" description="Access detailed analytics and reports" onClick={() => setCurrentView('analytics')} color="bg-teal-500" />
          {currentUser.role === 'PLACEMENT_CELL' && (
            <>
              <QuickActionCard icon={Lightbulb} title="Review Opportunities" description="Review leads shared by alumni and recruiters" onClick={() => setCurrentView('opportunities')} color="bg-violet-500" />
              <QuickActionCard icon={Building} title="Alumni Directory" description="Browse the alumni network" onClick={() => setCurrentView('alumni-directory')} color="bg-cyan-500" />
              <QuickActionCard icon={Calendar} title="Manage Events" description="Create and manage events" onClick={() => setCurrentView('events')} color="bg-emerald-600" />
            </>
          )}
        </div>
      </div>
      {loadingAnalytics && <p className="text-xs text-muted-foreground" role="status">Updating dashboard metrics…</p>}

      {/* Recent User Registrations */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent User Registrations</CardTitle>
            {currentUser.role === 'ADMIN' && (
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-500" onClick={() => setCurrentView('user-management')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No users registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">User</th>
                    <th className="pb-2 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                    <th className="pb-2 font-medium text-muted-foreground">Role</th>
                    <th className="pb-2 font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium truncate max-w-[120px]">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground hidden sm:table-cell">
                        <span className="truncate max-w-[180px] block">{user.email}</span>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{user.role}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                        {formatRelativeTime(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// --- Main Dashboard View ---
export function DashboardView() {
  const currentUser = useAppStore((s) => s.currentUser)

  if (!currentUser) return null

  switch (currentUser.role) {
    case 'STUDENT':
      return <><StudentDashboard /><CommunityHighlights /></>
    case 'ALUMNI':
      return <><AlumniDashboard /><CommunityHighlights /></>
    case 'RECRUITER':
      return <><RecruiterDashboard /><CommunityHighlights /></>
    case 'ADMIN':
    case 'PLACEMENT_CELL':
      return <><AdminDashboard /><CommunityHighlights /></>
    default:
      return <><StudentDashboard /><CommunityHighlights /></>
  }
}

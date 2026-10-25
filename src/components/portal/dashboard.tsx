'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { DEPARTMENTS } from '@/lib/departments'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  const analytics = useAppStore((s) => s.analytics)
  const jobs = useAppStore((s) => s.jobs)
  const applications = useAppStore((s) => s.applications)
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  const companyName = currentUser.company || currentUser.name
  const openJobs = jobs.filter((j) => j.status === 'OPEN').length
  const totalApplicants = applications.length
  const totalUsers = analytics.find((a) => a.metric === 'total_users')?.value ?? 0
  const totalEvents = analytics.find((a) => a.metric === 'total_events')?.value ?? 0

  const recentApps = applications.slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Welcome, {companyName}!</h1>
        <p className="text-muted-foreground mt-1">Manage your job postings and track applicants.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers || '-'} color="bg-emerald-500" />
        <StatCard icon={Briefcase} label="Open Jobs" value={openJobs || '-'} color="bg-teal-500" />
        <StatCard icon={FileText} label="Applications" value={totalApplicants || '-'} color="bg-cyan-500" />
        <StatCard icon={Calendar} label="Events" value={totalEvents || '-'} color="bg-emerald-600" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickActionCard icon={UserPlus} title="Post New Job" description="Create a new job listing" onClick={() => setCurrentView('post-job')} color="bg-emerald-500" />
          <QuickActionCard icon={FileText} title="View Applications" description="Review candidate applications" onClick={() => setCurrentView('applications')} color="bg-teal-500" />
          <QuickActionCard icon={Search} title="Search Candidates" description="Find candidates by skills" onClick={() => setCurrentView('candidate-search')} color="bg-cyan-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Posted Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">My Posted Jobs</CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-500" onClick={() => setCurrentView('manage-jobs')}>
                Manage <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No jobs posted yet.</p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {jobs.map((job) => (
                  <div key={job.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.location} &middot; {job.type}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs font-medium">{job.applicantsCount} applicant{job.applicantsCount !== 1 ? 's' : ''}</span>
                      <Badge variant={job.status === 'OPEN' ? 'default' : 'secondary'} className={`text-[10px] px-1.5 py-0 ${job.status === 'OPEN' ? 'bg-emerald-600' : ''}`}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-500" onClick={() => setCurrentView('applications')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentApps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No applications received yet.</p>
            ) : (
              <div className="space-y-1">
                {recentApps.map((app) => (
                  <div key={app.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                        {(app.userName || '??').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{app.userName || 'Candidate'}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.jobTitle || 'Unknown Job'}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {app.status}
                    </Badge>
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
  const [departmentFilter, setDepartmentFilter] = useState('')

  const totalUsers = analytics.find((a) => a.metric === 'total_users')?.value ?? users.length
  const totalJobs = analytics.find((a) => a.metric === 'open_jobs')?.value ?? jobs.length
  const totalApps = analytics.find((a) => a.metric === 'total_applications')?.value ?? applications.length
  const totalEvents = analytics.find((a) => a.metric === 'total_events')?.value ?? events.length

  const recentUsers = users.slice(0, 5)

  const handleDepartmentFilter = async (department: string) => {
    setDepartmentFilter(department)
    const res = await fetch(department ? `/api/analytics?department=${encodeURIComponent(department)}` : '/api/analytics')
    if (res.ok) setAnalytics(await res.json())
  }

  const roleLabel = currentUser.role === 'PLACEMENT_CELL' ? 'Placement Cell' : 'Admin'

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{roleLabel} Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of the AlumniNexus platform activity.</p>
      </div>

      {currentUser.role === 'ADMIN' && currentUser.department === 'Administration' && (
        <div className="flex items-center gap-3">
          <label htmlFor="dashboard-department" className="text-sm font-medium">Department view</label>
          <select id="dashboard-department" value={departmentFilter} onChange={(event) => handleDepartmentFilter(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">All Departments</option>
            {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers || 0} color="bg-emerald-500" />
        <StatCard icon={Briefcase} label="Jobs Posted" value={totalJobs || 0} color="bg-teal-500" />
        <StatCard icon={FileText} label="Applications" value={totalApps || 0} color="bg-cyan-500" />
        <StatCard icon={Calendar} label="Events" value={totalEvents || 0} color="bg-emerald-600" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentUser.role === 'ADMIN' && (
            <QuickActionCard icon={Shield} title="Manage Users" description="View, edit, and manage user accounts" onClick={() => setCurrentView('user-management')} color="bg-emerald-500" />
          )}
          <QuickActionCard icon={BarChart3} title="View Reports" description="Access detailed analytics and reports" onClick={() => setCurrentView('analytics')} color="bg-teal-500" />
          {currentUser.role === 'PLACEMENT_CELL' && (
            <>
              <QuickActionCard icon={Building} title="Alumni Directory" description="Browse the alumni network" onClick={() => setCurrentView('alumni-directory')} color="bg-cyan-500" />
              <QuickActionCard icon={Calendar} title="Manage Events" description="Create and manage events" onClick={() => setCurrentView('events')} color="bg-emerald-600" />
            </>
          )}
        </div>
      </div>

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
      return <StudentDashboard />
    case 'ALUMNI':
      return <AlumniDashboard />
    case 'RECRUITER':
      return <RecruiterDashboard />
    case 'ADMIN':
    case 'PLACEMENT_CELL':
      return <AdminDashboard />
    default:
      return <StudentDashboard />
  }
}

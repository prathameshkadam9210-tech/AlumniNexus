'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type UserRole } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Search,
  Users,
  UserCheck,
  Shield,
  GraduationCap,
  Briefcase,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Bell,
  Copy,
  Award,
  FileCheck,
  BarChart3,
  TrendingUp,
  BadgeCheck,
  ExternalLink,
  XCircle,
  RefreshCw,
  Building,
  Calendar,
  DollarSign,
  Heart,
  ArrowUpRight,
  Sparkles,
  Clock,
  Fingerprint,
  Link as LinkIcon,
} from 'lucide-react'
import { DEPARTMENTS, getCanonicalDepartment } from '@/lib/departments'
import { getDonationPurposeLabel, IDEA_LAB_PURPOSE } from '@/lib/donation-purposes'

// ==================== HELPERS ====================

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay} days ago`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? 's' : ''} ago`
  return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) > 1 ? 's' : ''} ago`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function truncateHash(hash: string, chars = 8): string {
  if (!hash) return ''
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    // fallback
  })
}

function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ALUMNI: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  RECRUITER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  PLACEMENT_CELL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

// ==================== USER MANAGEMENT VIEW ====================

export function UserManagementView() {
  const currentUser = useAppStore((s) => s.currentUser)
  const users = useAppStore((s) => s.users)
  const setUsers = useAppStore((s) => s.setUsers)
  const updateUser = useAppStore((s) => s.updateUser)
  const addToast = useAppStore((s) => s.addToast)
  const setCurrentView = useAppStore((s) => s.setCurrentView)
  const setSelectedUserId = useAppStore((s) => s.setSelectedUserId)

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [loadedActorId, setLoadedActorId] = useState<string | null>(null)
  const loading = Boolean(currentUser?.id && loadedActorId !== currentUser.id)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [promotionTarget, setPromotionTarget] = useState<string | null>(null)
  const [passoutYear, setPassoutYear] = useState(String(new Date().getFullYear()))
  const perPage = 10

  // Refresh the actor-scoped list so a previous admin's cached users are not reused.
  useEffect(() => {
    const actorId = currentUser?.id
    if (!actorId) return

    let active = true
    fetch(`/api/auth?action=users&actorId=${encodeURIComponent(actorId)}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load users')
        return data
      })
      .then((data) => {
        if (active) {
          setUsers(Array.isArray(data) ? data : [])
          setCurrentPage(1)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setUsers([])
          addToast(error instanceof Error ? error.message : 'Unable to load users', 'error')
        }
      })
      .finally(() => {
        if (active) setLoadedActorId(actorId)
      })

    return () => {
      active = false
    }
  }, [currentUser?.id, addToast, setCurrentPage, setUsers])

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage))
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage)

  // Stats
  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === 'STUDENT').length,
    alumni: users.filter((u) => u.role === 'ALUMNI').length,
    recruiters: users.filter((u) => u.role === 'RECRUITER').length,
    verified: users.filter((u) => u.isVerified).length,
  }

  const handleSetVerified = async (userId: string, verified: boolean) => {
    setUpdatingUserId(userId)
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, actorId: currentUser?.id, isVerified: verified }),
      })
      const updatedUser = await res.json()
      if (!res.ok) {
        throw new Error(updatedUser.error || 'Failed to update verification')
      }
      updateUser(userId, {
        isVerified: updatedUser.isVerified,
        verificationStatus: updatedUser.verificationStatus,
      })
      addToast(`User ${verified ? 'approved' : 'rejected'} successfully`, 'success')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to update verification', 'error')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handlePromoteToAlumni = async () => {
    if (!promotionTarget || !currentUser) return
    const year = Number(passoutYear)
    if (!Number.isInteger(year)) {
      addToast('Enter a valid passout year', 'error')
      return
    }

    setUpdatingUserId(promotionTarget)
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: promotionTarget,
          actorId: currentUser.id,
          role: 'ALUMNI',
          passoutYear: year,
        }),
      })
      const updatedUser = await res.json()
      if (!res.ok) {
        throw new Error(updatedUser.error || 'Failed to promote student')
      }
      updateUser(promotionTarget, {
        role: 'ALUMNI',
        batch: updatedUser.batch,
        graduationYear: updatedUser.graduationYear,
      })
      setPromotionTarget(null)
      addToast(`Student promoted to alumni for ${updatedUser.batch}`, 'success')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to promote student', 'error')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch('/api/auth', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget }),
      })
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== deleteTarget))
        addToast('User deleted', 'success')
      }
    } catch {
      addToast('Failed to delete user', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId)
    setCurrentView('profile')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground text-sm">Manage all registered users on the platform.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-emerald-600' },
          { label: 'Students', value: stats.students, icon: GraduationCap, color: 'text-blue-600' },
          { label: 'Alumni', value: stats.alumni, icon: Award, color: 'text-emerald-600' },
          { label: 'Recruiters', value: stats.recruiters, icon: Briefcase, color: 'text-purple-600' },
          { label: 'Verified', value: stats.verified, icon: UserCheck, color: 'text-amber-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="ALUMNI">Alumni</SelectItem>
                <SelectItem value="RECRUITER">Recruiter</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="PLACEMENT_CELL">Placement Cell</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Department</TableHead>
                  <TableHead>Verification Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                              {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[140px]">{user.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden truncate max-w-[140px]">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={ROLE_COLORS[user.role] || ''}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {getCanonicalDepartment(user.department) || '—'}
                      </TableCell>
                      <TableCell>
                        {(user.role === 'STUDENT' || user.role === 'ALUMNI') ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className={
                              (user.verificationStatus || (user.isVerified ? 'APPROVED' : 'PENDING')) === 'APPROVED'
                                ? 'border-emerald-500 text-emerald-700'
                                : (user.verificationStatus || 'PENDING') === 'REJECTED'
                                  ? 'border-red-500 text-red-700'
                                  : 'border-amber-500 text-amber-700'
                            }>
                              {(user.verificationStatus || (user.isVerified ? 'APPROVED' : 'PENDING')) === 'APPROVED'
                                ? 'Approved'
                                : user.verificationStatus === 'REJECTED'
                                  ? 'Rejected'
                                  : 'Pending'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={updatingUserId === user.id || user.isVerified}
                              className="h-7 px-2 text-xs text-emerald-700"
                              onClick={() => handleSetVerified(user.id, true)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={updatingUserId === user.id || user.verificationStatus === 'REJECTED'}
                              className="h-7 px-2 text-xs text-red-600"
                              onClick={() => handleSetVerified(user.id, false)}
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline">Verified</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleViewProfile(user.id)}
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {user.role === 'STUDENT' && user.isVerified && (
                            <Dialog open={promotionTarget === user.id} onOpenChange={(open) => {
                              if (open) {
                                setPromotionTarget(user.id)
                                setPassoutYear(String(new Date().getFullYear()))
                              } else {
                                setPromotionTarget(null)
                              }
                            }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-700"
                                title="Promote to Alumni"
                                disabled={updatingUserId === user.id}
                                onClick={() => setPromotionTarget(user.id)}
                              >
                                <GraduationCap className="w-4 h-4" />
                              </Button>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Promote Student to Alumni</DialogTitle>
                                  <DialogDescription>
                                    Confirm {user.name}&apos;s actual passout year. The batch is recorded as “year-year passout batch”; it is not inferred from the student&apos;s original course duration.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2">
                                  <Label htmlFor={`passout-year-${user.id}`}>Confirmed passout year</Label>
                                  <Input
                                    id={`passout-year-${user.id}`}
                                    type="number"
                                    min="1900"
                                    max={new Date().getFullYear() + 10}
                                    value={passoutYear}
                                    onChange={(event) => setPassoutYear(event.target.value)}
                                  />
                                  <p className="text-sm text-muted-foreground">
                                    This student will be recorded in the {Number(passoutYear) - 1}-{passoutYear} passout batch.
                                  </p>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setPromotionTarget(null)}>Cancel</Button>
                                  <Button onClick={handlePromoteToAlumni} disabled={updatingUserId === user.id}>
                                    Promote to Alumni
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          <AlertDialog open={deleteTarget === user.id} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" title="Delete User">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <span className="font-semibold">{user.name}</span>? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filteredUsers.length)} of {filteredUsers.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number
                  if (totalPages <= 5) {
                    page = i + 1
                  } else if (currentPage <= 3) {
                    page = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i
                  } else {
                    page = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== ANALYTICS VIEW ====================

interface MetricCardData {
  label: string
  metric: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

export function AnalyticsView() {
  const currentUser = useAppStore((s) => s.currentUser)
  const analytics = useAppStore((s) => s.analytics)
  const users = useAppStore((s) => s.users)
  const jobs = useAppStore((s) => s.jobs)
  const applications = useAppStore((s) => s.applications)
  const mentorships = useAppStore((s) => s.mentorships)
  const events = useAppStore((s) => s.events)
  const setAnalytics = useAppStore((s) => s.setAnalytics)
  const addToast = useAppStore((s) => s.addToast)

  const [loading, setLoading] = useState(analytics.length === 0)
  const [departmentFilter, setDepartmentFilter] = useState('')

  const loadAnalytics = async (department = departmentFilter) => {
    setLoading(true)
    try {
      const query = department ? `?department=${encodeURIComponent(department)}` : ''
      const response = await fetch(`/api/analytics${query}`)
      const data = await response.json()
      setAnalytics(Array.isArray(data) ? data : [])
    } catch {
      addToast('Unable to load analytics', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (analytics.length === 0) {
      const timer = window.setTimeout(() => { void loadAnalytics() }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [])

  const getMetric = (key: string): number => {
    const item = analytics.find((a) => a.metric === key)
    return item?.value ?? 0
  }

  const totalUsers = getMetric('total_users') || users.length
  const totalJobs = getMetric('total_jobs') || jobs.length
  const openPositions = getMetric('open_jobs') || jobs.filter((j) => j.status === 'OPEN').length
  const totalApps = getMetric('total_applications') || applications.length
  const pendingApps = getMetric('pending_applications') || applications.filter((a) => a.status === 'PENDING').length
  const acceptedApps = getMetric('accepted_applications') || applications.filter((a) => a.status === 'ACCEPTED').length
  const activeMentorships = getMetric('active_mentorships') || mentorships.filter((m) => m.status === 'ACCEPTED').length
  const totalEvents = getMetric('total_events') || events.length
  const verifiedUsers = getMetric('verified_users') || users.filter((u) => u.isVerified).length
  const placementRate = totalUsers > 0 ? Math.round((acceptedApps / totalUsers) * 100) : 0

  const metrics: MetricCardData[] = [
    { label: 'Total Users', metric: 'total_users', icon: Users, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Total Jobs', metric: 'total_jobs', icon: Briefcase, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Open Positions', metric: 'open_jobs', icon: TrendingUp, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
    { label: 'Total Applications', metric: 'total_applications', icon: FileCheck, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Pending Applications', metric: 'pending_applications', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Accepted / Hired', metric: 'accepted_applications', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Active Mentorships', metric: 'active_mentorships', icon: Users, color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-900/30' },
    { label: 'Events', metric: 'total_events', icon: Calendar, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
    { label: 'Verified Users', metric: 'verified_users', icon: Shield, color: 'text-teal-600', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
    { label: 'Placement Rate', metric: 'placement_rate', icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  ]

  const metricValues: Record<string, number> = {
    total_users: totalUsers,
    total_jobs: totalJobs,
    open_jobs: openPositions,
    total_applications: totalApps,
    pending_applications: pendingApps,
    accepted_applications: acceptedApps,
    active_mentorships: activeMentorships,
    total_events: totalEvents,
    verified_users: verifiedUsers,
    placement_rate: placementRate,
  }

  const maxMetricVal = Math.max(...Object.values(metricValues), 1)

  // Department-wise breakdown
  const deptMap: Record<string, { total: number; roles: Record<string, number> }> = {}
  const allUsers = users.length > 0 ? users : []
  for (const u of allUsers) {
    const dept = getCanonicalDepartment(u.department) || 'Unspecified'
    if (!deptMap[dept]) deptMap[dept] = { total: 0, roles: {} }
    deptMap[dept].total++
    deptMap[dept].roles[u.role] = (deptMap[dept].roles[u.role] || 0) + 1
  }
  const departments = Object.entries(deptMap).sort((a, b) => b[1].total - a[1].total)

  // Monthly trends (from analytics data with month/year)
  const monthlyData = analytics.filter((a) => a.month && a.year)
  const monthlyMap: Record<string, Record<string, number>> = {}
  for (const a of monthlyData) {
    const key = `${a.year}-${String(a.month).padStart(2, '0')}`
    if (!monthlyMap[key]) monthlyMap[key] = {}
    monthlyMap[key][a.metric] = a.value
  }
  const monthlyEntries = Object.entries(monthlyMap).sort((a, b) => b[0].localeCompare(a[0]))

  const handleExportCSV = () => {
    const headers = ['Metric', 'Value', 'Label', 'Period', 'Year', 'Month']
    const rows = analytics.map((a) => [
      a.metric,
      a.value,
      a.label || '',
      a.period || '',
      a.year || '',
      a.month || '',
    ])
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Analytics exported as CSV', 'success')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground text-sm">Platform-wide metrics and insights.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {currentUser?.role === 'ADMIN' && currentUser.department === 'Administration' && (
            <Select value={departmentFilter || 'ALL'} onValueChange={(value) => { const next = value === 'ALL' ? '' : value; setDepartmentFilter(next); void loadAnalytics(next) }}>
              <SelectTrigger className="w-56"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {DEPARTMENTS.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Metric Cards with Bar Representations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metrics.map((m) => {
          const val = metricValues[m.metric]
          const pct = m.metric === 'placement_rate' ? val : Math.round((val / maxMetricVal) * 100)
          return (
            <Card key={m.label} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${m.bgColor}`}>
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{m.metric === 'placement_rate' ? `${val}%` : val}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{m.label}</p>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      m.metric === 'placement_rate'
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" />
              Department Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Alumni</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Recruiters</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    departments.map(([dept, data]) => (
                      <TableRow key={dept}>
                        <TableCell className="font-medium text-sm">{dept}</TableCell>
                        <TableCell className="text-center text-sm">{data.roles['STUDENT'] || 0}</TableCell>
                        <TableCell className="text-center text-sm hidden sm:table-cell">{data.roles['ALUMNI'] || 0}</TableCell>
                        <TableCell className="text-center text-sm hidden md:table-cell">{data.roles['RECRUITER'] || 0}</TableCell>
                        <TableCell className="text-right font-semibold text-sm">{data.total}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              {monthlyEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No monthly data available yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Jobs</TableHead>
                      <TableHead className="text-right">Applications</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyEntries.map(([month, data]) => (
                      <TableRow key={month}>
                        <TableCell className="font-medium text-sm">{month}</TableCell>
                        <TableCell className="text-right text-sm">{data['total_users'] || 0}</TableCell>
                        <TableCell className="text-right text-sm">{data['total_jobs'] || 0}</TableCell>
                        <TableCell className="text-right text-sm">{data['total_applications'] || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ==================== PAYMENTS VIEW ====================

interface PaymentItem {
  id: string
  userId: string
  amount: number
  currency: string
  type: string
  status: string
  description: string
  purpose?: string | null
  razorpayId?: string | null
  razorpayOrderId?: string | null
  referenceId?: string | null
  createdAt: string
}

interface FundraisingSummary {
  targetAmount: number
  ideaLabRaised: number
  totalRaised: number
  purposeTotals: { purpose: string; label: string; amount: number }[]
}

interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill: { name: string; email: string; contact?: string }
  theme: { color: string }
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void
  modal: { ondismiss: () => void }
}

interface RazorpayCheckout {
  open: () => void
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout
  }
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
}

const PAYMENT_TYPE_COLORS: Record<string, string> = {
  EVENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DONATION: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  SUBSCRIPTION: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

export function PaymentsView() {
  const currentUser = useAppStore((s) => s.currentUser)
  const addToast = useAppStore((s) => s.addToast)

  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null)
  const [processing, setProcessing] = useState(false)

  // Donation state
  const [donateDialogOpen, setDonateDialogOpen] = useState(false)
  const [donateAmount, setDonateAmount] = useState('')
  const [donatePurpose, setDonatePurpose] = useState('general')
  const [donateCustomAmount, setDonateCustomAmount] = useState('')
  const [donateMessage, setDonateMessage] = useState('')
  const [donateProcessing, setDonateProcessing] = useState(false)
  const [fundraisingSummary, setFundraisingSummary] = useState<FundraisingSummary>({
    targetAmount: 0,
    ideaLabRaised: 0,
    totalRaised: 0,
    purposeTotals: [],
  })
  const [ideaLabTargetInput, setIdeaLabTargetInput] = useState('')
  const [savingIdeaLabTarget, setSavingIdeaLabTarget] = useState(false)

  const isAdmin = currentUser?.role === 'ADMIN'
  const isAlumni = currentUser?.role === 'ALUMNI'
  const isStudent = currentUser?.role === 'STUDENT'
  const isMainAdmin = currentUser?.role === 'ADMIN' && currentUser.department === 'Administration'

  useEffect(() => {
    const url = isAdmin ? '/api/payments' : `/api/payments?userId=${currentUser?.id}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentUser?.id, isAdmin])

  const loadFundraisingSummary = useCallback(async (): Promise<FundraisingSummary> => {
    const response = await fetch('/api/fundraising')
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load Idea Lab fundraising data')
    return data
  }, [])

  useEffect(() => {
    let cancelled = false
    loadFundraisingSummary().then((data) => {
      if (cancelled) return
      setFundraisingSummary(data)
      setIdeaLabTargetInput(data.targetAmount > 0 ? String(data.targetAmount) : '')
    }).catch((error) => {
      if (!cancelled) addToast(error instanceof Error ? error.message : 'Unable to load Idea Lab fundraising data', 'error')
    })
    return () => { cancelled = true }
  }, [loadFundraisingSummary, addToast])

  const totalPaid = payments.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0)
  const donationTotal = payments.filter((p) => p.type === 'DONATION' && p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0)

  const saveIdeaLabTarget = async () => {
    if (!currentUser) return
    setSavingIdeaLabTarget(true)
    try {
      const response = await fetch('/api/fundraising', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: currentUser.id, targetAmount: Number(ideaLabTargetInput) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to update Idea Lab target')
      const summary = await loadFundraisingSummary()
      setFundraisingSummary(summary)
      setIdeaLabTargetInput(summary.targetAmount > 0 ? String(summary.targetAmount) : '')
      addToast('Idea Lab fundraising target updated', 'success')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to update Idea Lab target', 'error')
    } finally {
      setSavingIdeaLabTarget(false)
    }
  }

  const handlePayNow = (payment: PaymentItem) => {
    void startRazorpayCheckout(payment)
  }

  const startRazorpayCheckout = async (payment: PaymentItem) => {
    if (!currentUser) return
    setSelectedPayment(payment)
    setProcessing(true)
    try {
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
          paymentId: payment.id,
          userId: currentUser.id,
          amount: payment.amount,
          currency: payment.currency,
          type: payment.type,
          description: payment.description,
          referenceId: payment.referenceId,
        }),
      })
      if (!orderResponse.ok) throw new Error((await orderResponse.json()).error || 'Unable to create payment order')
      const order = await orderResponse.json()
      const Checkout = window.Razorpay
      if (!Checkout) throw new Error('Razorpay Checkout is unavailable')
      const checkout = new Checkout({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'AlumniNexus',
        description: payment.description,
        order_id: order.orderId,
        prefill: { name: currentUser.name, email: currentUser.email, contact: currentUser.phone || undefined },
        theme: { color: '#059669' },
        handler: async (response) => {
          const verifyResponse = await fetch('/api/payments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId: payment.id,
              status: 'COMPLETED',
              razorpayId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            }),
          })
          if (!verifyResponse.ok) {
            addToast('Payment verification failed. Contact support before retrying.', 'error')
            return
          }
          const updated = await verifyResponse.json()
          setPayments((prev) => prev.map((item) => item.id === payment.id ? updated : item))
          if (updated.type === 'DONATION') {
            void loadFundraisingSummary().catch((error) => {
              addToast(error instanceof Error ? error.message : 'Unable to refresh fundraising totals', 'error')
            })
            addToast(
              updated.emailSent
                ? 'Donation verified. Your receipt and appreciation letter were emailed.'
                : 'Donation verified, but the receipt email could not be sent. Please contact the college admin.',
              updated.emailSent ? 'success' : 'info'
            )
          } else {
            addToast(
              updated.emailSent ? 'Payment successful. Confirmation email sent.' : 'Payment successful, but the confirmation email could not be sent.',
              updated.emailSent ? 'success' : 'info'
            )
          }
        },
        modal: { ondismiss: () => addToast('Payment window closed. No amount was charged.', 'info') },
      })
      checkout.on('payment.failed', async (response) => {
        await fetch('/api/payments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: payment.id, status: 'FAILED' }),
        }).catch(() => undefined)
        addToast(response.error?.description || 'Payment failed. No amount was charged.', 'error')
      })
      checkout.open()
    } catch {
      await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.id, status: 'FAILED' }),
      }).catch(() => undefined)
      addToast('Unable to start Razorpay checkout. Please try again.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
        <p className="text-muted-foreground text-sm">
          {isAdmin ? 'View and manage all platform payments.' : 'View your payment history and manage pending payments.'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
              <p className="text-sm text-muted-foreground">Total Paid</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Heart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(donationTotal)}</p>
              <p className="text-sm text-muted-foreground">Donation Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Idea Lab Fundraising</CardTitle>
          <CardDescription>
            Alumni contributions are pooled toward the collective target; no percentage is deducted from an individual donation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {formatCurrency(fundraisingSummary.ideaLabRaised)}
                {fundraisingSummary.targetAmount > 0 && ` raised of ${formatCurrency(fundraisingSummary.targetAmount)}`}
              </p>
              {fundraisingSummary.targetAmount > 0 && (
                <Badge variant="secondary">
                  {Math.round(Math.min(100, (fundraisingSummary.ideaLabRaised / fundraisingSummary.targetAmount) * 100))}% funded
                </Badge>
              )}
            </div>
            {fundraisingSummary.targetAmount > 0 ? (
              <Progress value={Math.min(100, (fundraisingSummary.ideaLabRaised / fundraisingSummary.targetAmount) * 100)} />
            ) : (
              <p className="text-sm text-muted-foreground">The main admin has not set an Idea Lab target yet.</p>
            )}
          </div>

          {isMainAdmin && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="idea-lab-target">Set collective fundraising target (INR)</Label>
                <Input
                  id="idea-lab-target"
                  type="number"
                  min="1"
                  step="1"
                  value={ideaLabTargetInput}
                  onChange={(event) => setIdeaLabTargetInput(event.target.value)}
                  placeholder="Enter target amount"
                />
              </div>
              <Button onClick={saveIdeaLabTarget} disabled={savingIdeaLabTarget}>
                {savingIdeaLabTarget ? 'Saving...' : 'Save target'}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Completed donations by purpose</h3>
            {fundraisingSummary.purposeTotals.length > 0 ? (
              fundraisingSummary.purposeTotals.map((item) => (
                <div key={item.purpose} className="flex items-center justify-between gap-4 border-b py-2 text-sm last:border-0">
                  <span>{item.label}</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No completed donations yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Donate Now Section - for Alumni & Students */}
      {(isAlumni || isStudent) && (
        <Card className="border-dashed border-2 border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <Heart className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Support JJMCOE Students</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Your contribution helps fund scholarships, events, and student development programs.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setDonateAmount('500')
                  setDonatePurpose('general')
                  setDonateCustomAmount('')
                  setDonateMessage('')
                  setDonateDialogOpen(true)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0"
              >
                <Heart className="w-4 h-4" />
                Donate Now
              </Button>
            </div>

            {/* Quick donate amount chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[{ label: 'Scholarship Fund', amount: '1000', purpose: 'scholarship' }, { label: 'Event Sponsorship', amount: '2500', purpose: 'event' }, { label: 'Infrastructure', amount: '5000', purpose: 'infrastructure' }, { label: 'Student Welfare', amount: '500', purpose: 'welfare' }, { label: 'Idea Lab', amount: '1000', purpose: IDEA_LAB_PURPOSE }].map((item) => (
                <button
                  key={item.purpose}
                  onClick={() => {
                    setDonateAmount(item.amount)
                    setDonatePurpose(item.purpose)
                    setDonateCustomAmount('')
                    setDonateMessage('')
                    setDonateDialogOpen(true)
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-white/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  {item.label} - INR {item.amount}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No payments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDate(payment.createdAt)}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium truncate max-w-[200px]">{payment.description}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className={PAYMENT_TYPE_COLORS[payment.type] || ''}>
                          {payment.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={PAYMENT_STATUS_COLORS[payment.status] || ''}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === 'PENDING' && !isAdmin && (
                          <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => handlePayNow(payment)}>
                            Pay Now
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Donate Now Dialog */}
      <Dialog open={donateDialogOpen} onOpenChange={setDonateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              Make a Donation
            </DialogTitle>
            <DialogDescription>
              Support Dr. J. J. Magdum College of Engineering students and initiatives.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 overflow-y-auto flex-1 min-h-0 pr-1">
            {/* Purpose Selection */}
            <div className="space-y-2">
              <Label>Donation Purpose</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'scholarship', label: 'Student Scholarship', icon: GraduationCap, desc: 'Help deserving students' },
                  { value: 'event', label: 'Event Sponsorship', icon: Calendar, desc: 'Fund college events' },
                  { value: 'infrastructure', label: 'Infrastructure', icon: Building, desc: 'Lab & facility upgrades' },
                  { value: 'welfare', label: 'Student Welfare', icon: Heart, desc: 'General student support' },
                  { value: 'general', label: 'General Fund', icon: DollarSign, desc: 'College development' },
                  { value: IDEA_LAB_PURPOSE, label: 'Idea Lab', icon: Sparkles, desc: 'Collectively fund the Idea Lab' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setDonatePurpose(item.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      donatePurpose === item.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-muted hover:border-emerald-200 dark:hover:border-emerald-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-4 h-4 ${donatePurpose === item.value ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${donatePurpose === item.value ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>{item.label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 ml-6">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Selection */}
            <div className="space-y-2">
              <Label>Donation Amount (INR)</Label>
              <div className="flex flex-wrap gap-2">
                {['100', '500', '1000', '2500', '5000', '10000'].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => { setDonateAmount(amt); setDonateCustomAmount('') }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      donateAmount === amt && !donateCustomAmount
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    {parseInt(amt).toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">INR</span>
                <Input
                  type="number"
                  placeholder="Enter custom amount"
                  value={donateCustomAmount}
                  onChange={(e) => { setDonateCustomAmount(e.target.value); setDonateAmount('') }}
                  className="pl-12"
                  min="1"
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="donateMsg">Message (optional)</Label>
              <Textarea
                id="donateMsg"
                placeholder="Leave a message with your donation..."
                value={donateMessage}
                onChange={(e) => setDonateMessage(e.target.value)}
                rows={2}
              />
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Purpose</span>
                <span className="font-medium capitalize">{donatePurpose === 'general' ? 'General Fund' : donatePurpose}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-lg text-emerald-600">
                  INR {(donateCustomAmount || donateAmount || '0')}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDonateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!currentUser) return
                const finalAmount = parseFloat(donateCustomAmount || donateAmount || '0')
                if (!finalAmount || finalAmount <= 0) {
                  addToast('Please enter a valid amount', 'error')
                  return
                }
                setDonateProcessing(true)
                try {
                  // Create an initiated order, then continue through the payment dialog.
                  const res = await fetch('/api/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: currentUser.id,
                      amount: finalAmount,
                      currency: 'INR',
                      type: 'DONATION',
                      purpose: donatePurpose,
                      description: `Donation for ${getDonationPurposeLabel(donatePurpose)}${donateMessage ? ': ' + donateMessage : ''}`,
                    }),
                  })
                  if (res.ok) {
                    const newPayment = await res.json()
                    const payment = newPayment.payment || newPayment
                    setPayments((prev) => [payment, ...prev])
                    setDonateDialogOpen(false)
                    void startRazorpayCheckout(payment)
                  } else {
                    addToast('Failed to process donation', 'error')
                  }
                } catch {
                  addToast('Failed to process donation', 'error')
                } finally {
                  setDonateProcessing(false)
                }
              }}
              disabled={donateProcessing || (!donateCustomAmount && !donateAmount)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {donateProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Donate INR {(donateCustomAmount || donateAmount || '0')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

// ==================== CERTIFICATES VIEW ====================

function getLocalDateInputValue(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface CertificateItem {
  id: string
  userId: string
  title: string
  type: string
  description: string
  certificateHash: string
  txHash?: string | null
  issuedBy?: string | null
  issuedAt: string
  expiresAt?: string | null
  isVerified: boolean
  createdAt: string
  userName?: string
}

const CERT_TYPE_COLORS: Record<string, string> = {
  COURSE_COMPLETION: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  EVENT_PARTICIPATION: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  MENTORSHIP: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ACHIEVEMENT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  INTERNSHIP: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  PLACEMENT: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
}

export function CertificatesView() {
  const currentUser = useAppStore((s) => s.currentUser)
  const users = useAppStore((s) => s.users)
  const addToast = useAppStore((s) => s.addToast)

  const [certificates, setCertificates] = useState<CertificateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [verifyHash, setVerifyHash] = useState('')
  const [verifyResult, setVerifyResult] = useState<CertificateItem | null | 'not_found'>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)

  // Issue form state
  const [issueForm, setIssueForm] = useState({
    userId: '',
    title: '',
    type: 'COURSE_COMPLETION',
    description: '',
    issuedBy: 'JJMCOE AlumniNexus',
    issuedDate: getLocalDateInputValue(),
    expiryDate: '',
  })
  const [issuing, setIssuing] = useState(false)

  const isAdmin = currentUser?.role === 'ADMIN'

  useEffect(() => {
    if (!currentUser) return

    let cancelled = false
    let firstLoad = true
    const refreshCertificates = async () => {
      try {
        const url = isAdmin ? '/api/certificates' : `/api/certificates?userId=${encodeURIComponent(currentUser.id)}`
        const res = await fetch(url)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Unable to load certificates')
        if (!Array.isArray(data)) throw new Error('The certificate response was invalid')
        if (!cancelled) setCertificates(data)
      } catch (error) {
        console.error('Certificate list error:', error)
        if (firstLoad && !cancelled) {
          addToast(error instanceof Error ? error.message : 'Unable to load certificates', 'error')
        }
      } finally {
        if (!cancelled) setLoading(false)
        firstLoad = false
      }
    }

    void refreshCertificates()
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshCertificates()
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [currentUser?.id, isAdmin, addToast])

  const handleIssueCertificate = async () => {
    if (!issueForm.userId || !issueForm.title.trim()) {
      addToast('Select a user and enter a certificate title.', 'error')
      return
    }
    if (!issueForm.issuedDate) {
      addToast('Select an issue date.', 'error')
      return
    }
    if (issueForm.expiryDate && issueForm.expiryDate < issueForm.issuedDate) {
      addToast('Expiry date cannot be before the issue date.', 'error')
      return
    }
    setIssuing(true)
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...issueForm,
          title: issueForm.title.trim(),
          expiresAt: issueForm.expiryDate || null,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to issue certificate.')
      const cert = result as CertificateItem
      const recipientName = users.find((user) => user.id === cert.userId)?.name
      setCertificates((prev) => [{ ...cert, userName: recipientName }, ...prev])
      addToast(`Certificate issued successfully to ${recipientName || 'the selected user'}.`, 'success')
      setIssueDialogOpen(false)
      setIssueForm({
        userId: '',
        title: '',
        type: 'COURSE_COMPLETION',
        description: '',
        issuedBy: 'JJMCOE AlumniNexus',
        issuedDate: getLocalDateInputValue(),
        expiryDate: '',
      })
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to issue certificate.', 'error')
    } finally {
      setIssuing(false)
    }
  }

  const handleVerify = async () => {
    if (!verifyHash.trim()) return
    setVerifyLoading(true)
    setVerifyResult(null)
    try {
      const res = await fetch(`/api/certificates?hash=${encodeURIComponent(verifyHash.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setVerifyResult(data.isValid && data.certificate ? data.certificate : 'not_found')
      } else {
        setVerifyResult('not_found')
      }
    } catch {
      setVerifyResult('not_found')
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleDownload = (cert: CertificateItem) => {
    const certificateHtml = `<!doctype html><html><head><meta charset="utf-8"><title>${cert.title}</title><style>body{font-family:Georgia,serif;background:#f1f5f9;padding:48px}.certificate{max-width:800px;margin:auto;background:white;border:12px solid #0f766e;padding:64px;text-align:center;box-shadow:0 16px 40px #0f172a22}h1{color:#0f766e;font-size:38px}h2{font-size:28px;margin:32px 0 12px}p{color:#475569;line-height:1.6}.hash{font:12px monospace;word-break:break-all;margin-top:32px}</style></head><body><main class="certificate"><p>DR. J. J. MAGDUM COLLEGE OF ENGINEERING, JAYSINGPUR</p><h1>Certificate of Achievement</h1><p>This certifies that</p><h2>${cert.userName || cert.userId}</h2><p>${cert.description}</p><p>Issued on ${formatDate(cert.issuedAt)}</p><p class="hash">Verification hash: ${cert.certificateHash}</p></main></body></html>`
    const blob = new Blob([certificateHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(cert.title || 'certificate').replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'certificate'}.html`
    link.click()
    URL.revokeObjectURL(url)
    addToast('Certificate downloaded. Open it and print to PDF.', 'success')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Certificates</h2>
          <p className="text-muted-foreground text-sm">
            {isAdmin ? 'Issue and verify certificates for platform users.' : 'View your earned certificates and verify their authenticity.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => { setVerifyHash(''); setVerifyResult(null); setVerifyDialogOpen(true) }}>
            <Fingerprint className="w-4 h-4" /> Verify Certificate
          </Button>
          {isAdmin && (
            <Button className="gap-2" onClick={() => setIssueDialogOpen(true)}>
              <Sparkles className="w-4 h-4" /> Issue Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Certificates Yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {isAdmin
                ? 'Issue certificates to users for their achievements and accomplishments.'
                : 'Your certificates will appear here once issued.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="relative overflow-hidden group">
              {/* Decorative gradient border */}
              <div className="absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-600 p-[2px]">
                <div className="w-full h-full rounded-[6px] bg-background" />
              </div>

              <CardContent className="relative p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={CERT_TYPE_COLORS[cert.type] || ''}>
                        {(cert.type || 'CERTIFICATE').replace(/_/g, ' ')}
                      </Badge>
                      {cert.isVerified && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <BadgeCheck className="w-4 h-4" />
                          <span className="text-xs font-medium">Verified</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold truncate">{cert.title}</h3>
                    {cert.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cert.description}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Issued By</p>
                    <p className="font-medium truncate">{cert.issuedBy || 'JJMCOE'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Issued Date</p>
                    <p className="font-medium">{formatDate(cert.issuedAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Expiry Date</p>
                    <p className="font-medium">{cert.expiresAt ? formatDate(cert.expiresAt) : 'Never'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Certificate ID</p>
                    <p className="font-mono text-xs text-muted-foreground truncate">{cert.id.slice(0, 12)}...</p>
                  </div>
                </div>

                <Separator />

                {/* Blockchain hashes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground flex-shrink-0">Cert Hash:</span>
                    <code className="text-xs font-mono text-muted-foreground truncate flex-1">
                      {truncateHash(cert.certificateHash, 10)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => { copyToClipboard(cert.certificateHash); addToast('Hash copied!', 'success') }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  {cert.txHash && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground flex-shrink-0">TX Hash:</span>
                      <code className="text-xs font-mono text-muted-foreground truncate flex-1">
                        {truncateHash(cert.txHash, 10)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => { copyToClipboard(cert.txHash!); addToast('TX Hash copied!', 'success') }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs flex-1"
                    onClick={() => { setVerifyHash(cert.certificateHash); setVerifyResult(null); setVerifyDialogOpen(true) }}
                  >
                    <FileCheck className="w-3.5 h-3.5" /> Verify
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs flex-1"
                    onClick={() => handleDownload(cert)}
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Issue Certificate Dialog (Admin) */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Issue New Certificate
            </DialogTitle>
            <DialogDescription>
              Create and issue a new certificate for a user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certUser">Select User</Label>
              <Select
                value={issueForm.userId}
                onValueChange={(v) => setIssueForm((f) => ({ ...f, userId: v }))}
              >
                <SelectTrigger id="certUser">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role}) — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certTitle">Title</Label>
              <Input
                id="certTitle"
                placeholder="e.g., Full Stack Web Development"
                value={issueForm.title}
                onChange={(e) => setIssueForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certType">Type</Label>
              <Select
                value={issueForm.type}
                onValueChange={(v) => setIssueForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger id="certType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COURSE_COMPLETION">Course Completion</SelectItem>
                  <SelectItem value="EVENT_PARTICIPATION">Event Participation</SelectItem>
                  <SelectItem value="MENTORSHIP">Mentorship</SelectItem>
                  <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  <SelectItem value="PLACEMENT">Placement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certIssuedDate">Issue Date</Label>
                <Input
                  id="certIssuedDate"
                  type="date"
                  value={issueForm.issuedDate}
                  onChange={(e) => setIssueForm((f) => ({ ...f, issuedDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certExpiryMode">Expiry</Label>
                <Select
                  value={issueForm.expiryDate ? 'date' : 'never'}
                  onValueChange={(value) => {
                    if (value === 'never') {
                      setIssueForm((f) => ({ ...f, expiryDate: '' }))
                    } else {
                      setIssueForm((f) => ({ ...f, expiryDate: f.expiryDate || f.issuedDate }))
                    }
                  }}
                >
                  <SelectTrigger id="certExpiryMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="date">Choose expiry date</SelectItem>
                  </SelectContent>
                </Select>
                {issueForm.expiryDate && (
                  <Input
                    id="certExpiryDate"
                    type="date"
                    aria-label="Expiry date"
                    min={issueForm.issuedDate}
                    value={issueForm.expiryDate}
                    onChange={(e) => setIssueForm((f) => ({ ...f, expiryDate: e.target.value }))}
                    required
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certDesc">Description</Label>
              <Textarea
                id="certDesc"
                placeholder="Brief description of the certificate..."
                value={issueForm.description}
                onChange={(e) => setIssueForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certIssuer">Issued By</Label>
              <Input
                id="certIssuer"
                placeholder="JJMCOE AlumniNexus"
                value={issueForm.issuedBy}
                onChange={(e) => setIssueForm((f) => ({ ...f, issuedBy: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleIssueCertificate}
              disabled={issuing || !issueForm.userId || !issueForm.title}
              className="gap-2"
            >
              {issuing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Issue Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Certificate Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-emerald-600" />
              Verify Certificate
            </DialogTitle>
            <DialogDescription>
              Enter the certificate hash to verify its authenticity on the blockchain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verifyHashInput">Certificate Hash</Label>
              <Input
                id="verifyHashInput"
                placeholder="0x1234abcd..."
                value={verifyHash}
                onChange={(e) => setVerifyHash(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <Button onClick={handleVerify} disabled={verifyLoading || !verifyHash.trim()} className="w-full gap-2">
              {verifyLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              Verify Certificate
            </Button>

            {verifyResult && verifyResult !== 'not_found' && (
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">Certificate Verified!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Title</p>
                      <p className="font-medium">{verifyResult.title}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Type</p>
                      <Badge variant="secondary" className={CERT_TYPE_COLORS[verifyResult.type] || ''}>
                        {(verifyResult.type || 'CERTIFICATE').replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Issued By</p>
                      <p className="font-medium">{verifyResult.issuedBy}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Issued Date</p>
                      <p className="font-medium">{formatDate(verifyResult.issuedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {verifyResult === 'not_found' && (
              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="p-4 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">Certificate Not Found</p>
                    <p className="text-sm text-muted-foreground">The provided hash does not match any certificate in our records.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== NOTIFICATIONS VIEW ====================

const NOTIF_ICON_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  INFO: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  SUCCESS: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  ERROR: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  REMINDER: { icon: Bell, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
}

export function NotificationsView() {
  const currentUser = useAppStore((s) => s.currentUser)
  const notifications = useAppStore((s) => s.notifications)
  const setNotifications = useAppStore((s) => s.setNotifications)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const setCurrentView = useAppStore((s) => s.setCurrentView)
  const addToast = useAppStore((s) => s.addToast)

  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const res = await fetch(`/api/events?action=notifications&userId=${currentUser.id}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, setNotifications])

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchNotifications() }, 0)
    return () => window.clearTimeout(timer)
  }, [fetchNotifications])

  const filteredNotifications =
    tab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkAllRead = async () => {
    if (!currentUser) return
    try {
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, isRead: true }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to mark notifications as read')
      notifications
        .filter((n) => !n.isRead)
        .forEach((n) => markNotificationRead(n.id))
      addToast('All notifications marked as read', 'success')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to mark notifications as read', 'error')
    }
  }

  const handleNotificationClick = async (notif: typeof notifications[0]) => {
    if (!notif.isRead) {
      try {
        const response = await fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notif.id, userId: currentUser?.id, isRead: true }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to mark notification as read')
        markNotificationRead(notif.id)
      } catch (error) {
        addToast(error instanceof Error ? error.message : 'Unable to mark notification as read', 'error')
        return
      }
    }
    if (notif.link) {
      const viewMap: Record<string, 'dashboard' | 'jobs' | 'events' | 'mentorship' | 'profile' | 'analytics' | 'payments' | 'certificates' | 'notifications' | 'applications' | 'user-management'> = {
        dashboard: 'dashboard',
        jobs: 'jobs',
        events: 'events',
        mentorship: 'mentorship',
        profile: 'profile',
        analytics: 'analytics',
        payments: 'payments',
        certificates: 'certificates',
        notifications: 'notifications',
        applications: 'applications',
        'user-management': 'user-management',
      }
      const targetView = viewMap[notif.link]
      if (targetView) {
        setCurrentView(targetView)
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground text-sm">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.` : 'You\'re all caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
            <CheckCircle2 className="w-4 h-4" /> Mark All Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            All
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5">
            Unread
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {unreadCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  {tab === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {tab === 'unread'
                    ? 'All caught up! No unread notifications.'
                    : 'Notifications will appear here when there are updates.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notif) => {
                const config = NOTIF_ICON_MAP[notif.type] || NOTIF_ICON_MAP['INFO']
                const NotifIcon = config.icon
                return (
                  <Card
                    key={notif.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notif.isRead ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${config.bgColor}`}>
                        <NotifIcon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={`text-sm font-semibold truncate ${!notif.isRead ? '' : 'text-muted-foreground'}`}>
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                      {notif.link && (
                        <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

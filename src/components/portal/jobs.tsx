'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAppStore, type Job, type Application } from '@/store/app-store'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Users,
  CalendarDays,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Send,
  UserSearch,
  Building2,
  GraduationCap,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HourglassIcon,
  FileText,
} from 'lucide-react'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi',
  'Coimbatore', 'Indore', 'Nagpur', 'Thiruvananthapuram', 'Bhopal',
  'Visakhapatnam', 'Surat', 'Vadodara', 'Noida', 'Gurgaon', 'Ghaziabad',
]

const JOB_TYPES = ['Full-time', 'Internship', 'Part-time', 'Contract', 'Freelance']

const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']

function formatSalary(min?: number | null, max?: number | null, currency?: string): string {
  if (!min && !max) return 'Not disclosed'
  const c = currency || 'INR'
  const fmt = (n: number) => `${(n / 100000).toFixed(n >= 100000 ? 1 : 0)}L`
  if (min && max) return `${c} ${fmt(min)} - ${fmt(max)}`
  if (min) return `From ${c} ${fmt(min)}`
  return `Up to ${c} ${fmt(max!)}`
}

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
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400'
    case 'PENDING':
    case 'REVIEWED':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400'
    case 'REJECTED':
    case 'CLOSED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

function typeBadgeVariant(type: string) {
  switch (type.toLowerCase()) {
    case 'full-time': return 'default' as const
    case 'internship': return 'secondary' as const
    case 'part-time': return 'outline' as const
    default: return 'outline' as const
  }
}

// ─── Jobs Listing ──────────────────────────────────────────────────────────────

function JobsListing() {
  const { jobs, setJobs, currentUser, setCurrentView, setSelectedJobId } = useAppStore()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  // Fetch jobs if store is empty
  useEffect(() => {
    if (jobs.length === 0) {
      fetch('/api/jobs')
        .then((r) => r.json())
        .then((data) => setJobs(data))
        .catch(() => {})
    }
  }, [jobs.length, setJobs])

  const filteredJobs = useMemo(() => {
    let result = jobs.filter((j) => j.status === 'OPEN' || j.status === 'ACTIVE')
    if (typeFilter !== 'All') {
      result = result.filter(
        (j) => j.type.toLowerCase() === typeFilter.toLowerCase()
      )
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
      )
    }
    return result
  }, [jobs, search, typeFilter])

  const canPostJob = currentUser?.role === 'PLACEMENT_CELL'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs Board</h1>
          <p className="text-sm text-muted-foreground">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'opportunity' : 'opportunities'} available
          </p>
        </div>
        {canPostJob && (
          <Button
            onClick={() => setCurrentView('post-job')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Post a Job
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title, company, or location..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Type Filter */}
      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Full-time">Full-time</TabsTrigger>
          <TabsTrigger value="Internship">Internship</TabsTrigger>
          <TabsTrigger value="Part-time">Part-time</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Job Grid */}
      {filteredJobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No jobs found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => {
                setSelectedJobId(job.id)
                setCurrentView('job-detail')
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors truncate">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      {job.company}
                    </p>
                  </div>
                  <Badge variant={typeBadgeVariant(job.type)} className="shrink-0">
                    {job.type}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {job.applicantsCount} {job.applicantsCount === 1 ? 'applicant' : 'applicants'}
                  </span>
                </div>

                {job.skills && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills
                      .split(',')
                      .slice(0, 4)
                      .map((skill) => (
                        <Badge
                          key={skill.trim()}
                          variant="outline"
                          className="text-[11px] font-normal px-2 py-0"
                        >
                          {skill.trim()}
                        </Badge>
                      ))}
                    {job.skills.split(',').length > 4 && (
                      <Badge variant="outline" className="text-[11px] font-normal px-2 py-0">
                        +{job.skills.split(',').length - 4} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Posted {formatDate(job.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Job Detail ────────────────────────────────────────────────────────────────

function JobDetail() {
  const { jobs, applications, currentUser, selectedJobId, setCurrentView, setSelectedJobId, addApplication, addToast, setLoading } = useAppStore()
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [applying, setApplying] = useState(false)

  const job = jobs.find((j) => j.id === selectedJobId)
  const hasApplied = job
    ? applications.some((a) => a.jobId === job.id && a.userId === currentUser?.id)
    : false

  const handleApply = async () => {
    if (!job || !currentUser) return
    if (!coverLetter.trim()) {
      addToast('Please write a cover letter to apply.', 'error')
      return
    }
    setApplying(true)
    setLoading(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          jobId: job.id,
          coverLetter: coverLetter.trim(),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        addToast(err.error || 'Failed to submit application.', 'error')
        return
      }
      const newApp = await res.json()
      addApplication(newApp)
      setShowApplyDialog(false)
      setCoverLetter('')
      addToast('Application submitted successfully!', 'success')
    } catch {
      addToast('Something went wrong. Please try again.', 'error')
    } finally {
      setApplying(false)
      setLoading(false)
    }
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Job not found</h3>
        <p className="mt-1 text-sm text-muted-foreground">This job may have been removed.</p>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => setCurrentView('jobs')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        className="gap-2 -ml-2"
        onClick={() => {
          setSelectedJobId(null)
          setCurrentView('jobs')
        }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Button>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Title Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
                <Badge variant={typeBadgeVariant(job.type)}>{job.type}</Badge>
                <Badge className={statusColor(job.status)}>{job.status}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{job.company}</p>
            </div>
            {currentUser?.role === 'STUDENT' && (
              <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
                <DialogTrigger asChild>
                  <Button disabled={hasApplied} className="gap-2 shrink-0">
                    <Send className="h-4 w-4" />
                    {hasApplied ? 'Already Applied' : 'Apply Now'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Apply for {job.title}</DialogTitle>
                    <DialogDescription>{job.company} &middot; {job.location}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Label htmlFor="cover-letter">Cover Letter</Label>
                    <Textarea
                      id="cover-letter"
                      placeholder="Write a compelling cover letter explaining why you are a great fit for this role..."
                      rows={6}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleApply} disabled={applying || !coverLetter.trim()} className="gap-2">
                      {applying ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Separator />

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{job.applicantsCount} {job.applicantsCount === 1 ? 'applicant' : 'applicants'}</span>
            </div>
            {job.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>Deadline: {formatDate(job.deadline)}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Requirements</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {job.requirements}
              </p>
            </div>
          )}

          {/* Skills */}
          {job.skills && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.split(',').map((skill) => (
                  <Badge key={skill.trim()} variant="outline">
                    {skill.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {job.experienceRequired && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Experience Required</h2>
              <p className="text-sm text-muted-foreground">{job.experienceRequired}</p>
            </div>
          )}

          {/* Posted Info */}
          <Separator />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Posted {formatDate(job.createdAt)}</span>
            {job.postedByName && <span>by {job.postedByName}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Post Job Form ─────────────────────────────────────────────────────────────

function PostJobForm({ editJob }: { editJob?: Job | null }) {
  const { currentUser, setCurrentView, addJob, addToast, setLoading, jobs } = useAppStore()

  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    type: '',
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: '',
    skills: '',
    experienceRequired: '',
    deadline: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editJob) {
      const timer = window.setTimeout(() => setForm({
          title: editJob.title,
          company: editJob.company,
          location: editJob.location,
          type: editJob.type,
          salaryMin: editJob.salaryMin?.toString() || '',
          salaryMax: editJob.salaryMax?.toString() || '',
          description: editJob.description,
          requirements: editJob.requirements,
          skills: editJob.skills || '',
          experienceRequired: editJob.experienceRequired || '',
          deadline: editJob.deadline || '',
        }), 0)
      return () => window.clearTimeout(timer)
    }
  }, [editJob])

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Job title is required'
    if (!form.company.trim()) errs.company = 'Company name is required'
    if (!form.location) errs.location = 'Location is required'
    if (!form.type) errs.type = 'Job type is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    if (!form.requirements.trim()) errs.requirements = 'Requirements are required'
    if (form.salaryMin && isNaN(Number(form.salaryMin))) errs.salaryMin = 'Must be a number'
    if (form.salaryMax && isNaN(Number(form.salaryMax))) errs.salaryMax = 'Must be a number'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location,
        type: form.type,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        description: form.description.trim(),
        requirements: form.requirements.trim(),
        skills: form.skills.trim() || null,
        experienceRequired: form.experienceRequired.trim() || null,
        postedById: currentUser?.id,
        deadline: form.deadline || null,
      }

      let res: Response
      if (editJob) {
        body.jobId = editJob.id
        res = await fetch('/api/jobs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) {
        const err = await res.json()
        addToast(err.error || 'Failed to save job.', 'error')
        return
      }

      const savedJob = await res.json()
      if (!editJob) {
        addJob(savedJob)
      } else {
        // Update in store by refreshing
        const { setJobs } = useAppStore.getState()
        const updatedJobs = jobs.map((j) => (j.id === savedJob.id ? savedJob : j))
        setJobs(updatedJobs)
      }

      addToast(editJob ? 'Job updated successfully!' : 'Job posted successfully!', 'success')
      setCurrentView(editJob ? 'manage-jobs' : 'jobs')
    } catch {
      addToast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (currentUser?.role !== 'PLACEMENT_CELL') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold">Job posting is managed by Placement Cell</h1>
        <p className="mt-2 text-sm text-muted-foreground">Recruiters can coordinate job opportunities through the Placement Cell.</p>
        <Button className="mt-4" onClick={() => setCurrentView('jobs')}>Back to Jobs</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView(editJob ? 'manage-jobs' : 'jobs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {editJob ? 'Edit Job' : 'Post a New Job'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {editJob ? 'Update the job details below' : 'Fill in the details to publish a new opportunity'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title *</Label>
              <Input
                id="job-title"
                placeholder="e.g. Senior Software Engineer"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="job-company">Company *</Label>
              <Input
                id="job-company"
                placeholder="e.g. Google India"
                value={form.company}
                onChange={(e) => updateField('company', e.target.value)}
              />
              {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
            </div>

            {/* Location & Type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Location *</Label>
                <Select value={form.location} onValueChange={(v) => updateField('location', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
              </div>
              <div className="space-y-2">
                <Label>Job Type *</Label>
                <Select value={form.type} onValueChange={(v) => updateField('type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
              </div>
            </div>

            {/* Salary */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salary-min">Minimum Salary (INR)</Label>
                <Input
                  id="salary-min"
                  type="number"
                  placeholder="e.g. 600000"
                  value={form.salaryMin}
                  onChange={(e) => updateField('salaryMin', e.target.value)}
                />
                {errors.salaryMin && <p className="text-xs text-destructive">{errors.salaryMin}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary-max">Maximum Salary (INR)</Label>
                <Input
                  id="salary-max"
                  type="number"
                  placeholder="e.g. 1200000"
                  value={form.salaryMax}
                  onChange={(e) => updateField('salaryMax', e.target.value)}
                />
                {errors.salaryMax && <p className="text-xs text-destructive">{errors.salaryMax}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="job-desc">Description *</Label>
              <Textarea
                id="job-desc"
                placeholder="Describe the role, responsibilities, and what the candidate will be working on..."
                rows={5}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label htmlFor="job-req">Requirements *</Label>
              <Textarea
                id="job-req"
                placeholder="List the key requirements and qualifications for this role..."
                rows={4}
                value={form.requirements}
                onChange={(e) => updateField('requirements', e.target.value)}
              />
              {errors.requirements && <p className="text-xs text-destructive">{errors.requirements}</p>}
            </div>

            {/* Skills & Experience */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job-skills">Skills (comma-separated)</Label>
                <Input
                  id="job-skills"
                  placeholder="e.g. React, Node.js, TypeScript"
                  value={form.skills}
                  onChange={(e) => updateField('skills', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-exp">Experience Required</Label>
                <Input
                  id="job-exp"
                  placeholder="e.g. 2-4 years"
                  value={form.experienceRequired}
                  onChange={(e) => updateField('experienceRequired', e.target.value)}
                />
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="job-deadline">Application Deadline</Label>
              <Input
                id="job-deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => updateField('deadline', e.target.value)}
              />
            </div>
          </CardContent>

          <div className="flex justify-end gap-3 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentView(editJob ? 'manage-jobs' : 'jobs')}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              {editJob ? (
                <>
                  <Pencil className="h-4 w-4" />
                  Update Job
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Post Job
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

// ─── Manage Jobs ───────────────────────────────────────────────────────────────

function ManageJobs() {
  const { jobs, currentUser, setCurrentView, setSelectedJobId, addToast, setLoading } = useAppStore()
  const [editingJob, setEditingJob] = useState<Job | null>(null)

  const myJobs = jobs.filter((j) => j.postedById === currentUser?.id)

  const handleDelete = async (jobId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs?id=${jobId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        addToast(err.error || 'Failed to delete job.', 'error')
        return
      }
      const { setJobs } = useAppStore.getState()
      setJobs(jobs.filter((j) => j.id !== jobId))
      addToast('Job deleted.', 'success')
    } catch {
      addToast('Something went wrong.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (job: Job) => {
    setLoading(true)
    try {
      const newStatus = job.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE'
      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        addToast(err.error || 'Failed to update job.', 'error')
        return
      }
      const { setJobs } = useAppStore.getState()
      setJobs(jobs.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)))
      addToast(`Job ${newStatus === 'ACTIVE' ? 'reopened' : 'closed'}.`, 'success')
    } catch {
      addToast('Something went wrong.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (editingJob) {
    return <PostJobForm editJob={editingJob} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {myJobs.length} {myJobs.length === 1 ? 'job' : 'jobs'} posted by you
          </p>
        </div>
        <Button onClick={() => setCurrentView('post-job')} className="gap-2">
          <Plus className="h-4 w-4" />
          Post New Job
        </Button>
      </div>

      {myJobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No jobs posted yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first job posting to start receiving applications.
            </p>
            <Button className="mt-4 gap-2" onClick={() => setCurrentView('post-job')}>
              <Plus className="h-4 w-4" />
              Post a Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myJobs.map((job) => (
            <Card key={job.id} className="transition-all hover:shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{job.title}</h3>
                      <Badge variant={typeBadgeVariant(job.type)}>{job.type}</Badge>
                      <Badge className={statusColor(job.status)}>{job.status}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {job.applicantsCount} {job.applicantsCount === 1 ? 'applicant' : 'applicants'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        setSelectedJobId(job.id)
                        setCurrentView('applications')
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Applications
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setEditingJob(job)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(job)}
                    >
                      {job.status === 'ACTIVE' ? 'Close' : 'Reopen'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={() => handleDelete(job.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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

// ─── My Applications (Student) ─────────────────────────────────────────────────

function MyApplications() {
  const { applications, currentUser, setCurrentView, setSelectedJobId } = useAppStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const myApps = applications.filter((a) => a.userId === currentUser?.id)

  const statusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACCEPTED': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />
      case 'REVIEWED': return <Eye className="h-4 w-4 text-amber-500" />
      default: return <HourglassIcon className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (myApps.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No applications yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse available jobs and start applying to opportunities that match your skills.
            </p>
            <Button className="mt-4 gap-2" onClick={() => setCurrentView('jobs')}>
              <Briefcase className="h-4 w-4" />
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
        <p className="text-sm text-muted-foreground">
          Tracking {myApps.length} {myApps.length === 1 ? 'application' : 'applications'}
        </p>
      </div>

      <div className="space-y-3">
        {myApps.map((app) => (
          <Card key={app.id} className="transition-all hover:shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div
                className="cursor-pointer"
                onClick={() =>
                  setExpandedId((prev) => (prev === app.id ? null : app.id))
                }
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {statusIcon(app.status)}
                    <div className="min-w-0">
                      <h3
                        className="font-semibold hover:text-primary transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (app.jobId) {
                            setSelectedJobId(app.jobId)
                            setCurrentView('job-detail')
                          }
                        }}
                      >
                        {app.jobTitle || 'Untitled Job'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {app.companyName} &middot; Applied {formatDate(app.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColor(app.status)}>{app.status}</Badge>
                    {expandedId === app.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Cover Letter */}
                {expandedId === app.id && app.coverLetter && (
                  <div className="mt-4 rounded-md bg-muted/50 p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                      Cover Letter
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {app.coverLetter}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Received Applications (Recruiter) ─────────────────────────────────────────

function ReceivedApplications() {
  const { applications, currentUser, updateApplication, addToast, setLoading, jobs, setCurrentView, setSelectedJobId } = useAppStore()

  const myJobs = jobs.filter((j) => j.postedById === currentUser?.id)
  const myJobIds = new Set(myJobs.map((j) => j.id))
  const receivedApps = applications.filter((a) => myJobIds.has(a.jobId))

  const handleStatusUpdate = async (applicationId: string, status: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status }),
      })
      if (!res.ok) {
        const err = await res.json()
        addToast(err.error || 'Failed to update application.', 'error')
        return
      }
      updateApplication(applicationId, { status })
      addToast(`Application ${status.toLowerCase()}.`, 'success')
    } catch {
      addToast('Something went wrong.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (receivedApps.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Received Applications</h1>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No applications received</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Applications from candidates will appear here once they start applying to your jobs.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Received Applications</h1>
          <p className="text-sm text-muted-foreground">
            {receivedApps.length} {receivedApps.length === 1 ? 'application' : 'applications'} to review
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setCurrentView('manage-jobs')}>
          <Briefcase className="h-4 w-4" />
          Manage Jobs
        </Button>
      </div>

      <div className="space-y-3">
        {receivedApps.map((app) => (
          <Card key={app.id} className="transition-all hover:shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {app.userName
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{app.userName || 'Unknown Candidate'}</h3>
                    <p className="text-sm text-muted-foreground truncate">{app.userEmail || ''}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Applied for{' '}
                      <span
                        className="font-medium text-foreground hover:text-primary cursor-pointer"
                        onClick={() => {
                          setSelectedJobId(app.jobId)
                          setCurrentView('job-detail')
                        }}
                      >
                        {app.jobTitle || 'this job'}
                      </span>
                      {' '}at {app.companyName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(app.createdAt)}
                    </p>
                    {app.coverLetter && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {app.coverLetter}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge className={statusColor(app.status)}>{app.status}</Badge>
                  {app.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleStatusUpdate(app.id, 'ACCEPTED')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
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
        ))}
      </div>
    </div>
  )
}

// ─── Candidate Search ──────────────────────────────────────────────────────────

function CandidateSearch() {
  const { users, setSelectedUserId, setCurrentView } = useAppStore()
  const [search, setSearch] = useState('')

  const students = useMemo(() => {
    let result = users.filter((u) => u.role === 'STUDENT')
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q) ||
          u.skills?.toLowerCase().includes(q)
      )
    }
    return result
  }, [users, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Candidate Search</h1>
        <p className="text-sm text-muted-foreground">
          Find and connect with talented students from the alumni network.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, department, or skills..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {students.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserSearch className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No candidates found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => {
                setSelectedUserId(student.id)
                setCurrentView('profile')
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback>
                      {student.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{student.name}</h3>
                    {student.department && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {student.department}
                      </p>
                    )}
                  </div>
                </div>

                {student.skills && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {student.skills
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
                  </div>
                )}

                {student.gpa && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-medium">GPA:</span>
                    <span>{student.gpa.toFixed(1)}</span>
                  </div>
                )}

                {student.batch && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-medium">Batch:</span>
                    <span>{student.batch}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Export ────────────────────────────────────────────────────────────────

export function JobsView() {
  const { currentView, isLoading, currentUser } = useAppStore()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  switch (currentView) {
    case 'jobs':
      return <JobsListing />
    case 'job-detail':
      return <JobDetail />
    case 'post-job':
      return <PostJobForm />
    case 'manage-jobs':
      return <ManageJobs />
    case 'applications':
      if (currentUser?.role === 'RECRUITER') {
        return <ReceivedApplications />
      }
      return <MyApplications />
    case 'candidate-search':
      return <CandidateSearch />
    default:
      return <JobsListing />
  }
}

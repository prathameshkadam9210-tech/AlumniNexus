'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAppStore, type ViewName } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  GraduationCap,
  Building2,
  Briefcase,
  FileText,
  CheckCircle2,
  Plus,
  X,
  Sparkles,
  Download,
  Save,
  Shield,
  Star,
  Target,
  AlertTriangle,
  Camera,
  Loader2,
} from 'lucide-react'

// ============================================================
// Profile Form Component
// ============================================================

function formatSkillsForDisplay(skills: string | null | undefined): string {
  if (!skills) return ''
  try {
    const parsed = JSON.parse(skills)
    if (Array.isArray(parsed)) return parsed.join(', ')
  } catch {
    // If not JSON, return as-is (comma-separated)
  }
  return skills
}

function ProfileForm({ userId }: { userId: string }) {
  const { currentUser, updateUser, addToast, setLoading, setCurrentView } = useAppStore()
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailOtp, setEmailOtp] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatar || null)
  const [form, setForm] = useState(() => ({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    bio: currentUser?.bio || '',
    department: currentUser?.department || '',
    location: currentUser?.location || '',
    skills: formatSkillsForDisplay(currentUser?.skills),
    linkedinUrl: currentUser?.linkedinUrl || '',
    batch: currentUser?.batch || '',
    graduationYear: currentUser?.graduationYear?.toString() || '',
    gpa: currentUser?.gpa?.toString() || '',
    resumeUrl: currentUser?.resumeUrl || '',
    company: currentUser?.company || '',
    designation: currentUser?.designation || '',
    experience: currentUser?.experience || '',
  }))

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!currentUser) return
    if (form.email.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
      if (emailOtpSent) {
        addToast('Verify the code sent to your new email before saving profile changes.', 'info')
        return
      }
      setSaving(true)
      try {
        const response = await fetch('/api/auth/change-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, actorId: currentUser.id, email: form.email }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to send email verification code')
        setEmailOtpSent(true)
        addToast(result.message || 'Verification code sent to your new email.', 'success')
      } catch (error) {
        addToast(error instanceof Error ? error.message : 'Unable to send email verification code', 'error')
      } finally {
        setSaving(false)
      }
      return
    }

    setSaving(true)
    setLoading(true)
    try {
      const skillsStr = form.skills
        ? JSON.stringify(form.skills.split(',').map(s => s.trim()).filter(Boolean))
        : null

      const body: Record<string, unknown> = {
        userId,
        actorId: currentUser.id,
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        bio: form.bio || null,
        department: form.department || null,
        location: form.location || null,
        skills: skillsStr,
        linkedinUrl: form.linkedinUrl || null,
      }

      if (currentUser?.role === 'STUDENT' || currentUser?.role === 'ALUMNI') {
        body.batch = form.batch || null
        body.graduationYear = form.graduationYear ? parseInt(form.graduationYear) : null
      }
      if (currentUser?.role === 'STUDENT') {
        body.gpa = form.gpa ? parseFloat(form.gpa) : null
        body.resumeUrl = form.resumeUrl || null
      }
      if (currentUser?.role === 'ALUMNI' || currentUser?.role === 'RECRUITER') {
        body.company = form.company || null
        body.designation = form.designation || null
      }
      if (currentUser?.role === 'ALUMNI') {
        body.experience = form.experience || null
      }

      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update profile')
      }

      updateUser(userId, body)
      addToast('Profile updated successfully', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
      setLoading(false)
    }
  }

  const handleVerifyEmailChange = async () => {
    if (!currentUser || !emailOtp.trim()) {
      addToast('Enter the verification code sent to your new email.', 'error')
      return
    }
    setSaving(true)
    try {
      const response = await fetch('/api/auth/change-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, actorId: currentUser.id, otp: emailOtp }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Email verification failed')
      updateUser(userId, { email: result.user.email })
      setForm((previous) => ({ ...previous, email: result.user.email }))
      setEmailOtp('')
      setEmailOtpSent(false)
      addToast('New email verified and saved. Save your other profile changes when ready.', 'success')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Email verification failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      addToast('Image must be under 2MB', 'error')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      addToast('Only JPG, PNG, GIF, WebP allowed', 'error')
      return
    }

    setUploadingAvatar(true)
    try {
      // Show preview immediately
      const reader = new FileReader()
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append('avatar', file)
      formData.append('userId', userId)
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()

      // Save avatar URL to DB
      await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, actorId: currentUser?.id, avatar: data.avatarUrl }),
      })
      if (!res.ok) throw new Error('Failed to save profile photo')
      updateUser(userId, { avatar: data.avatarUrl })
      addToast('Profile photo updated!', 'success')
    } catch {
      addToast('Failed to upload image', 'error')
      setAvatarPreview(currentUser?.avatar || null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const role = currentUser?.role || 'STUDENT'
  const isStudent = role === 'STUDENT'
  const isAlumni = role === 'ALUMNI'
  const isRecruiter = role === 'RECRUITER'

  return (
    <div className="space-y-6">
      {/* Avatar Section with Upload */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
          <Avatar className="h-28 w-28 text-2xl ring-4 ring-emerald-100 dark:ring-emerald-900/50 transition-all group-hover:ring-emerald-300">
            {avatarPreview ? (
              <img src={avatarPreview} alt={currentUser?.name} className="h-full w-full object-cover rounded-full" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-base font-semibold leading-tight text-center px-2">
                {currentUser?.name || 'User'}
              </AvatarFallback>
            )}
          </Avatar>
          {/* Upload overlay */}
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploadingAvatar ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-white">
                <Camera className="h-6 w-6" />
                <span className="text-[10px] font-medium">Change</span>
              </div>
            )}
          </div>
          {currentUser?.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 z-10">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}
          <input
            id="avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {role.replace('_', ' ')}
            </Badge>
            {currentUser?.isVerified && (
              <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300">
                <Shield className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Click avatar to upload (max 2MB, JPG/PNG/WebP)</p>
        </div>
      </div>

      <Separator />

      {/* Profile Form */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Common Fields - Left Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Personal Information</h3>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                className="pl-9"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => {
                  handleChange('email', e.target.value)
                  setEmailOtpSent(false)
                  setEmailOtp('')
                }}
                className="pl-9"
                placeholder="your.email@example.com"
              />
            </div>
            {form.email.trim().toLowerCase() !== currentUser?.email.toLowerCase() && (
              <p className="text-xs text-muted-foreground">Save will send a one-time verification code. The new email is not saved until you verify it.</p>
            )}
            {emailOtpSent && (
              <div className="flex gap-2">
                <Input
                  aria-label="Email verification code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(event) => setEmailOtp(event.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                />
                <Button type="button" variant="outline" onClick={handleVerifyEmailChange} disabled={saving}>
                  Verify
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="pl-9"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={e => handleChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="department"
                value={form.department}
                onChange={e => handleChange('department', e.target.value)}
                className="pl-9"
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={form.location}
                onChange={e => handleChange('location', e.target.value)}
                className="pl-9"
                placeholder="City, Country"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
            <Textarea
              id="skills"
              value={form.skills}
              onChange={e => handleChange('skills', e.target.value)}
              placeholder="React, TypeScript, Node.js, Python"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="linkedin"
                value={form.linkedinUrl}
                onChange={e => handleChange('linkedinUrl', e.target.value)}
                className="pl-9"
                placeholder="https://linkedin.com/in/yourname"
              />
            </div>
          </div>
        </div>

        {/* Role-Specific Fields - Right Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {isStudent ? 'Student Details' : isAlumni ? 'Alumni Details' : 'Professional Details'}
          </h3>

          {(isStudent || isAlumni) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="batch">Batch</Label>
                <Input
                  id="batch"
                  value={form.batch}
                  onChange={e => handleChange('batch', e.target.value)}
                  placeholder="e.g. 2022-2023 passout batch"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  value={form.graduationYear}
                  onChange={e => handleChange('graduationYear', e.target.value)}
                  placeholder="2024"
                />
              </div>
            </>
          )}

          {isStudent && (
            <>
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.01"
                  value={form.gpa}
                  onChange={e => handleChange('gpa', e.target.value)}
                  placeholder="3.8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumeUrl">Resume URL</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resumeUrl"
                    value={form.resumeUrl}
                    onChange={e => handleChange('resumeUrl', e.target.value)}
                    className="pl-9"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setCurrentView('resume-builder')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Open Resume Builder
              </Button>
            </>
          )}

          {(isAlumni || isRecruiter) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    value={form.company}
                    onChange={e => handleChange('company', e.target.value)}
                    className="pl-9"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="designation"
                    value={form.designation}
                    onChange={e => handleChange('designation', e.target.value)}
                    className="pl-9"
                    placeholder="Job title"
                  />
                </div>
              </div>
            </>
          )}

          {isAlumni && (
            <div className="space-y-2">
              <Label htmlFor="experience">Experience</Label>
              <Input
                id="experience"
                value={form.experience}
                onChange={e => handleChange('experience', e.target.value)}
                placeholder="e.g. 5 years"
              />
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
          {saving ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Resume Builder Component (Students Only)
// ============================================================

interface ResumeSection {
  degree: string
  college: string
  year: string
  gpa: string
}

interface ResumeExperience {
  company: string
  role: string
  duration: string
  description: string
}

interface ResumeProject {
  title: string
  tech: string
  description: string
  link: string
}

function ResumeBuilder({ userId }: { userId: string }) {
  const { currentUser, updateUser, addToast, setLoading, setCurrentView } = useAppStore()
  const [saving, setSaving] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [objective, setObjective] = useState('')
  const [targetRole, setTargetRole] = useState(currentUser?.designation || 'Software Engineer')
  const [certifications, setCertifications] = useState('')
  const [achievements, setAchievements] = useState('')
  const [education, setEducation] = useState<ResumeSection>({
    degree: '',
    college: '',
    year: '',
    gpa: '',
  })
  const [experiences, setExperiences] = useState<ResumeExperience[]>([])
  const [projects, setProjects] = useState<ResumeProject[]>([])
  const [aiReview, setAiReview] = useState<{
    score: number
    sections: { name: string; score: number; feedback: string }[]
    suggestions: string[]
  } | null>(null)

  // Auto-fill from profile
  useEffect(() => {
    if (currentUser) {
      const timer = window.setTimeout(() => setEducation({
          degree: currentUser.department || '',
          college: '',
          year: currentUser.graduationYear?.toString() || '',
          gpa: currentUser.gpa?.toString() || '',
        }), 0)
      if (currentUser.skills) {
        const timer = window.setTimeout(() => {
          try {
            const parsed = JSON.parse(currentUser.skills as string)
            if (Array.isArray(parsed)) setSkills(parsed)
          } catch {
            setSkills(currentUser.skills?.split(',').map(s => s.trim()).filter(Boolean) || [])
          }
        }, 0)
        return () => window.clearTimeout(timer)
      }
      return () => window.clearTimeout(timer)
    }
  }, [currentUser])

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed])
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill))
  }

  const addExperience = () => {
    setExperiences(prev => [...prev, { company: '', role: '', duration: '', description: '' }])
  }

  const updateExperience = (idx: number, field: keyof ResumeExperience, value: string) => {
    setExperiences(prev => prev.map((exp, i) => (i === idx ? { ...exp, [field]: value } : exp)))
  }

  const removeExperience = (idx: number) => {
    setExperiences(prev => prev.filter((_, i) => i !== idx))
  }

  const addProject = () => {
    setProjects(prev => [...prev, { title: '', tech: '', description: '', link: '' }])
  }

  const updateProject = (idx: number, field: keyof ResumeProject, value: string) => {
    setProjects(prev => prev.map((proj, i) => (i === idx ? { ...proj, [field]: value } : proj)))
  }

  const removeProject = (idx: number) => {
    setProjects(prev => prev.filter((_, i) => i !== idx))
  }

  const handleAIReview = async () => {
    setReviewing(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume-review',
          data: {
            skills,
            experience: experiences,
            education,
            projects,
            objective,
            targetRole,
            certifications,
            achievements,
          },
        }),
      })
      if (!res.ok) throw new Error('AI review failed')
      const result = await res.json()
      setAiReview(result)
      addToast('Resume review completed', 'success')
    } catch {
      addToast('Failed to get AI review', 'error')
    } finally {
      setReviewing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setLoading(true)
    try {
      const skillsStr = skills.length > 0 ? JSON.stringify(skills) : null
      const body: Record<string, unknown> = {
        userId,
        skills: skillsStr,
        department: education.degree || null,
        graduationYear: education.year ? parseInt(education.year) : null,
        gpa: education.gpa ? parseFloat(education.gpa) : null,
      }

      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to save resume data')
      updateUser(userId, body)
      addToast('Resume data saved to profile', 'success')
    } catch {
      addToast('Failed to save resume data', 'error')
    } finally {
      setSaving(false)
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const getInitials = () => {
    return currentUser?.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">AI Resume Builder</h2>
          <p className="text-sm text-muted-foreground">Build and optimize your resume with AI assistance</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setCurrentView('profile')}>
            Back to Profile
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : <Save className="h-4 w-4 mr-1" />}
            Save to Profile
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form Sections */}
        <div className="space-y-4">
          <Accordion type="multiple" defaultValue={['personal', 'skills', 'education', 'experience', 'projects']} className="w-full">
            {/* Personal Info */}
            <AccordionItem value="personal">
              <AccordionTrigger>Personal Info <Badge variant="secondary" className="ml-2 text-xs">Auto-filled</Badge></AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input value={currentUser?.name || ''} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input value={currentUser?.email || ''} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone</Label>
                    <Input value={currentUser?.phone || ''} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Location</Label>
                    <Input value={currentUser?.location || ''} disabled />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Objective */}
            <AccordionItem value="objective">
              <AccordionTrigger>Objective / Summary</AccordionTrigger>
              <AccordionContent>
                <Textarea
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  placeholder="A motivated Computer Science student seeking a software engineering internship..."
                  rows={3}
                  className="mt-1"
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="target-role">
              <AccordionTrigger>Target Role</AccordionTrigger>
              <AccordionContent>
                <Input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Frontend Developer" />
                <p className="text-xs text-muted-foreground mt-1">Use this role to tailor your ATS keywords and AI review.</p>
              </AccordionContent>
            </AccordionItem>

            {/* Skills */}
            <AccordionItem value="skills">
              <AccordionTrigger>Skills <Badge variant="secondary" className="ml-2 text-xs">{skills.length} added</Badge></AccordionTrigger>
              <AccordionContent>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSkill()
                      }
                    }}
                    placeholder="Type a skill and press Enter"
                    className="flex-1"
                  />
                  <Button size="sm" onClick={addSkill} type="button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-sm text-muted-foreground">No skills added yet. Start typing to add skills.</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Education */}
            <AccordionItem value="education">
              <AccordionTrigger>Education</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Degree / Department</Label>
                    <Input
                      value={education.degree}
                      onChange={e => setEducation(prev => ({ ...prev, degree: e.target.value }))}
                      placeholder="B.Tech in Computer Science"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">College / University</Label>
                    <Input
                      value={education.college}
                      onChange={e => setEducation(prev => ({ ...prev, college: e.target.value }))}
                      placeholder="University Name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Year</Label>
                      <Input
                        value={education.year}
                        onChange={e => setEducation(prev => ({ ...prev, year: e.target.value }))}
                        placeholder="2024"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">GPA</Label>
                      <Input
                        value={education.gpa}
                        onChange={e => setEducation(prev => ({ ...prev, gpa: e.target.value }))}
                        placeholder="3.8"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Experience */}
            <AccordionItem value="experience">
              <AccordionTrigger>Experience <Badge variant="secondary" className="ml-2 text-xs">{experiences.length}</Badge></AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-1">
                  {experiences.map((exp, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Experience #{idx + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeExperience(idx)} className="h-6 w-6 p-0 text-destructive">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={exp.company}
                            onChange={e => updateExperience(idx, 'company', e.target.value)}
                            placeholder="Company"
                            className="text-sm"
                          />
                          <Input
                            value={exp.role}
                            onChange={e => updateExperience(idx, 'role', e.target.value)}
                            placeholder="Role"
                            className="text-sm"
                          />
                        </div>
                        <Input
                          value={exp.duration}
                          onChange={e => updateExperience(idx, 'duration', e.target.value)}
                          placeholder="Duration (e.g., May 2023 - Aug 2023)"
                          className="text-sm"
                        />
                        <Textarea
                          value={exp.description}
                          onChange={e => updateExperience(idx, 'description', e.target.value)}
                          placeholder="Key responsibilities and achievements..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </Card>
                  ))}
                  <Button variant="outline" size="sm" onClick={addExperience} className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Experience
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Projects */}
            <AccordionItem value="projects">
              <AccordionTrigger>Projects <Badge variant="secondary" className="ml-2 text-xs">{projects.length}</Badge></AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-1">
                  {projects.map((proj, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Project #{idx + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeProject(idx)} className="h-6 w-6 p-0 text-destructive">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid gap-2">
                        <Input
                          value={proj.title}
                          onChange={e => updateProject(idx, 'title', e.target.value)}
                          placeholder="Project title"
                          className="text-sm"
                        />
                        <Input
                          value={proj.tech}
                          onChange={e => updateProject(idx, 'tech', e.target.value)}
                          placeholder="Technologies used (comma-separated)"
                          className="text-sm"
                        />
                        <Textarea
                          value={proj.description}
                          onChange={e => updateProject(idx, 'description', e.target.value)}
                          placeholder="Brief description of the project..."
                          rows={2}
                          className="text-sm"
                        />
                        <Input
                          value={proj.link}
                          onChange={e => updateProject(idx, 'link', e.target.value)}
                          placeholder="Project link (GitHub, live URL)"
                          className="text-sm"
                        />
                      </div>
                    </Card>
                  ))}
                  <Button variant="outline" size="sm" onClick={addProject} className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Project
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="certifications">
              <AccordionTrigger>Certifications & Achievements</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <Textarea value={certifications} onChange={e => setCertifications(e.target.value)} placeholder="AWS Cloud Practitioner&#10;Google Data Analytics" rows={3} />
                <Textarea value={achievements} onChange={e => setAchievements(e.target.value)} placeholder="Hackathon winner, scholarship, leadership, measurable achievement..." rows={3} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* AI Review Button */}
          <Button
            onClick={handleAIReview}
            disabled={reviewing || (skills.length === 0 && !objective)}
            className="w-full"
            size="lg"
          >
            {reviewing ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {reviewing ? 'Analyzing Resume...' : 'AI Review Resume'}
          </Button>

          {/* AI Review Results */}
          {aiReview && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  AI Resume Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Circular Score */}
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
                      <circle
                        cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6"
                        className={getScoreColor(aiReview.score)}
                        strokeDasharray={`${(aiReview.score / 100) * 264} 264`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(aiReview.score)}`}>{aiReview.score}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Overall Assessment</p>
                    <p className="text-muted-foreground">
                      {aiReview.score >= 80 ? 'Excellent resume! Minor improvements possible.' : aiReview.score >= 60 ? 'Good resume with room for improvement.' : 'Resume needs significant improvements.'}
                    </p>
                  </div>
                </div>

                {/* Section Scores */}
                {aiReview.sections && aiReview.sections.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Section Scores</p>
                    {aiReview.sections.map((section, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{section.name}</span>
                          <span className={getScoreColor(section.score)}>{section.score}/100</span>
                        </div>
                        <Progress value={section.score} className="h-2" />
                        {section.feedback && <p className="text-xs text-muted-foreground">{section.feedback}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {aiReview.suggestions && aiReview.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Suggestions
                    </p>
                    <ul className="space-y-1.5">
                      {aiReview.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Live Resume Preview */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <Card className="overflow-hidden print:shadow-none print:border-none">
              <div className="p-1 bg-muted text-center">
                <span className="text-xs text-muted-foreground font-medium">Live Preview</span>
              </div>
              <CardContent className="p-6 print:p-8 bg-white text-black" id="resume-preview">
                {/* Resume Header */}
                <div className="text-center border-b border-gray-300 pb-4 mb-4">
                  <h1 className="text-2xl font-bold">{currentUser?.name || 'Your Name'}</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {[currentUser?.email, currentUser?.phone, currentUser?.location].filter(Boolean).join(' | ')}
                  </p>
                  {currentUser?.linkedinUrl && (
                    <p className="text-sm text-blue-600 mt-1">{currentUser.linkedinUrl}</p>
                  )}
                </div>

                {/* Objective */}
                {objective && (
                  <div className="mb-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Objective</h2>
                    <p className="text-sm text-gray-700">{objective}</p>
                  </div>
                )}

                {targetRole && <p className="text-sm font-medium text-gray-700 mb-4">Target: {targetRole}</p>}

                {/* Education */}
                {(education.degree || education.college) && (
                  <div className="mb-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Education</h2>
                    <div className="text-sm">
                      <p className="font-medium">{education.degree}</p>
                      {education.college && <p className="text-gray-600">{education.college}</p>}
                      <p className="text-gray-500">
                        {[education.year, education.gpa ? `GPA: ${education.gpa}` : ''].filter(Boolean).join(' | ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Skills</h2>
                    <p className="text-sm text-gray-700">{skills.join(' • ')}</p>
                  </div>
                )}

                {/* Experience */}
                {experiences.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Experience</h2>
                    <div className="space-y-3">
                      {experiences.map((exp, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex justify-between">
                            <p className="font-medium">{exp.role}{exp.company ? ` — ${exp.company}` : ''}</p>
                            <p className="text-gray-500 text-xs">{exp.duration}</p>
                          </div>
                          {exp.description && <p className="text-gray-600 mt-1">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {projects.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Projects</h2>
                    <div className="space-y-3">
                      {projects.map((proj, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">{proj.title}</p>
                            {proj.link && (
                              <span className="text-xs text-blue-600">{proj.link}</span>
                            )}
                          </div>
                          {proj.tech && <p className="text-gray-500 text-xs">{proj.tech}</p>}
                          {proj.description && <p className="text-gray-600 mt-1">{proj.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {certifications && <div className="mb-4"><h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Certifications</h2><p className="text-sm text-gray-700 whitespace-pre-line">{certifications}</p></div>}
                {achievements && <div className="mb-4"><h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Achievements</h2><p className="text-sm text-gray-700 whitespace-pre-line">{achievements}</p></div>}

                {/* Empty State */}
                {!objective && !education.degree && skills.length === 0 && experiences.length === 0 && projects.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Fill in the sections on the left to see your resume preview here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Export
// ============================================================

interface ProfileViewProps {
  view: 'profile' | 'resume-builder'
}

export function ProfileView({ view }: ProfileViewProps) {
  const { currentUser, isLoading, selectedUserId, setSelectedUserId, setCurrentView } = useAppStore()
  const [viewedProfile, setViewedProfile] = useState<{ id: string; user: import('@/store/app-store').User } | null>(null)
  const [profileError, setProfileError] = useState<{ id: string; message: string } | null>(null)

  useEffect(() => {
    if (!currentUser || !selectedUserId || selectedUserId === currentUser.id) return
    let cancelled = false
    fetch(`/api/auth?id=${encodeURIComponent(selectedUserId)}&viewerId=${encodeURIComponent(currentUser.id)}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load this profile')
        if (!cancelled) setViewedProfile({ id: selectedUserId, user: data })
      })
      .catch((error) => {
        if (!cancelled) setProfileError({
          id: selectedUserId,
          message: error instanceof Error ? error.message : 'Unable to load this profile',
        })
      })
    return () => { cancelled = true }
  }, [currentUser?.id, selectedUserId])

  if (isLoading || !currentUser) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex justify-center">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (view === 'resume-builder') {
    if (currentUser.role !== 'STUDENT') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold">Resume Builder</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            The resume builder is available for students only. Switch to a student account to access this feature.
          </p>
        </div>
      )
    }
    return <ResumeBuilder userId={currentUser.id} />
  }

  if (selectedUserId && selectedUserId !== currentUser.id) {
    if (profileError?.id === selectedUserId) {
      return <div role="alert" className="p-6 text-destructive">{profileError.message}</div>
    }
    if (viewedProfile?.id !== selectedUserId) {
      return <div className="space-y-4 p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-lg" /></div>
    }

    const viewedUser = viewedProfile.user
    const skills = formatSkillsForDisplay(viewedUser.skills)
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{viewedUser.name}&apos;s Profile</h1>
            <p className="text-muted-foreground text-sm">Profile details and resume</p>
          </div>
          <Button variant="outline" onClick={() => {
            setSelectedUserId(null)
            setCurrentView(currentUser.role === 'RECRUITER' ? 'candidate-search' : 'user-management')
          }}>Back</Button>
        </div>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-3"><Avatar><AvatarFallback>{viewedUser.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>{viewedUser.name}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <p><span className="font-medium">Role: </span>{viewedUser.role}</p>
            <p><span className="font-medium">Email: </span>{viewedUser.email}</p>
            <p><span className="font-medium">Department: </span>{viewedUser.department || '—'}</p>
            <p><span className="font-medium">Batch: </span>{viewedUser.batch || '—'}</p>
            <p><span className="font-medium">Phone: </span>{viewedUser.phone || '—'}</p>
            <p><span className="font-medium">Location: </span>{viewedUser.location || '—'}</p>
            {viewedUser.company && <p><span className="font-medium">Company: </span>{viewedUser.company}</p>}
            {viewedUser.designation && <p><span className="font-medium">Designation: </span>{viewedUser.designation}</p>}
            {viewedUser.gpa !== null && viewedUser.gpa !== undefined && <p><span className="font-medium">GPA: </span>{viewedUser.gpa}</p>}
            {viewedUser.bio && <p className="sm:col-span-2"><span className="font-medium">Bio: </span>{viewedUser.bio}</p>}
            {skills && <p className="sm:col-span-2"><span className="font-medium">Skills: </span>{skills}</p>}
            {viewedUser.linkedinUrl && <p className="sm:col-span-2"><a className="text-primary underline" href={viewedUser.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn profile</a></p>}
            {viewedUser.resumeUrl && <p className="sm:col-span-2"><a className="text-primary underline" href={viewedUser.resumeUrl} target="_blank" rel="noreferrer">View or download resume</a></p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal information and preferences</p>
      </div>
      <ProfileForm key={currentUser.id} userId={currentUser.id} />
    </div>
  )
}

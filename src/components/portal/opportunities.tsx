'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DEPARTMENTS } from '@/lib/departments'
import { ExternalLink, Lightbulb } from 'lucide-react'

interface Opportunity {
  id: string
  title: string
  company: string
  type: string
  department?: string | null
  location?: string | null
  description: string
  applicationUrl?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  status: string
  createdAt: string
  submittedBy?: { name?: string; role?: string }
}

const STATUSES = ['SUBMITTED', 'REVIEWING', 'PUBLISHED', 'CLOSED', 'REJECTED']

export function OpportunityView() {
  const currentUser = useAppStore((state) => state.currentUser)
  const addToast = useAppStore((state) => state.addToast)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    company: '',
    type: 'JOB',
    department: currentUser?.department || '',
    location: '',
    description: '',
    applicationUrl: '',
    salaryMin: '',
    salaryMax: '',
  })
  const canSubmit = currentUser?.role === 'ALUMNI' || currentUser?.role === 'RECRUITER'
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'PLACEMENT_CELL'

  const loadOpportunities = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const response = await fetch(`/api/opportunities?actorId=${encodeURIComponent(currentUser.id)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load opportunities')
      setOpportunities(Array.isArray(data) ? data : [])
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to load opportunities', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, currentUser])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadOpportunities() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadOpportunities])

  const submitOpportunity = async (event: import('react').FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentUser) return
    setSaving(true)
    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, actorId: currentUser.id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to share opportunity')
      setOpportunities((items) => [data, ...items])
      setForm({ title: '', company: '', type: 'JOB', department: '', location: '', description: '', applicationUrl: '', salaryMin: '', salaryMax: '' })
      addToast('Opportunity shared with the placement cell', 'success')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to share opportunity', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (opportunityId: string, status: string) => {
    if (!currentUser) return
    try {
      const response = await fetch('/api/opportunities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: currentUser.id, opportunityId, status }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to update opportunity')
      setOpportunities((items) => items.map((item) => item.id === opportunityId ? { ...item, status: data.status } : item))
      addToast('Opportunity status updated', 'success')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to update opportunity', 'error')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Career opportunities</h1>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? 'Review jobs and internships submitted by alumni and recruiters.'
            : 'Share jobs and internships with the placement cell for students.'}
        </p>
      </div>

      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4 text-emerald-600" />Share an opportunity</CardTitle>
            <CardDescription>The placement cell will review and coordinate suitable opportunities.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submitOpportunity(event)}>
              <div className="space-y-2">
                <Label htmlFor="opportunity-title">Role or internship title</Label>
                <Input id="opportunity-title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opportunity-company">Company</Label>
                <Input id="opportunity-company" required value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Opportunity type</Label>
                <Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JOB">Job</SelectItem>
                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target department (optional)</Label>
                <Select value={form.department || 'ALL'} onValueChange={(department) => setForm({ ...form, department: department === 'ALL' ? '' : department })}>
                  <SelectTrigger><SelectValue placeholder="All departments" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All departments</SelectItem>
                    {DEPARTMENTS.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="opportunity-location">Location (optional)</Label>
                <Input id="opportunity-location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="opportunity-description">Details</Label>
                <Textarea id="opportunity-description" required rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="opportunity-link">Application link (optional)</Label>
                <Input id="opportunity-link" type="url" value={form.applicationUrl} onChange={(event) => setForm({ ...form, applicationUrl: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opportunity-salary-min">Minimum package per year (INR, optional)</Label>
                <Input id="opportunity-salary-min" type="number" min="0" value={form.salaryMin} onChange={(event) => setForm({ ...form, salaryMin: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opportunity-salary-max">Maximum package per year (INR, optional)</Label>
                <Input id="opportunity-salary-max" type="number" min="0" value={form.salaryMax} onChange={(event) => setForm({ ...form, salaryMax: event.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? 'Sharing...' : 'Share with placement cell'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading opportunities...</p> :
          opportunities.length === 0 ? <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No opportunities have been shared yet.</CardContent></Card> :
            opportunities.map((opportunity) => (
              <Card key={opportunity.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{opportunity.title}</h2>
                      <Badge variant="outline">{opportunity.type}</Badge>
                      <Badge>{opportunity.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {opportunity.company}{opportunity.location ? ` · ${opportunity.location}` : ''}
                      {opportunity.department ? ` · ${opportunity.department}` : ''}
                      {opportunity.submittedBy?.name ? ` · Shared by ${opportunity.submittedBy.name}` : ''}
                    </p>
                    {(opportunity.salaryMin !== null && opportunity.salaryMin !== undefined ||
                      opportunity.salaryMax !== null && opportunity.salaryMax !== undefined) && (
                      <p className="text-sm text-muted-foreground">
                        Package: {opportunity.salaryMin != null ? `₹${opportunity.salaryMin.toLocaleString('en-IN')}` : '—'}
                        {' – '}
                        {opportunity.salaryMax != null ? `₹${opportunity.salaryMax.toLocaleString('en-IN')}` : '—'} per year
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-sm">{opportunity.description}</p>
                    {opportunity.applicationUrl && (
                      <a className="inline-flex items-center gap-1 text-sm text-primary underline" href={opportunity.applicationUrl} target="_blank" rel="noreferrer">
                        Application details <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {canManage && (
                    <Select value={opportunity.status} onValueChange={(status) => void updateStatus(opportunity.id, status)}>
                      <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  )
}

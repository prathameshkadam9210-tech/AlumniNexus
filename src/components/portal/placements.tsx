'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAppStore, type User } from '@/store/app-store'
import { DEPARTMENTS, getDepartmentChartLabel, normalizeDepartment } from '@/lib/departments'
import { getGraduationYearOptions, getStartYearOptions } from '@/lib/batches'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RoleAnalyticsChart } from '@/components/portal/role-analytics-chart'
import { BriefcaseBusiness, Building2, GraduationCap } from 'lucide-react'

interface PlacementRecord {
  id: string
  studentId: string
  company: string
  title: string
  mode: 'ON_CAMPUS' | 'OFF_CAMPUS'
  status: 'SELECTED' | 'PLACED' | 'DECLINED'
  packageAmount: number | null
  packageCurrency: string
  placementDate: string
  student: Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'department' | 'batch' | 'graduationYear'>
  createdBy?: { name: string }
}

export function PlacementsView() {
  const currentUser = useAppStore((state) => state.currentUser)
  const users = useAppStore((state) => state.users)
  const addToast = useAppStore((state) => state.addToast)
  const [records, setRecords] = useState<PlacementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [department, setDepartment] = useState('')
  const [startYear, setStartYear] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [form, setForm] = useState({
    studentId: '',
    company: '',
    title: '',
    mode: 'ON_CAMPUS',
    status: 'PLACED',
    packageAmount: '',
    placementDate: new Date().toISOString().slice(0, 10),
  })
  const isMainAdmin = currentUser?.role === 'ADMIN' && currentUser.department === 'Administration'
  const canAddPlacement = currentUser?.role === 'PLACEMENT_CELL'
  const canFilterDepartment = currentUser?.role === 'PLACEMENT_CELL' || isMainAdmin
  const students = useMemo(() => users.filter((user) => user.role === 'STUDENT' || user.role === 'ALUMNI'), [users])
  const startYears = useMemo(() => getStartYearOptions(students), [students])
  const graduationYears = useMemo(() => getGraduationYearOptions(students), [students])

  const loadRecords = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    const params = new URLSearchParams({ actorId: currentUser.id })
    if (department) params.set('department', department)
    if (startYear) params.set('startYear', startYear)
    if (graduationYear) params.set('graduationYear', graduationYear)
    try {
      const response = await fetch(`/api/placements?${params}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load placement records')
      setRecords(Array.isArray(data) ? data : [])
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to load placement records', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, currentUser, department, graduationYear, startYear])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadRecords])

  const onCampus = new Set(records.filter((record) => record.mode === 'ON_CAMPUS' && record.status !== 'DECLINED').map((record) => record.studentId)).size
  const offCampus = new Set(records.filter((record) => record.mode === 'OFF_CAMPUS' && record.status !== 'DECLINED').map((record) => record.studentId)).size
  const selected = new Set(records.filter((record) => record.status === 'SELECTED').map((record) => record.studentId)).size
  const placed = new Set(records.filter((record) => record.status === 'PLACED').map((record) => record.studentId)).size
  const maxModeCount = Math.max(onCampus, offCampus, 1)
  const departmentStats = new Map<string, { selected: Set<string>; placed: Set<string> }>()
  const batchStats = new Map<string, { selected: Set<string>; placed: Set<string> }>()
  for (const record of records) {
    const name = normalizeDepartment(record.student.department) || 'Unspecified'
    const stats = departmentStats.get(name) || { selected: new Set<string>(), placed: new Set<string>() }
    if (record.status === 'SELECTED') stats.selected.add(record.studentId)
    if (record.status === 'PLACED') stats.placed.add(record.studentId)
    departmentStats.set(name, stats)

    const batch = record.student.batch || record.student.graduationYear?.toString() || 'Batch not recorded'
    const batchCounts = batchStats.get(batch) || { selected: new Set<string>(), placed: new Set<string>() }
    if (record.status === 'SELECTED') batchCounts.selected.add(record.studentId)
    if (record.status === 'PLACED') batchCounts.placed.add(record.studentId)
    batchStats.set(batch, batchCounts)
  }
  const departmentRows = Array.from(departmentStats, ([name, stats]) => ({
    label: getDepartmentChartLabel(name),
    selected: stats.selected.size,
    placed: stats.placed.size,
  })).sort((a, b) => b.placed - a.placed)
  const batchRows = Array.from(batchStats, ([label, stats]) => ({
    label,
    selected: stats.selected.size,
    placed: stats.placed.size,
  })).sort((a, b) => a.label.localeCompare(b.label))

  const addPlacement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentUser) return
    setSaving(true)
    try {
      const response = await fetch('/api/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, actorId: currentUser.id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to add placement record')
      addToast('Placement record added', 'success')
      setForm((value) => ({ ...value, studentId: '', company: '', title: '', packageAmount: '' }))
      await loadRecords()
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to add placement record', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateRecord = async (record: PlacementRecord, key: 'mode' | 'status', value: string) => {
    if (!currentUser) return
    try {
      const response = await fetch('/api/placements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: currentUser.id, placementId: record.id, [key]: value }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to update placement record')
      setRecords((items) => items.map((item) => item.id === record.id ? { ...item, [key]: value } : item))
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to update placement record', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Placement outcomes</h1>
        <p className="text-sm text-muted-foreground">Track selected and placed students by department, batch, and campus route.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Total records</p><p className="text-2xl font-bold">{records.length}</p></div><GraduationCap className="h-6 w-6 text-emerald-600" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">On campus</p><p className="text-2xl font-bold">{onCampus}</p></div><Building2 className="h-6 w-6 text-blue-600" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Off campus</p><p className="text-2xl font-bold">{offCampus}</p></div><BriefcaseBusiness className="h-6 w-6 text-violet-600" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Selected / placed</p><p className="text-2xl font-bold">{selected} / {placed}</p></div><GraduationCap className="h-6 w-6 text-amber-600" /></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Campus placement comparison</CardTitle><CardDescription>Counts reflect the active department and batch filters.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {[{ label: 'On campus', value: onCampus, color: 'bg-blue-600' }, { label: 'Off campus', value: offCampus, color: 'bg-violet-600' }].map((item) => (
            <div key={item.label} className="grid grid-cols-[90px_1fr_40px] items-center gap-3 text-sm">
              <span>{item.label}</span>
              <div className="h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / maxModeCount) * 100}%` }} /></div>
              <span className="text-right font-medium">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <RoleAnalyticsChart
          title="Selected students by department"
          data={departmentRows.map(({ label, selected: value }) => ({ label, value }))}
          color="#0891b2"
        />
        <RoleAnalyticsChart
          title="Placed students by department"
          data={departmentRows.map(({ label, placed: value }) => ({ label, value }))}
          color="#4f46e5"
        />
        <RoleAnalyticsChart
          title="Selected students by batch"
          data={batchRows.map(({ label, selected: value }) => ({ label, value }))}
          color="#0891b2"
        />
        <RoleAnalyticsChart
          title="Placed students by batch"
          data={batchRows.map(({ label, placed: value }) => ({ label, value }))}
          color="#4f46e5"
        />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Department and batch filters</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {canFilterDepartment && (
            <Select value={department || 'ALL'} onValueChange={(value) => setDepartment(value === 'ALL' ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="All departments" /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">All departments</SelectItem>{DEPARTMENTS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Select value={startYear || 'ALL'} onValueChange={(value) => setStartYear(value === 'ALL' ? '' : value)}>
            <SelectTrigger><SelectValue placeholder="All intake years" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">All intake years</SelectItem>{startYears.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={graduationYear || 'ALL'} onValueChange={(value) => setGraduationYear(value === 'ALL' ? '' : value)}>
            <SelectTrigger><SelectValue placeholder="All graduation years" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">All graduation years</SelectItem>{graduationYears.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {canAddPlacement && (
      <Card>
        <CardHeader><CardTitle className="text-base">Record a student outcome</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(event) => void addPlacement(event)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-1">
              <Label>Student</Label>
              <Select value={form.studentId} onValueChange={(studentId) => setForm({ ...form, studentId })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((student) => <SelectItem key={student.id} value={student.id}>{student.name} · {student.department || 'No department'} · {student.batch || 'No batch'}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="placement-company">Company</Label><Input id="placement-company" required value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="placement-title">Role</Label><Input id="placement-title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="placement-package">Annual package (INR)</Label><Input id="placement-package" type="number" min="0" step="0.01" value={form.packageAmount} onChange={(event) => setForm({ ...form, packageAmount: event.target.value })} /></div>
            <div className="space-y-2"><Label>Placement route</Label><Select value={form.mode} onValueChange={(mode) => setForm({ ...form, mode })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ON_CAMPUS">On campus</SelectItem><SelectItem value="OFF_CAMPUS">Off campus</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Outcome</Label><Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SELECTED">Selected</SelectItem><SelectItem value="PLACED">Placed</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="placement-date">Date</Label><Input id="placement-date" type="date" required value={form.placementDate} onChange={(event) => setForm({ ...form, placementDate: event.target.value })} /></div>
            <Button type="submit" disabled={saving || !form.studentId} className="sm:col-span-2 lg:col-span-3">{saving ? 'Saving...' : 'Add placement record'}</Button>
          </form>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Placement records</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading records...</p> :
            records.length === 0 ? <p className="py-5 text-center text-sm text-muted-foreground">No records match the selected filters.</p> :
              records.map((record) => (
                <div key={record.id} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{record.student.name} · {record.title}</p>
                    <p className="text-sm text-muted-foreground">{record.company} · {record.student.department || 'No department'} · {record.student.batch || 'No batch'} · {new Date(record.placementDate).toLocaleDateString('en-IN')}</p>
                    {record.packageAmount != null && <p className="mt-1 text-sm font-medium">{record.packageCurrency} {record.packageAmount.toLocaleString('en-IN')} per year</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{record.mode.replace('_', ' ')}</Badge>
                    <Select value={record.mode} onValueChange={(mode) => void updateRecord(record, 'mode', mode)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="ON_CAMPUS">On campus</SelectItem><SelectItem value="OFF_CAMPUS">Off campus</SelectItem></SelectContent>
                    </Select>
                    <Select value={record.status} onValueChange={(status) => void updateRecord(record, 'status', status)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="SELECTED">Selected</SelectItem><SelectItem value="PLACED">Placed</SelectItem><SelectItem value="DECLINED">Declined</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
        </CardContent>
      </Card>
    </div>
  )
}

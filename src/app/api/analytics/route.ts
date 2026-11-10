import { db } from '@/lib/db'
import { getBatchWhereFilter } from '@/lib/batches'
import { getDepartmentAliases, normalizeDepartment } from '@/lib/departments'
import { getDepartmentJobScope } from '@/lib/job-scope'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const searchParams = new URL(req.url).searchParams
    const actorId = searchParams.get('actorId')
    if (!actorId) return NextResponse.json({ error: 'Actor ID is required' }, { status: 400 })
    const actor = await db.user.findUnique({
      where: { id: actorId },
      select: { role: true, department: true },
    })
    if (!actor || !['ADMIN', 'PLACEMENT_CELL'].includes(actor.role)) {
      return NextResponse.json({ error: 'Only admins and placement staff can view analytics' }, { status: 403 })
    }
    if (searchParams.get('departmentDistribution') === 'true') {
      if (actor.role !== 'ADMIN' || !actor.department || actor.department === 'Administration') {
        return NextResponse.json({ error: 'Department distribution is only available to department admins' }, { status: 403 })
      }

      const batchValue = searchParams.get('batch')
      const graduationYearValue = searchParams.get('graduationYear') || batchValue
      const startYearValue = searchParams.get('startYear')
      const graduationYear = graduationYearValue && /^\d{4}$/.test(graduationYearValue) ? Number(graduationYearValue) : undefined
      const startYear = startYearValue && /^\d{4}$/.test(startYearValue) ? Number(startYearValue) : undefined
      const studentCounts = await db.user.groupBy({
        by: ['department'],
        where: {
          role: 'STUDENT',
          ...(startYear || graduationYear ? getBatchWhereFilter({ startYear, graduationYear }) : {}),
        },
        _count: { _all: true },
      })
      const distribution = new Map<string, number>()
      for (const item of studentCounts) {
        const department = normalizeDepartment(item.department) || 'Unspecified'
        distribution.set(department, (distribution.get(department) || 0) + item._count._all)
      }
      const actorDepartment = normalizeDepartment(actor.department)
      if (actorDepartment && !distribution.has(actorDepartment)) distribution.set(actorDepartment, 0)

      return NextResponse.json(Array.from(distribution, ([department, value]) => ({ department, value })))
    }

    let department = searchParams.get('department') || undefined
    if (actor.role === 'ADMIN' && actor.department !== 'Administration') {
      if (!actor.department) return NextResponse.json({ error: 'Admin department is missing' }, { status: 403 })
      if (department && normalizeDepartment(department) !== normalizeDepartment(actor.department)) {
        return NextResponse.json({ error: 'You cannot view another department' }, { status: 403 })
      }
      department = actor.department
    }
    const batchValue = searchParams.get('batch')
    const graduationYearValue = searchParams.get('graduationYear') || batchValue
    const startYearValue = searchParams.get('startYear')
    const graduationYear = graduationYearValue && /^\d{4}$/.test(graduationYearValue) ? Number(graduationYearValue) : undefined
    const startYear = startYearValue && /^\d{4}$/.test(startYearValue) ? Number(startYearValue) : undefined
    const userFilter = {
      ...(department ? { department: { in: getDepartmentAliases(department) } } : {}),
      ...(startYear || graduationYear ? getBatchWhereFilter({ startYear, graduationYear }) : {}),
    }
    const hasUserFilter = Object.keys(userFilter).length > 0
    const userScope = hasUserFilter ? userFilter : undefined
    const jobScope = department
      ? await getDepartmentJobScope(department)
      : hasUserFilter
        ? { postedBy: userFilter }
        : undefined
    const eventScope = hasUserFilter ? { organizer: userFilter } : undefined
    const applicationScope = hasUserFilter ? { user: userFilter } : undefined
    const mentorshipScope = hasUserFilter
      ? { OR: [{ mentor: userFilter }, { mentee: userFilter }] }
      : undefined
    const placementScope = hasUserFilter ? { student: userFilter } : undefined
    const [
      totalUsers,
      totalStudents,
      totalAlumni,
      totalRecruiters,
      totalJobs,
      openJobs,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      totalMentorships,
      activeMentorships,
      totalEvents,
      verifiedUsers,
      placementRecords,
    ] = await Promise.all([
      db.user.count({ where: userScope }),
      db.user.count({ where: { ...userScope, role: 'STUDENT' } }),
      db.user.count({ where: { ...userScope, role: 'ALUMNI' } }),
      db.user.count({ where: { ...userScope, role: 'RECRUITER' } }),
      db.job.count({ where: jobScope }),
      db.job.count({ where: { ...jobScope, status: 'OPEN' } }),
      db.application.count({ where: applicationScope }),
      db.application.count({ where: { ...applicationScope, status: 'PENDING' } }),
      db.application.count({ where: { ...applicationScope, status: 'ACCEPTED' } }),
      db.mentorship.count({ where: mentorshipScope }),
      db.mentorship.count({ where: { ...mentorshipScope, status: 'ACCEPTED' } }),
      db.event.count({ where: eventScope }),
      db.user.count({ where: { ...userScope, isVerified: true } }),
      db.placementOutcome.findMany({ where: placementScope, select: { studentId: true, mode: true, status: true } }),
    ])
    const onCampusPlacements = new Set(placementRecords.filter((record) =>
      record.mode === 'ON_CAMPUS' && ['SELECTED', 'PLACED'].includes(record.status),
    ).map((record) => record.studentId)).size
    const offCampusPlacements = new Set(placementRecords.filter((record) =>
      record.mode === 'OFF_CAMPUS' && ['SELECTED', 'PLACED'].includes(record.status),
    ).map((record) => record.studentId)).size
    const selectedStudents = new Set(placementRecords.filter((record) => record.status === 'SELECTED').map((record) => record.studentId)).size
    const placedStudents = new Set(placementRecords.filter((record) => record.status === 'PLACED').map((record) => record.studentId)).size

    const analytics = [
      { id: '1', metric: 'total_users', value: totalUsers, label: 'Total Users' },
      { id: '2', metric: 'total_students', value: totalStudents, label: 'Students' },
      { id: '3', metric: 'total_alumni', value: totalAlumni, label: 'Alumni' },
      { id: '4', metric: 'total_recruiters', value: totalRecruiters, label: 'Recruiters' },
      { id: '5', metric: 'total_jobs', value: totalJobs, label: 'Total Jobs Posted' },
      { id: '6', metric: 'open_jobs', value: openJobs, label: 'Open Positions' },
      { id: '7', metric: 'total_applications', value: totalApplications, label: 'Total Applications' },
      { id: '8', metric: 'pending_applications', value: pendingApplications, label: 'Pending Applications' },
      { id: '9', metric: 'accepted_applications', value: acceptedApplications, label: 'Hired' },
      { id: '10', metric: 'total_mentorships', value: totalMentorships, label: 'Mentorship Sessions' },
      { id: '11', metric: 'active_mentorships', value: activeMentorships, label: 'Active Mentorships' },
      { id: '12', metric: 'total_events', value: totalEvents, label: 'Events' },
      { id: '13', metric: 'verified_users', value: verifiedUsers, label: 'Verified Users' },
      { id: '14', metric: 'on_campus_placements', value: onCampusPlacements, label: 'On-campus Selected / Placed' },
      { id: '15', metric: 'off_campus_placements', value: offCampusPlacements, label: 'Off-campus Selected / Placed' },
      { id: '16', metric: 'selected_students', value: selectedStudents, label: 'Selected Students' },
      { id: '17', metric: 'placed_students', value: placedStudents, label: 'Placed Students' },
    ]

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

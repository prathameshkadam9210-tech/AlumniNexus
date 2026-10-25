import { db } from '@/lib/db'
import { getDepartmentAliases } from '@/lib/departments'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const department = new URL(req.url).searchParams.get('department') || undefined
    const departments = department ? getDepartmentAliases(department) : undefined
    const userScope = departments ? { department: { in: departments } } : undefined
    const jobScope = departments ? { postedBy: { department: { in: departments } } } : undefined
    const eventScope = departments ? { organizer: { department: { in: departments } } } : undefined
    const applicationScope = departments ? { user: { department: { in: departments } } } : undefined
    const mentorshipScope = departments ? {
      OR: [
        { mentor: { department: { in: departments } } },
        { mentee: { department: { in: departments } } },
      ],
    } : undefined
    // Generate real-time analytics from the database
    const totalUsers = await db.user.count({ where: userScope })
    const totalStudents = await db.user.count({ where: { ...userScope, role: 'STUDENT' } })
    const totalAlumni = await db.user.count({ where: { ...userScope, role: 'ALUMNI' } })
    const totalRecruiters = await db.user.count({ where: { ...userScope, role: 'RECRUITER' } })
    const totalJobs = await db.job.count({ where: jobScope })
    const openJobs = await db.job.count({ where: { ...jobScope, status: 'OPEN' } })
    const totalApplications = await db.application.count({ where: applicationScope })
    const pendingApplications = await db.application.count({ where: { ...applicationScope, status: 'PENDING' } })
    const acceptedApplications = await db.application.count({ where: { ...applicationScope, status: 'ACCEPTED' } })
    const totalMentorships = await db.mentorship.count({ where: mentorshipScope })
    const activeMentorships = await db.mentorship.count({ where: { ...mentorshipScope, status: 'ACCEPTED' } })
    const totalEvents = await db.event.count({ where: eventScope })
    const verifiedUsers = await db.user.count({ where: { ...userScope, isVerified: true } })

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
    ]

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

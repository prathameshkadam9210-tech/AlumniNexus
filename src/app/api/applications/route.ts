import { db } from '@/lib/db'
import { getDepartmentAliases, normalizeDepartment } from '@/lib/departments'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const actorId = searchParams.get('actorId') || searchParams.get('userId')
    const jobId = searchParams.get('jobId')

    if (!actorId) return NextResponse.json({ error: 'Actor ID required' }, { status: 400 })
    const actor = await db.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true, department: true },
    })
    if (!actor) return NextResponse.json({ error: 'Actor not found' }, { status: 404 })
    const where: Record<string, unknown> = {}
    if (jobId) where.jobId = jobId

    if (actor.role === 'STUDENT' || actor.role === 'ALUMNI') {
      where.userId = actor.id
    } else if (actor.role !== 'ADMIN' && actor.role !== 'PLACEMENT_CELL') {
      return NextResponse.json({ error: 'Only students and placement staff can view applications' }, { status: 403 })
    } else if (actor.role === 'ADMIN' && actor.department !== 'Administration' && actor.department) {
      where.user = { department: { in: getDepartmentAliases(actor.department) } }
    }

    const applications = await db.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, skills: true, department: true, batch: true, graduationYear: true } },
        job: { select: { title: true, company: true } },
      },
    })

    return NextResponse.json(applications.map(a => ({
      ...a,
      userName: a.user?.name,
      userEmail: a.user?.email,
      department: a.user?.department,
      batch: a.user?.batch,
      graduationYear: a.user?.graduationYear,
      jobTitle: a.job?.title,
      companyName: a.job?.company,
      createdAt: a.createdAt.toISOString(),
    })))
  } catch (error) {
    console.error('Applications GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, jobId, coverLetter } = body
    const applicant = typeof userId === 'string'
      ? await db.user.findUnique({ where: { id: userId }, select: { role: true } })
      : null
    if (!applicant || !['STUDENT', 'ALUMNI'].includes(applicant.role)) {
      return NextResponse.json({ error: 'Only students and alumni can apply for jobs' }, { status: 403 })
    }
    const job = await db.job.findUnique({ where: { id: jobId }, select: { status: true } })
    if (!job || job.status !== 'OPEN') return NextResponse.json({ error: 'This job is not open for applications' }, { status: 404 })

    // Check if already applied
    const existing = await db.application.findUnique({ where: { userId_jobId: { userId, jobId } } })
    if (existing) {
      return NextResponse.json({ error: 'Already applied to this job' }, { status: 409 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })

    const application = await db.application.create({
      data: { userId, jobId, coverLetter },
    })

    // Increment applicant count
    await db.job.update({
      where: { id: jobId },
      data: { applicantsCount: { increment: 1 } },
    })

    return NextResponse.json({
      ...application,
      userName: user?.name,
      userEmail: user?.email,
      createdAt: application.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Applications POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { actorId, applicationId, status } = body
    const actor = typeof actorId === 'string'
      ? await db.user.findUnique({ where: { id: actorId }, select: { role: true, department: true } })
      : null
    if (!actor || !['ADMIN', 'PLACEMENT_CELL'].includes(actor.role)) {
      return NextResponse.json({ error: 'Only placement staff can manage applications' }, { status: 403 })
    }

    if (!applicationId || !['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Application ID and status required' }, { status: 400 })
    }
    const existing = await db.application.findUnique({
      where: { id: applicationId },
      select: { user: { select: { department: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    if (actor.role === 'ADMIN' && actor.department !== 'Administration' &&
        (!actor.department || normalizeDepartment(actor.department) !== normalizeDepartment(existing.user.department))) {
      return NextResponse.json({ error: 'You cannot manage applications from another department' }, { status: 403 })
    }

    const application = await db.application.update({
      where: { id: applicationId },
      data: { status },
    })

    return NextResponse.json({ ...application, createdAt: application.createdAt.toISOString() })
  } catch (error) {
    console.error('Applications PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

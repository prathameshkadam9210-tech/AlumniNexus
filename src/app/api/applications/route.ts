import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const recruiterId = searchParams.get('recruiterId')
    const jobId = searchParams.get('jobId')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (jobId) where.jobId = jobId

    // If recruiter, get applications for their posted jobs
    if (recruiterId) {
      const jobs = await db.job.findMany({ where: { postedById: recruiterId }, select: { id: true } })
      const jobIds = jobs.map(j => j.id)
      where.jobId = { in: jobIds }
    }

    const applications = await db.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, skills: true } },
        job: { select: { title: true, company: true } },
      },
    })

    return NextResponse.json(applications.map(a => ({
      ...a,
      userName: a.user?.name,
      userEmail: a.user?.email,
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
    const { applicationId, status } = body

    if (!applicationId || !status) {
      return NextResponse.json({ error: 'Application ID and status required' }, { status: 400 })
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

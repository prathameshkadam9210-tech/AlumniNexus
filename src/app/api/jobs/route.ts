import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const postedById = searchParams.get('postedById')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'OPEN'

    const where: Record<string, unknown> = {}
    if (postedById) where.postedById = postedById
    if (type) where.type = type
    if (status && status !== 'ALL') where.status = status
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { company: { contains: search } },
        { location: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const jobs = await db.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        postedBy: { select: { name: true, company: true, designation: true } },
      },
    })

    return NextResponse.json(jobs.map(j => ({
      ...j,
      postedByName: j.postedBy?.name,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
    })))
  } catch (error) {
    console.error('Jobs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, company, location, type, salaryMin, salaryMax, description, requirements, skills, experienceRequired, postedById, deadline } = body

    const job = await db.job.create({
      data: {
        title,
        company,
        location,
        type: type || 'FULL_TIME',
        salaryMin,
        salaryMax,
        description,
        requirements,
        skills,
        experienceRequired,
        postedById,
        deadline: deadline ? new Date(deadline) : null,
        status: 'OPEN',
      },
    })

    return NextResponse.json({ ...job, createdAt: job.createdAt.toISOString() })
  } catch (error) {
    console.error('Jobs POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { jobId, ...data } = body

    if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 })

    const job = await db.job.update({
      where: { id: jobId },
      data: {
        title: data.title,
        company: data.company,
        location: data.location,
        type: data.type,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        description: data.description,
        requirements: data.requirements,
        skills: data.skills,
        experienceRequired: data.experienceRequired,
        status: data.status,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    })

    return NextResponse.json({ ...job, createdAt: job.createdAt.toISOString() })
  } catch (error) {
    console.error('Jobs PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('id')
    if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 })

    await db.application.deleteMany({ where: { jobId } })
    await db.job.delete({ where: { id: jobId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Jobs DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

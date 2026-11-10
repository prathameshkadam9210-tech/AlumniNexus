import { DEPARTMENTS, getDepartmentAliases, normalizeDepartment } from '@/lib/departments'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const STATUSES = ['SUBMITTED', 'REVIEWING', 'SHARED', 'PUBLISHED', 'CLOSED', 'REJECTED']
const TYPES = ['JOB', 'INTERNSHIP']

async function getActor(actorId: unknown) {
  if (typeof actorId !== 'string') return null
  return db.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true, department: true },
  })
}

export async function GET(req: NextRequest) {
  try {
    const actor = await getActor(req.nextUrl.searchParams.get('actorId'))
    if (!actor) return NextResponse.json({ error: 'Actor ID is required' }, { status: 400 })
    if (!['ADMIN', 'PLACEMENT_CELL', 'ALUMNI', 'RECRUITER'].includes(actor.role)) {
      return NextResponse.json({ error: 'You cannot view opportunities' }, { status: 403 })
    }

    const where = actor.role === 'PLACEMENT_CELL' || (actor.role === 'ADMIN' && actor.department === 'Administration')
      ? {}
      : actor.role === 'ADMIN' && actor.department
        ? { department: { in: getDepartmentAliases(actor.department) } }
        : { submittedById: actor.id }
    const opportunities = await db.placementOpportunity.findMany({
      where,
      include: { submittedBy: { select: { id: true, name: true, role: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(opportunities.map((opportunity) => ({
      ...opportunity,
      createdAt: opportunity.createdAt.toISOString(),
      updatedAt: opportunity.updatedAt.toISOString(),
    })))
  } catch (error) {
    console.error('Opportunities GET error:', error)
    return NextResponse.json({ error: 'Unable to load opportunities' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const actor = await getActor(body.actorId)
    if (!actor || !['ALUMNI', 'RECRUITER'].includes(actor.role)) {
      return NextResponse.json({ error: 'Only alumni and recruiters can share opportunities' }, { status: 403 })
    }
    if (typeof body.title !== 'string' || !body.title.trim() ||
        typeof body.company !== 'string' || !body.company.trim() ||
        typeof body.description !== 'string' || !body.description.trim() ||
        !TYPES.includes(body.type)) {
      return NextResponse.json({ error: 'Title, company, opportunity type, and description are required' }, { status: 400 })
    }
    if (body.applicationUrl && (typeof body.applicationUrl !== 'string' || !/^https?:\/\//i.test(body.applicationUrl))) {
      return NextResponse.json({ error: 'Enter a valid http or https application link' }, { status: 400 })
    }
    if (body.department && !DEPARTMENTS.includes(body.department)) {
      return NextResponse.json({ error: 'Choose a valid target department' }, { status: 400 })
    }
    const salaryMin = body.salaryMin === '' || body.salaryMin == null ? null : Number(body.salaryMin)
    const salaryMax = body.salaryMax === '' || body.salaryMax == null ? null : Number(body.salaryMax)
    if ((salaryMin !== null && (!Number.isFinite(salaryMin) || salaryMin < 0)) ||
        (salaryMax !== null && (!Number.isFinite(salaryMax) || salaryMax < 0)) ||
        (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin)) {
      return NextResponse.json({ error: 'Enter a valid salary range' }, { status: 400 })
    }

    const targetDepartment = typeof body.department === 'string' && body.department
      ? body.department
      : actor.department
    const departmentAdmins = targetDepartment ? getDepartmentAliases(targetDepartment) : []
    const opportunity = await db.$transaction(async (transaction) => {
      const created = await transaction.placementOpportunity.create({
        data: {
          submittedById: actor.id,
          title: body.title.trim(),
          company: body.company.trim(),
          type: body.type,
          department: targetDepartment ? normalizeDepartment(targetDepartment) : null,
          location: typeof body.location === 'string' ? body.location.trim() || null : null,
          description: body.description.trim(),
          applicationUrl: typeof body.applicationUrl === 'string' ? body.applicationUrl.trim() || null : null,
          salaryMin,
          salaryMax,
        },
      })
      const recipients = await transaction.user.findMany({
        where: {
          OR: [
            { role: 'PLACEMENT_CELL' },
            { role: 'ADMIN', department: 'Administration' },
            ...(departmentAdmins.length > 0 ? [{ role: 'ADMIN', department: { in: departmentAdmins } }] : []),
          ],
        },
        select: { id: true },
      })
      await transaction.notification.createMany({
        data: recipients.map((recipient) => ({
          userId: recipient.id,
          title: 'New career opportunity shared',
          message: `${created.company} shared a ${created.type.toLowerCase()} opportunity: ${created.title}.`,
          type: 'INFO',
        })),
      })
      return created
    })
    return NextResponse.json({
      ...opportunity,
      submittedBy: { id: actor.id, role: actor.role },
      createdAt: opportunity.createdAt.toISOString(),
      updatedAt: opportunity.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Opportunities POST error:', error)
    return NextResponse.json({ error: 'Unable to submit opportunity' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { actorId, opportunityId, status } = await req.json()
    const actor = await getActor(actorId)
    if (!actor || !['ADMIN', 'PLACEMENT_CELL'].includes(actor.role)) {
      return NextResponse.json({ error: 'Only admins and placement staff can manage opportunities' }, { status: 403 })
    }
    if (typeof opportunityId !== 'string' || !STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Choose a valid opportunity and status' }, { status: 400 })
    }
    const existing = await db.placementOpportunity.findUnique({ where: { id: opportunityId } })
    if (!existing) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    if (actor.role === 'ADMIN' && actor.department !== 'Administration' &&
        (!actor.department || normalizeDepartment(actor.department) !== normalizeDepartment(existing.department))) {
      return NextResponse.json({ error: 'You cannot manage opportunities for another department' }, { status: 403 })
    }
    if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      const published = await db.$transaction(async (transaction) => {
        const jobData = {
          title: existing.title,
          company: existing.company,
          location: existing.location || 'To be confirmed',
          type: existing.type === 'INTERNSHIP' ? 'INTERNSHIP' : 'FULL_TIME',
          salaryMin: existing.salaryMin,
          salaryMax: existing.salaryMax,
          description: existing.description,
          requirements: existing.description,
        }
        const priorJob = await transaction.job.findUnique({
          where: { sourceOpportunityId: existing.id },
          select: { id: true },
        })
        const job = priorJob
          ? await transaction.job.update({
              where: { id: priorJob.id },
              data: { ...jobData, status: 'OPEN' },
            })
          : await transaction.job.create({
              data: {
                ...jobData,
                postedById: existing.submittedById,
                status: 'OPEN',
                sourceOpportunityId: existing.id,
              },
            })
        const updatedOpportunity = await transaction.placementOpportunity.update({
          where: { id: opportunityId },
          data: { status: 'PUBLISHED' },
        })
        await transaction.notification.create({
          data: {
            userId: existing.submittedById,
            title: 'Opportunity published for students',
            message: `The placement cell published "${existing.title}" as an application opportunity.`,
            type: 'INFO',
          },
        })
        return { job, updatedOpportunity }
      })
      return NextResponse.json({
        ...published.updatedOpportunity,
        publishedJobId: published.job.id,
        createdAt: published.updatedOpportunity.createdAt.toISOString(),
        updatedAt: published.updatedOpportunity.updatedAt.toISOString(),
      })
    }
    const updated = await db.$transaction(async (transaction) => {
      const updatedOpportunity = await transaction.placementOpportunity.update({
        where: { id: opportunityId },
        data: { status },
      })
      await transaction.notification.create({
        data: {
          userId: existing.submittedById,
          title: 'Opportunity status updated',
          message: `The placement cell marked "${existing.title}" as ${status.toLowerCase()}.`,
          type: 'INFO',
        },
      })
      return updatedOpportunity
    })
    return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() })
  } catch (error) {
    console.error('Opportunities PUT error:', error)
    return NextResponse.json({ error: 'Unable to update opportunity' }, { status: 500 })
  }
}

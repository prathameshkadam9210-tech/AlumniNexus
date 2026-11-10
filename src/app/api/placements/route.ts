import { getBatchWhereFilter } from '@/lib/batches'
import { getDepartmentAliases, normalizeDepartment } from '@/lib/departments'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const MODES = ['ON_CAMPUS', 'OFF_CAMPUS']
const STATUSES = ['SELECTED', 'PLACED', 'DECLINED']

async function getActor(actorId: unknown) {
  if (typeof actorId !== 'string') return null
  return db.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true, department: true, company: true },
  })
}

function canManageDepartment(actor: { role: string; department: string | null }, department: string | null) {
  return actor.role === 'PLACEMENT_CELL' || actor.department === 'Administration' ||
    (!!actor.department && normalizeDepartment(actor.department) === normalizeDepartment(department))
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams
    const actor = await getActor(params.get('actorId'))
    if (!actor) return NextResponse.json({ error: 'Valid actor ID is required' }, { status: 403 })
    if (params.get('public') === 'true') {
      const records = await db.placementOutcome.findMany({
        where: { status: 'PLACED' },
        select: {
          id: true,
          company: true,
          title: true,
          packageAmount: true,
          packageCurrency: true,
          placementDate: true,
          student: { select: { name: true, avatar: true, department: true } },
        },
        orderBy: { placementDate: 'desc' },
        take: 8,
      })
      return NextResponse.json(records.map((record) => ({ ...record, placementDate: record.placementDate.toISOString() })))
    }

    if (actor.role === 'RECRUITER') {
      const batchValue = params.get('graduationYear')
      const startYearValue = params.get('startYear')
      const graduationYear = batchValue && /^\d{4}$/.test(batchValue) ? Number(batchValue) : undefined
      const startYear = startYearValue && /^\d{4}$/.test(startYearValue) ? Number(startYearValue) : undefined
      const requestedDepartment = params.get('department')
      const studentFilters = [
        ...(requestedDepartment ? [{ department: { in: getDepartmentAliases(requestedDepartment) } }] : []),
        ...(startYear || graduationYear ? getBatchWhereFilter({ startYear, graduationYear }).AND : []),
      ]
      const records = await db.placementOutcome.findMany({
        where: {
          company: actor.company || '__NO_COMPANY__',
          ...(studentFilters.length > 0 ? { student: { AND: studentFilters } } : {}),
        },
        select: {
          id: true,
          company: true,
          title: true,
          packageAmount: true,
          packageCurrency: true,
          mode: true,
          status: true,
          placementDate: true,
          student: { select: { id: true, name: true, avatar: true, department: true, batch: true, graduationYear: true } },
        },
        orderBy: { placementDate: 'desc' },
      })
      return NextResponse.json(records.map((record) => ({ ...record, placementDate: record.placementDate.toISOString() })))
    }
    if (!['ADMIN', 'PLACEMENT_CELL'].includes(actor.role)) {
      return NextResponse.json({ error: 'Only admins and recruiters can view placement records' }, { status: 403 })
    }

    const department = params.get('department')
    if (actor.role === 'ADMIN' && actor.department !== 'Administration' && department &&
        normalizeDepartment(department) !== normalizeDepartment(actor.department)) {
      return NextResponse.json({ error: 'You cannot view another department' }, { status: 403 })
    }
    const batchValue = params.get('graduationYear')
    const startYearValue = params.get('startYear')
    const graduationYear = batchValue && /^\d{4}$/.test(batchValue) ? Number(batchValue) : undefined
    const startYear = startYearValue && /^\d{4}$/.test(startYearValue) ? Number(startYearValue) : undefined
    const scopedDepartment = actor.role === 'ADMIN' && actor.department !== 'Administration'
      ? actor.department
      : department
    const studentFilters = [
      ...(scopedDepartment ? [{ department: { in: getDepartmentAliases(scopedDepartment) } }] : []),
      ...(startYear || graduationYear ? getBatchWhereFilter({ startYear, graduationYear }).AND : []),
    ]
    const where = studentFilters.length > 0 ? { student: { AND: studentFilters } } : {}
    const records = await db.placementOutcome.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true, department: true, batch: true, graduationYear: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { placementDate: 'desc' },
    })
    return NextResponse.json(records.map((record) => ({
      ...record,
      placementDate: record.placementDate.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    })))
  } catch (error) {
    console.error('Placements GET error:', error)
    return NextResponse.json({ error: 'Unable to load placement records' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const actor = await getActor(body.actorId)
    if (!actor || actor.role !== 'PLACEMENT_CELL') {
      return NextResponse.json({ error: 'Only placement cell staff can add placement records' }, { status: 403 })
    }
    if (typeof body.studentId !== 'string' || typeof body.company !== 'string' || !body.company.trim() ||
        typeof body.title !== 'string' || !body.title.trim() ||
        !MODES.includes(body.mode) || !STATUSES.includes(body.status || 'PLACED')) {
      return NextResponse.json({ error: 'Student, company, role, placement type, and status are required' }, { status: 400 })
    }
    const packageAmount = body.packageAmount === '' || body.packageAmount == null ? null : Number(body.packageAmount)
    if (packageAmount !== null && (!Number.isFinite(packageAmount) || packageAmount < 0)) {
      return NextResponse.json({ error: 'Enter a valid annual package amount in INR' }, { status: 400 })
    }
    const student = await db.user.findUnique({
      where: { id: body.studentId },
      select: { id: true, role: true, department: true },
    })
    if (!student || !['STUDENT', 'ALUMNI'].includes(student.role)) {
      return NextResponse.json({ error: 'Choose a student or alumni account' }, { status: 404 })
    }
    if (!canManageDepartment(actor, student.department)) {
      return NextResponse.json({ error: 'You cannot manage placements for another department' }, { status: 403 })
    }
    const placementDate = body.placementDate ? new Date(body.placementDate) : new Date()
    if (!Number.isFinite(placementDate.getTime())) {
      return NextResponse.json({ error: 'Enter a valid placement date' }, { status: 400 })
    }
    const record = await db.placementOutcome.create({
      data: {
        studentId: student.id,
        createdById: actor.id,
        company: body.company.trim(),
        title: body.title.trim(),
        packageAmount,
        mode: body.mode,
        status: body.status || 'PLACED',
        placementDate,
      },
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true, department: true, batch: true, graduationYear: true } },
        createdBy: { select: { name: true } },
      },
    })
    return NextResponse.json({ ...record, placementDate: record.placementDate.toISOString() }, { status: 201 })
  } catch (error) {
    console.error('Placements POST error:', error)
    return NextResponse.json({ error: 'Unable to create placement record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { actorId, placementId, status, mode } = await req.json()
    const actor = await getActor(actorId)
    if (!actor || !['ADMIN', 'PLACEMENT_CELL'].includes(actor.role)) {
      return NextResponse.json({ error: 'Only admins and placement staff can update placement records' }, { status: 403 })
    }
    if (typeof placementId !== 'string' ||
        (status !== undefined && !STATUSES.includes(status)) ||
        (mode !== undefined && !MODES.includes(mode)) ||
        (status === undefined && mode === undefined)) {
      return NextResponse.json({ error: 'Choose a valid placement record, status, or placement type' }, { status: 400 })
    }
    const existing = await db.placementOutcome.findUnique({
      where: { id: placementId },
      include: { student: { select: { department: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Placement record not found' }, { status: 404 })
    if (!canManageDepartment(actor, existing.student.department)) {
      return NextResponse.json({ error: 'You cannot manage placements for another department' }, { status: 403 })
    }
    const record = await db.placementOutcome.update({
      where: { id: placementId },
      data: { status, mode },
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true, department: true, batch: true, graduationYear: true } },
        createdBy: { select: { name: true } },
      },
    })
    return NextResponse.json({ ...record, placementDate: record.placementDate.toISOString() })
  } catch (error) {
    console.error('Placements PUT error:', error)
    return NextResponse.json({ error: 'Unable to update placement record' }, { status: 500 })
  }
}

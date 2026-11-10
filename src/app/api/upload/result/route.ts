import { normalizeDepartment } from '@/lib/departments'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const RESULT_DIR = path.join(process.cwd(), 'private_uploads', 'results')
const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = new Map([
  ['application/pdf', '.pdf'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
])

async function getActor(actorId: string) {
  return db.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true, department: true },
  })
}

function canViewResult(actor: { id: string; role: string; department: string | null }, owner: { id: string; department: string | null }) {
  if (actor.id === owner.id) return true
  if (actor.role === 'PLACEMENT_CELL') return true
  return actor.role === 'ADMIN' && (
    actor.department === 'Administration' ||
    (!!actor.department && normalizeDepartment(actor.department) === normalizeDepartment(owner.department))
  )
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('result')
    const studentId = formData.get('studentId')
    const actorId = formData.get('actorId')
    if (!(file instanceof File) || typeof studentId !== 'string' || typeof actorId !== 'string') {
      return NextResponse.json({ error: 'Result file, student ID, and actor ID are required' }, { status: 400 })
    }
    if (studentId !== actorId) {
      return NextResponse.json({ error: 'Students can upload only their own final-year result' }, { status: 403 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Upload a PDF, JPEG, or PNG result file' }, { status: 400 })
    }
    if (file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Result file must be smaller than 10 MB' }, { status: 400 })
    }
    const student = await db.user.findUnique({ where: { id: studentId }, select: { id: true, role: true } })
    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only current students can upload a final-year result' }, { status: 403 })
    }

    await mkdir(RESULT_DIR, { recursive: true })
    const filename = `${studentId}_${crypto.randomBytes(16).toString('hex')}${ALLOWED_TYPES.get(file.type)}`
    await writeFile(path.join(RESULT_DIR, filename), Buffer.from(await file.arrayBuffer()), { flag: 'wx' })
    const updated = await db.user.update({
      where: { id: studentId },
      data: { finalYearResultUrl: filename, alumniChoice: null },
      select: { id: true, finalYearResultUrl: true, alumniChoice: true },
    })
    return NextResponse.json({ ...updated, resultUrl: `/api/upload/result?userId=${encodeURIComponent(studentId)}` }, { status: 201 })
  } catch (error) {
    console.error('Final-year result upload error:', error)
    return NextResponse.json({ error: 'Unable to save final-year result' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const actorId = req.nextUrl.searchParams.get('actorId')
    if (!userId || !actorId) return NextResponse.json({ error: 'User and actor IDs are required' }, { status: 400 })
    const [actor, owner] = await Promise.all([
      getActor(actorId),
      db.user.findUnique({ where: { id: userId }, select: { id: true, department: true, finalYearResultUrl: true } }),
    ])
    if (!actor || !owner) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!canViewResult(actor, owner)) return NextResponse.json({ error: 'You cannot view this result' }, { status: 403 })
    if (!owner.finalYearResultUrl) return NextResponse.json({ error: 'No result has been uploaded' }, { status: 404 })

    const filename = path.basename(owner.finalYearResultUrl)
    const file = await readFile(path.join(RESULT_DIR, filename))
    const extension = path.extname(filename).toLowerCase()
    const contentType = extension === '.pdf' ? 'application/pdf' : extension === '.png' ? 'image/png' : 'image/jpeg'
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="final-year-result${extension}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Final-year result retrieval error:', error)
    return NextResponse.json({ error: 'Unable to retrieve final-year result' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { studentId, actorId, decision } = await req.json()
    if (typeof studentId !== 'string' || actorId !== studentId || !['ALUMNI', 'STUDENT'].includes(decision)) {
      return NextResponse.json({ error: 'Choose whether to move to alumni or remain a student' }, { status: 400 })
    }
    const student = await db.user.findUnique({ where: { id: studentId } })
    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only current students can make this choice' }, { status: 403 })
    }
    if (!student.finalYearResultUrl) {
      return NextResponse.json({ error: 'Upload your final-year result before making this choice' }, { status: 409 })
    }

    const updated = await db.user.update({
      where: { id: studentId },
      data: {
        role: decision === 'ALUMNI' ? 'ALUMNI' : 'STUDENT',
        alumniChoice: decision,
      },
      select: { id: true, role: true, alumniChoice: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Student alumni choice error:', error)
    return NextResponse.json({ error: 'Unable to save alumni choice' }, { status: 500 })
  }
}

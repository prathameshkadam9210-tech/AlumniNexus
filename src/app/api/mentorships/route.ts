import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mentorId = searchParams.get('mentorId')
    const menteeId = searchParams.get('menteeId')

    const where: Record<string, unknown> = {}
    if (mentorId) where.mentorId = mentorId
    if (menteeId) where.menteeId = menteeId

    const mentorships = await db.mentorship.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        mentor: { select: { name: true, designation: true, company: true, avatar: true } },
        mentee: { select: { name: true, department: true, avatar: true } },
      },
    })

    return NextResponse.json(mentorships.map(m => ({
      ...m,
      mentorName: m.mentor?.name,
      menteeName: m.mentee?.name,
      date: m.date.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })))
  } catch (error) {
    console.error('Mentorships GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mentorId, menteeId, date, timeSlot, duration, topic } = body

    const mentor = await db.user.findUnique({ where: { id: mentorId } })
    const mentee = await db.user.findUnique({ where: { id: menteeId } })

    const mentorship = await db.mentorship.create({
      data: {
        mentorId,
        menteeId,
        date: new Date(date),
        timeSlot,
        duration: duration || 30,
        topic,
        status: 'PENDING',
        mentorName: mentor?.name,
        menteeName: mentee?.name,
      },
    })

    return NextResponse.json({ ...mentorship, date: mentorship.date.toISOString(), createdAt: mentorship.createdAt.toISOString() })
  } catch (error) {
    console.error('Mentorships POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { mentorshipId, status, notes, meetingLink } = body

    if (!mentorshipId) return NextResponse.json({ error: 'Mentorship ID required' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (status) data.status = status
    if (notes) data.notes = notes
    if (meetingLink) data.meetingLink = meetingLink

    const mentorship = await db.mentorship.update({
      where: { id: mentorshipId },
      data,
    })

    return NextResponse.json({ ...mentorship, date: mentorship.date.toISOString(), createdAt: mentorship.createdAt.toISOString() })
  } catch (error) {
    console.error('Mentorships PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

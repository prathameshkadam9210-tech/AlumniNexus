import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const DURATIONS = [15, 30, 45, 60]

function getTodayUtcStart() {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: 'year' | 'month' | 'day') => dateParts.find((item) => item.type === type)?.value
  return new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00.000Z`)
}

export async function GET(req: NextRequest) {
  try {
    const mentorId = req.nextUrl.searchParams.get('mentorId')
    const actorId = req.nextUrl.searchParams.get('actorId')
    if (mentorId) {
      const actor = actorId
        ? await db.user.findUnique({ where: { id: actorId }, select: { id: true, role: true } })
        : null
      if (actor?.id !== mentorId || actor.role !== 'ALUMNI') {
        return NextResponse.json({ error: 'You can only manage your own offered slots' }, { status: 403 })
      }
    }
    const slots = await db.mentorshipSlot.findMany({
      where: mentorId
        ? { mentorId }
        : { status: 'OPEN', date: { gte: getTodayUtcStart() } },
      include: {
        mentor: { select: { id: true, name: true, company: true, designation: true } },
        bookedBy: { select: { name: true } },
      },
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    })
    return NextResponse.json(slots.map((slot) => ({
      ...slot,
      date: slot.date.toISOString(),
      createdAt: slot.createdAt.toISOString(),
      updatedAt: slot.updatedAt.toISOString(),
    })))
  } catch (error) {
    console.error('Mentorship slots GET error:', error)
    return NextResponse.json({ error: 'Unable to load mentorship slots' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, mentorId, menteeId, actorId, slotId, date, timeSlot, duration, topic } = body

    if (action === 'offer') {
      const mentor = typeof mentorId === 'string'
        ? await db.user.findUnique({ where: { id: mentorId }, select: { id: true, role: true } })
        : null
      const slotDate = new Date(date)
      const slotDuration = Number(duration)
      if (mentor?.role !== 'ALUMNI' || actorId !== mentorId) {
        return NextResponse.json({ error: 'Only alumni can offer mentorship slots' }, { status: 403 })
      }
      if (!Number.isFinite(slotDate.getTime()) || slotDate < getTodayUtcStart() ||
          typeof timeSlot !== 'string' || !timeSlot.trim() ||
          !DURATIONS.includes(slotDuration)) {
        return NextResponse.json({ error: 'Choose a future date, time, and valid duration' }, { status: 400 })
      }

      const slot = await db.mentorshipSlot.create({
        data: {
          mentorId,
          date: slotDate,
          timeSlot: timeSlot.trim(),
          duration: slotDuration,
          topic: typeof topic === 'string' ? topic.trim() || null : null,
        },
      })
      return NextResponse.json({ ...slot, date: slot.date.toISOString() }, { status: 201 })
    }

    if (action === 'book') {
      const [student, slot] = await Promise.all([
        typeof menteeId === 'string'
          ? db.user.findUnique({ where: { id: menteeId }, select: { id: true, name: true, role: true } })
          : null,
        typeof slotId === 'string'
          ? db.mentorshipSlot.findUnique({
            where: { id: slotId },
            include: { mentor: { select: { id: true, name: true } } },
          })
          : null,
      ])
      if (student?.role !== 'STUDENT' || actorId !== menteeId) {
        return NextResponse.json({ error: 'Only students can book mentorship slots' }, { status: 403 })
      }
      if (!slot || slot.status !== 'OPEN' || slot.date < getTodayUtcStart()) {
        return NextResponse.json({ error: 'This mentorship slot is no longer available' }, { status: 409 })
      }

      const session = await db.$transaction(async (transaction) => {
        const reservation = await transaction.mentorshipSlot.updateMany({
          where: { id: slot.id, status: 'OPEN' },
          data: { status: 'BOOKED', bookedById: student.id },
        })
        if (reservation.count !== 1) throw new Error('MENTORSHIP_SLOT_TAKEN')
        return transaction.mentorship.create({
          data: {
            mentorId: slot.mentor.id,
            menteeId: student.id,
            date: slot.date,
            timeSlot: slot.timeSlot,
            duration: slot.duration,
            topic: typeof topic === 'string' && topic.trim() ? topic.trim() : slot.topic,
            status: 'PENDING',
            mentorName: slot.mentor.name,
            menteeName: student.name,
          },
        })
      })
      return NextResponse.json({ ...session, date: session.date.toISOString(), createdAt: session.createdAt.toISOString() }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid mentorship slot action' }, { status: 400 })
  } catch (error) {
    if (error instanceof Error && error.message === 'MENTORSHIP_SLOT_TAKEN') {
      return NextResponse.json({ error: 'This mentorship slot was just booked by someone else' }, { status: 409 })
    }
    console.error('Mentorship slots POST error:', error)
    return NextResponse.json({ error: 'Unable to save mentorship slot' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { slotId, mentorId, actorId } = await req.json()
    if (typeof slotId !== 'string' || typeof mentorId !== 'string' || actorId !== mentorId) {
      return NextResponse.json({ error: 'Slot and mentor IDs are required' }, { status: 400 })
    }
    const result = await db.mentorshipSlot.deleteMany({
      where: { id: slotId, mentorId, status: 'OPEN' },
    })
    if (result.count !== 1) {
      return NextResponse.json({ error: 'Slot not found or already booked' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mentorship slots DELETE error:', error)
    return NextResponse.json({ error: 'Unable to remove mentorship slot' }, { status: 500 })
  }
}

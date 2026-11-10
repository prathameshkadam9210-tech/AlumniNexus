import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')

    if (action === 'notifications') {
      const where: Record<string, unknown> = {}
      if (userId) where.userId = userId
      if (userId) {
        const recipient = await db.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
        if (recipient?.role === 'PLACEMENT_CELL') where.type = { not: 'DONATION' }
      }
      const notifications = await db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return NextResponse.json(notifications.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })))
    }

    const where: Record<string, unknown> = {}
    if (type) where.type = type

    const events = await db.event.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        organizer: { select: { name: true, designation: true } },
      },
    })

    return NextResponse.json(events.map(e => ({
      ...e,
      organizerName: e.organizer?.name,
      date: e.date.toISOString(),
      registrationDeadline: e.registrationDeadline?.toISOString() || null,
      endTime: e.endTime?.toISOString(),
      createdAt: e.createdAt.toISOString(),
    })).sort((a, b) => {
      const now = Date.now()
      const getEnd = (event: { date: string; endTime?: string | null; time: string | null }) => {
        if (event.endTime) return new Date(event.endTime).getTime()
        const date = new Date(event.date)
        if (event.time) {
          const [hours, minutes] = event.time.split(':').map(Number)
          date.setHours(hours || 0, minutes || 0, 0, 0)
        } else {
          date.setHours(23, 59, 59, 999)
        }
        return date.getTime()
      }
      const aEnd = getEnd(a)
      const bEnd = getEnd(b)
      const aPast = aEnd < now
      const bPast = bEnd < now
      if (aPast !== bPast) return aPast ? 1 : -1
      return aPast ? bEnd - aEnd : new Date(a.date).getTime() - new Date(b.date).getTime()
    }))
  } catch (error) {
    console.error('Events GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userId, title, message, type: notifType, link } = body

    // Create notification
    if (action === 'notification') {
      const notification = await db.notification.create({
        data: {
          userId,
          title,
          message,
          type: notifType || 'INFO',
          link,
        },
      })
      return NextResponse.json({ ...notification, createdAt: notification.createdAt.toISOString() })
    }

    // Create event
    const { title: eventTitle, description, date, registrationDeadline, endTime, time, location, type, organizerId, maxAttendees, image, isFeatured } = body
    const eventDate = new Date(date)
    const registrationCutoff = registrationDeadline ? new Date(registrationDeadline) : null
    if (!Number.isFinite(eventDate.getTime()) || (registrationCutoff && !Number.isFinite(registrationCutoff.getTime()))) {
      return NextResponse.json({ error: 'Enter a valid event date and registration deadline' }, { status: 400 })
    }

    const event = await db.event.create({
      data: {
        title: eventTitle,
        description,
        date: eventDate,
        registrationDeadline: registrationCutoff,
        endTime: endTime ? new Date(endTime) : null,
        time,
        location,
        type: type || 'WORKSHOP',
        organizerId,
        maxAttendees,
        image,
        isFeatured: isFeatured || false,
      },
    })

    return NextResponse.json({
      ...event,
      date: event.date.toISOString(),
      registrationDeadline: event.registrationDeadline?.toISOString() || null,
      endTime: event.endTime?.toISOString() || null,
      createdAt: event.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Events POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { notificationId, isRead } = body

    if (notificationId) {
      await db.notification.update({
        where: { id: notificationId },
        data: { isRead: isRead ?? true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Events PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      orderBy: { date: 'desc' },
      include: {
        organizer: { select: { name: true, designation: true } },
      },
    })

    return NextResponse.json(events.map(e => ({
      ...e,
      organizerName: e.organizer?.name,
      date: e.date.toISOString(),
      endTime: e.endTime?.toISOString(),
      createdAt: e.createdAt.toISOString(),
    })))
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
    const { title: eventTitle, description, date, endTime, time, location, type, organizerId, maxAttendees, image, isFeatured } = body

    const event = await db.event.create({
      data: {
        title: eventTitle,
        description,
        date: new Date(date),
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

    return NextResponse.json({ ...event, date: event.date.toISOString(), createdAt: event.createdAt.toISOString() })
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

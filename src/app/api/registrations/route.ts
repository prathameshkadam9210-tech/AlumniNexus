import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST - Register for event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, eventId } = body

    if (!userId || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, eventId' },
        { status: 400 }
      )
    }

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.registrationDeadline && event.registrationDeadline.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'The registration deadline has passed.' }, { status: 400 })
    }
    const eventEnd = event.endTime || new Date(new Date(event.date).setHours(23, 59, 59, 999))
    if (eventEnd.getTime() < Date.now()) {
      return NextResponse.json({ error: 'This event has already taken place.' }, { status: 400 })
    }

    // Check if event is full
    if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      return NextResponse.json(
        { error: 'Event is full. No more seats available.' },
        { status: 400 }
      )
    }

    // Check if already registered
    const existingReg = await db.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    })

    if (existingReg) {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 400 }
      )
    }

    // If event has a price, return requiresPayment flag (don't register yet)
    if (event.price && event.price > 0) {
      return NextResponse.json({
        requiresPayment: true,
        amount: event.price,
        currency: event.currency,
        eventId,
        message: 'Payment required to complete registration.',
      })
    }

    // Create registration (free event)
    const registration = await db.eventRegistration.create({
      data: {
        userId,
        eventId,
        status: 'REGISTERED',
      },
    })

    // Increment current attendees
    await db.event.update({
      where: { id: eventId },
      data: { currentAttendees: { increment: 1 } },
    })

    // Notify user
    await db.notification.create({
      data: {
        userId,
        title: 'Event Registration Confirmed',
        message: `You have been registered for "${event.title}"`,
        type: 'EVENT',
        link: '/events',
      },
    })

    return NextResponse.json({
      ...registration,
      createdAt: registration.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Registrations POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List registrations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const eventId = searchParams.get('eventId')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (eventId) where.eventId = eventId

    const registrations = await db.eventRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            time: true,
            location: true,
            type: true,
            image: true,
            maxAttendees: true,
            currentAttendees: true,
            isFeatured: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
      },
    })

    return NextResponse.json(
      registrations.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        event: r.event
          ? {
              ...r.event,
              date: r.event.date.toISOString(),
            }
          : undefined,
      }))
    )
  } catch (error) {
    console.error('Registrations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

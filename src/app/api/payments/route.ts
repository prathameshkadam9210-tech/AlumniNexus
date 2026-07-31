import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Helper to generate a random alphanumeric string
function randomChars(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// POST - Create payment order (simulated Razorpay)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, amount, currency = 'INR', type, description, referenceId } = body

    if (!userId || !amount || !type) {
      return NextResponse.json({ error: 'Missing required fields: userId, amount, type' }, { status: 400 })
    }

    // Generate simulated Razorpay order details
    const orderId = 'order_' + randomChars(14)

    // Create payment record with INITIATED status
    const payment = await db.payment.create({
      data: {
        userId,
        amount,
        currency,
        type,
        description: description || `${type} payment`,
        referenceId: referenceId || null,
        status: 'INITIATED',
        razorpayOrderId: orderId,
      },
    })

    return NextResponse.json({
      id: payment.id,
      orderId,
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      key: 'rzp_test_demo_key',
      payment: {
        ...payment,
        createdAt: payment.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Payments POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List payments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId

    const payments = await db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      payments.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update payment status
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { paymentId, status, razorpayId, razorpayOrderId } = body

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Missing required fields: paymentId, status' }, { status: 400 })
    }

    // Fetch the payment to check type and referenceId
    const existingPayment = await db.payment.findUnique({
      where: { id: paymentId },
    })

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status,
        razorpayId: razorpayId || undefined,
        razorpayOrderId: razorpayOrderId || undefined,
      },
    })

    // If payment is for an EVENT and status is COMPLETED, create EventRegistration
    if (existingPayment.type === 'EVENT' && status === 'COMPLETED' && existingPayment.referenceId) {
      const eventId = existingPayment.referenceId

      // Check if already registered
      const existingReg = await db.eventRegistration.findUnique({
        where: {
          userId_eventId: {
            userId: existingPayment.userId,
            eventId,
          },
        },
      })

      if (!existingReg) {
        // Create the event registration
        await db.eventRegistration.create({
          data: {
            userId: existingPayment.userId,
            eventId,
            status: 'REGISTERED',
          },
        })

        // Increment event attendees
        await db.event.update({
          where: { id: eventId },
          data: { currentAttendees: { increment: 1 } },
        })

        // Notify user
        await db.notification.create({
          data: {
            userId: existingPayment.userId,
            title: 'Event Registration Confirmed',
            message: 'Your payment was successful. You are now registered for the event.',
            type: 'PAYMENT',
          },
        })
      }
    }

    // If payment is a DONATION and status is COMPLETED, notify admins
    if (existingPayment.type === 'DONATION' && status === 'COMPLETED') {
      // Find admin users to notify
      const admins = await db.user.findMany({
        where: { role: { in: ['ADMIN', 'PLACEMENT_CELL'] } },
        select: { id: true },
      })

      for (const admin of admins) {
        await db.notification.create({
          data: {
            userId: admin.id,
            title: 'New Donation Received',
            message: `A donation of ${existingPayment.currency} ${existingPayment.amount} has been received.`,
            type: 'DONATION',
          },
        })
      }
    }

    return NextResponse.json({
      ...updatedPayment,
      createdAt: updatedPayment.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Payments PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

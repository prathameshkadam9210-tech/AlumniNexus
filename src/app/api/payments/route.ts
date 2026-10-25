import Razorpay from 'razorpay'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { isEmailConfigured, sendDonationReceiptEmail, sendPaymentStatusEmail } from '@/lib/email'
import { DONATION_PURPOSES, getDonationPurposeLabel } from '@/lib/donation-purposes'
import { NextRequest, NextResponse } from 'next/server'

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret || keyId.includes('replace_me') || keySecret.includes('replace_with')) return null
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

async function notifyPaymentStatus(userId: string, amount: number, currency: string, status: 'COMPLETED' | 'FAILED'): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
  if (!user || !isEmailConfigured()) return false
  try {
    await sendPaymentStatusEmail({ to: user.email, name: user.name, amount, currency, status })
    return true
  } catch (error) {
    console.error('Payment status email error:', error)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, amount, currency = 'INR', type, description, purpose, referenceId, paymentId } = body
    const numericAmount = Number(amount)
    if (type === 'DONATION' && purpose && !DONATION_PURPOSES.some((option) => option.value === purpose)) {
      return NextResponse.json({ error: 'Invalid donation purpose' }, { status: 400 })
    }
    const razorpay = getRazorpay()

    if (!userId || !numericAmount || numericAmount <= 0 || !type) {
      return NextResponse.json({ error: 'Missing required fields: userId, amount, type' }, { status: 400 })
    }
    if (!razorpay) {
      return NextResponse.json({ error: 'Razorpay Test credentials are not configured correctly.' }, { status: 503 })
    }

    const order = await razorpay.orders.create({
      amount: Math.round(numericAmount * 100),
      currency,
      receipt: `alumni_${Date.now()}`,
      notes: { userId, type, referenceId: referenceId || '' },
    })

    const payment = paymentId
      ? await db.payment.update({
        where: { id: paymentId },
        data: { razorpayOrderId: order.id, status: 'INITIATED', purpose: purpose || undefined },
      })
      : await db.payment.create({
        data: {
        userId,
        amount: numericAmount,
        currency,
        type,
        description: description || `${type} payment`,
        purpose: purpose || null,
        referenceId: referenceId || null,
        status: 'INITIATED',
        razorpayOrderId: order.id,
        },
      })

    return NextResponse.json({
      id: payment.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      payment: { ...payment, createdAt: payment.createdAt.toISOString() },
    })
  } catch (error) {
    console.error('Payments POST error:', error)
    return NextResponse.json({ error: 'Unable to create Razorpay order' }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('userId')
    const payments = await db.payment.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(payments.map((payment) => ({ ...payment, createdAt: payment.createdAt.toISOString() })))
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { paymentId, status, razorpayId, razorpayOrderId, razorpaySignature } = body
    const existingPayment = paymentId ? await db.payment.findUnique({ where: { id: paymentId } }) : null
    if (!existingPayment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    let finalStatus: 'COMPLETED' | 'FAILED'
    if (status === 'FAILED') {
      finalStatus = 'FAILED'
    } else if (status === 'COMPLETED' && razorpayId && razorpayOrderId && razorpaySignature && process.env.RAZORPAY_KEY_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayId}`)
        .digest('hex')
      if (expectedSignature !== razorpaySignature || existingPayment.razorpayOrderId !== razorpayOrderId) {
        return NextResponse.json({ error: 'Invalid Razorpay payment signature' }, { status: 400 })
      }
      finalStatus = 'COMPLETED'
    } else {
      return NextResponse.json({ error: 'Valid Razorpay payment verification is required' }, { status: 400 })
    }

    let updatedPayment = await db.payment.update({
      where: { id: existingPayment.id },
      data: { status: finalStatus, razorpayId: razorpayId || undefined, razorpayOrderId: razorpayOrderId || undefined },
    })
    let emailSent: boolean
    const shouldSendDonationReceipt = finalStatus === 'COMPLETED' &&
      existingPayment.type === 'DONATION' &&
      !existingPayment.receiptEmailedAt

    if (shouldSendDonationReceipt) {
      emailSent = false
      try {
        const donor = await db.user.findUnique({
          where: { id: existingPayment.userId },
          select: { email: true, name: true, organization: { select: { name: true } } },
        })
        if (!donor) throw new Error('Donation owner was not found')
        if (!isEmailConfigured()) throw new Error('SMTP email settings are not configured')

        const legacyPurpose = existingPayment.description.match(/^Donation for ([^:]+)/i)?.[1]?.trim()
        await sendDonationReceiptEmail({
          to: donor.email,
          name: donor.name,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          purpose: getDonationPurposeLabel(existingPayment.purpose || legacyPurpose || 'general'),
          paymentReference: updatedPayment.razorpayId || updatedPayment.id,
          paidAt: updatedPayment.updatedAt,
          organizationName: donor.organization?.name,
        })
        updatedPayment = await db.payment.update({
          where: { id: updatedPayment.id },
          data: { receiptEmailedAt: new Date() },
        })
        emailSent = true
      } catch (error) {
        console.error('Donation receipt email error:', error)
      }
    } else if (finalStatus === 'COMPLETED' && existingPayment.type === 'DONATION') {
      emailSent = Boolean(existingPayment.receiptEmailedAt)
    } else {
      emailSent = await notifyPaymentStatus(existingPayment.userId, existingPayment.amount, existingPayment.currency, finalStatus)
    }

    if (existingPayment.type === 'EVENT' && finalStatus === 'COMPLETED' && existingPayment.referenceId) {
      const event = await db.event.findUnique({ where: { id: existingPayment.referenceId } })
      if (!event) {
        return NextResponse.json({ error: 'Event no longer exists; contact the college for a payment refund.' }, { status: 409 })
      }
      const eventEnd = event.endTime || new Date(new Date(event.date).setHours(23, 59, 59, 999))
      if (
        (event.registrationDeadline && event.registrationDeadline.getTime() <= Date.now()) ||
        eventEnd.getTime() < Date.now()
      ) {
        return NextResponse.json({
          ...updatedPayment,
          emailSent,
          registrationExpired: true,
          createdAt: updatedPayment.createdAt.toISOString(),
        })
      }
      const existingRegistration = await db.eventRegistration.findUnique({
        where: { userId_eventId: { userId: existingPayment.userId, eventId: existingPayment.referenceId } },
      })
      if (!existingRegistration) {
        await db.eventRegistration.create({
          data: { userId: existingPayment.userId, eventId: existingPayment.referenceId, status: 'REGISTERED' },
        })
        await db.event.update({ where: { id: existingPayment.referenceId }, data: { currentAttendees: { increment: 1 } } })
      }
    }

    if (existingPayment.type === 'DONATION' && finalStatus === 'COMPLETED') {
      const admins = await db.user.findMany({ where: { role: { in: ['ADMIN', 'PLACEMENT_CELL'] } }, select: { id: true } })
      await Promise.all(admins.map((admin) => db.notification.create({
        data: { userId: admin.id, title: 'New Donation Received', message: `A donation of ${existingPayment.currency} ${existingPayment.amount} has been received.`, type: 'DONATION' },
      })))
    }

    return NextResponse.json({
      ...updatedPayment,
      emailSent,
      createdAt: updatedPayment.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Payments PUT error:', error)
    return NextResponse.json({ error: 'Unable to verify Razorpay payment' }, { status: 500 })
  }
}

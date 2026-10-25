import { db } from '@/lib/db'
import { isEmailConfigured, sendOtpEmail } from '@/lib/email'
import { randomInt } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, actorId, email } = await req.json()
    if (typeof userId !== 'string' || actorId !== userId || typeof email !== 'string') {
      return NextResponse.json({ error: 'User ID and new email are required' }, { status: 400 })
    }

    const nextEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } })
    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    if (user.email.toLowerCase() === nextEmail) {
      return NextResponse.json({ error: 'This is already your account email' }, { status: 400 })
    }

    const existingEmail = await db.user.findUnique({ where: { email: nextEmail }, select: { id: true } })
    if (existingEmail) return NextResponse.json({ error: 'This email address is already registered' }, { status: 409 })
    if (!isEmailConfigured()) {
      return NextResponse.json({ error: 'Email verification is not configured. Please contact the administrator.' }, { status: 503 })
    }

    const otp = randomInt(100000, 1000000).toString()
    try {
      await sendOtpEmail({ to: nextEmail, otp, purpose: 'verification' })
    } catch (error) {
      console.error('Email change OTP delivery error:', error)
      return NextResponse.json({ error: 'Unable to send the verification code to the new email address.' }, { status: 502 })
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        pendingEmail: nextEmail,
        pendingEmailOtp: otp,
        pendingEmailOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    return NextResponse.json({ success: true, message: `Verification code sent to ${nextEmail}.` })
  } catch (error) {
    console.error('Email change OTP error:', error)
    return NextResponse.json({ error: 'Unable to start email verification' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, actorId, otp } = await req.json()
    if (typeof userId !== 'string' || actorId !== userId || typeof otp !== 'string') {
      return NextResponse.json({ error: 'User ID and verification code are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user?.pendingEmail || !user.pendingEmailOtp || !user.pendingEmailOtpExpiry) {
      return NextResponse.json({ error: 'Request a new verification code first' }, { status: 400 })
    }
    if (user.pendingEmailOtpExpiry.getTime() < Date.now()) {
      await db.user.update({
        where: { id: userId },
        data: { pendingEmail: null, pendingEmailOtp: null, pendingEmailOtpExpiry: null },
      })
      return NextResponse.json({ error: 'Verification code expired. Request a new code.' }, { status: 400 })
    }
    if (user.pendingEmailOtp !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    const collision = await db.user.findUnique({
      where: { email: user.pendingEmail },
      select: { id: true },
    })
    if (collision && collision.id !== user.id) {
      return NextResponse.json({ error: 'This email address is already registered' }, { status: 409 })
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        email: user.pendingEmail,
        emailVerified: true,
        verificationOtp: null,
        otpExpiry: null,
        pendingEmail: null,
        pendingEmailOtp: null,
        pendingEmailOtpExpiry: null,
      },
      select: { id: true, email: true },
    })
    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Email change verification error:', error)
    return NextResponse.json({ error: 'Unable to verify email change' }, { status: 500 })
  }
}

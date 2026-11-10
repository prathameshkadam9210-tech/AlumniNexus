import { db } from '@/lib/db'
import { isEmailConfigured, sendOtpEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// In-memory OTP store for demo (in production, use email service like Resend/Nodemailer)
const otpStore = new Map<string, { otp: string; expiry: number; email: string }>()

// Valid college email domain
const VALID_EMAIL_DOMAIN = '@jjmcoe.ac.in'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST - Send OTP to email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email domain - only @jjmcoe.ac.in is accepted
    if (!email.toLowerCase().endsWith(VALID_EMAIL_DOMAIN)) {
      return NextResponse.json(
        {
          error: `Only college email addresses ending with ${VALID_EMAIL_DOMAIN} are accepted. Please use your official college email ID (e.g., yourname@jjmcoe.ac.in)`,
        },
        { status: 400 }
      )
    }

    // Check if email is already registered and verified
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: 'This email is already verified. Please log in instead.' },
        { status: 400 }
      )
    }

    // Generate 6-digit OTP
    const otp = generateOTP()
    const expiry = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store OTP in memory (in production, send via email service)
    otpStore.set(email, { otp, expiry, email })

    // Also store in database for the user
    if (existingUser) {
      await db.user.update({
        where: { email },
        data: {
          verificationOtp: otp,
          otpExpiry: new Date(expiry),
        },
      })
    }

    if (isEmailConfigured()) {
      try {
        await sendOtpEmail({ to: email, otp, purpose: 'verification' })
      } catch (error) {
        console.error('Verification email error:', error)
        return NextResponse.json({ error: 'Unable to send verification email. Check SMTP settings.' }, { status: 500 })
      }
    } else {
      console.log(`Verification OTP for ${email}: ${otp} (expires in 10 minutes)`)
    }

    return NextResponse.json({
      success: true,
      message: isEmailConfigured()
        ? `OTP sent to ${email}.`
        : `OTP generated for ${email}. Add SMTP settings to send it by email.`,
      ...(!isEmailConfigured() ? { demoOTP: otp } : {}),
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}

// PUT - Verify OTP
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, otp } = body

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    // Check in-memory store first, then database
    const stored = otpStore.get(email)
    let isValid = false

    if (stored) {
      isValid = stored.otp === otp && stored.expiry > Date.now()
    }

    if (!isValid) {
      // Check database
      const user = await db.user.findUnique({ where: { email } })
      if (user && user.verificationOtp && user.otpExpiry) {
        isValid = user.verificationOtp === otp && user.otpExpiry > new Date()
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please request a new OTP.' },
        { status: 400 }
      )
    }

    // Mark email as verified in database
    await db.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationOtp: null,
        otpExpiry: null,
      },
    })

    // Clean up in-memory store
    otpStore.delete(email)

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
  }
}

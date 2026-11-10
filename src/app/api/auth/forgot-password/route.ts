import { db } from '@/lib/db'
import { isEmailConfigured, sendOtpEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// In-memory reset token store for demo
const resetStore = new Map<string, { token: string; otp: string; expiry: number; email: string }>()

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST - Send OTP for password reset
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      )
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Your email is not verified. Please verify your email first.' },
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const expiry = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store OTP
    resetStore.set(email, { token: crypto.randomBytes(32).toString('hex'), otp, expiry, email })

    // Also store in database
    const resetToken = crypto.randomBytes(32).toString('hex')
    await db.user.update({
      where: { email },
      data: {
        verificationOtp: otp,
        otpExpiry: new Date(expiry),
        resetToken,
        resetTokenExpiry: new Date(expiry),
      },
    })

    if (isEmailConfigured()) {
      try {
        await sendOtpEmail({ to: email, otp, purpose: 'password-reset' })
      } catch (error) {
        console.error('Password reset email error:', error)
        await db.user.update({
          where: { id: user.id },
          data: { verificationOtp: null, otpExpiry: null },
        })
        const smtpCode = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
          ? error.code
          : ''
        const message = smtpCode === 'EAUTH'
          ? 'SMTP authentication failed. Check the SMTP username and app password.'
          : ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET'].includes(smtpCode)
            ? 'Could not connect to the SMTP server. Check the SMTP host, port, TLS settings, and network access.'
            : 'Unable to send password reset email. Check the SMTP settings and server logs.'
        return NextResponse.json({ error: message }, { status: 502 })
      }
    } else if (process.env.NODE_ENV === 'production') {
      await db.user.update({
        where: { id: user.id },
        data: { verificationOtp: null, otpExpiry: null },
      })
      return NextResponse.json(
        { error: 'Password reset email is not configured. Please contact the college administrator.' },
        { status: 503 }
      )
    } else {
      console.log(`Password Reset OTP generated for ${email} (expires in 10 minutes)`)
    }

    return NextResponse.json({
      success: true,
      message: isEmailConfigured()
        ? `Password reset OTP sent to ${email}.`
        : `OTP generated for ${email}. Add SMTP settings to send it by email.`,
      ...(!isEmailConfigured() && process.env.NODE_ENV !== 'production' ? { demoOTP: otp } : {}),
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to send reset OTP' }, { status: 500 })
  }
}

// PUT - Verify OTP and reset password
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, otp, newPassword } = body

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      )
    }

    // Verify OTP from database
    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.verificationOtp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      )
    }

    if (user.verificationOtp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      )
    }

    // Update password and clear reset fields
    await db.user.update({
      where: { email },
      data: {
        password: newPassword,
        verificationOtp: null,
        otpExpiry: null,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    // Clean up in-memory store
    resetStore.delete(email)

    console.log(`✅ Password reset successful for ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}

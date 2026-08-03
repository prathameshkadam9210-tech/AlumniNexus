import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const VALID_EMAIL_DOMAIN = '.jjmcoe.ac.in'

// Helper to check if email is valid college email
function isValidCollegeEmail(email: string): boolean {
  return email.toLowerCase().endsWith(VALID_EMAIL_DOMAIN)
}

// Helper to check if email is from an allowed external domain (for recruiters/admins)
const ALLOWED_EXTERNAL_DOMAINS = ['@tcs.com', '@infosys.com', '@wipro.com', '@persistent.com', '@razorpay.com', '@gmail.com']

function isAllowedExternalEmail(email: string): boolean {
  const lower = email.toLowerCase()
  return ALLOWED_EXTERNAL_DOMAINS.some(d => lower.endsWith(d))
}

// POST - Login / Signup
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, email, password, name, role, department, batch, graduationYear, company, designation, phone, skills } = body

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      let user = await db.user.findUnique({ where: { email } })

      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      // Check password
      if (user.password && user.password !== password && user.password !== 'demo') {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      // Check if email is verified (only for college emails)
      if (isValidCollegeEmail(email) && !user.emailVerified) {
        return NextResponse.json(
          { error: 'Please verify your email first. An OTP was sent to your email.', needsVerification: true, email },
          { status: 403 }
        )
      }

      // Update online status
      await db.user.update({ where: { id: user.id }, data: { isOnline: true } })

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        bio: user.bio,
        department: user.department,
        batch: user.batch,
        graduationYear: user.graduationYear,
        company: user.company,
        designation: user.designation,
        experience: user.experience,
        location: user.location,
        skills: user.skills,
        resumeUrl: user.resumeUrl,
        linkedinUrl: user.linkedinUrl,
        gpa: user.gpa,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        isOnline: true,
        createdAt: user.createdAt.toISOString(),
      })
    }

    if (action === 'signup') {
      if (!email || !name) {
        return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
      }

      // Email validation based on role
      const studentOrAlumniRoles = ['STUDENT', 'ALUMNI']
      if (studentOrAlumniRoles.includes(role)) {
        // Students and Alumni MUST use .jjmcoe.ac.in email
        if (!isValidCollegeEmail(email)) {
          return NextResponse.json(
            {
              error: `Students and Alumni must register with their official college email ending with ${VALID_EMAIL_DOMAIN}. Example: yourname@jjmcoe.ac.in`,
            },
            { status: 400 }
          )
        }
      }

      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }

      // Generate OTP for email verification
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Create user with emailVerified = false (needs OTP verification)
      const user = await db.user.create({
        data: {
          email,
          password: password || 'demo',
          name,
          role: role || 'STUDENT',
          department: department || 'Information Technology',
          batch: batch || '',
          graduationYear: graduationYear || null,
          company: company || '',
          designation: designation || '',
          phone: phone || '',
          skills: skills || '',
          isVerified: true,
          emailVerified: isValidCollegeEmail(email) ? false : true, // College emails need verification
          verificationOtp: isValidCollegeEmail(email) ? otp : null,
          otpExpiry: isValidCollegeEmail(email) ? otpExpiry : null,
        },
      })

      console.log(`📧 Verification OTP for ${email}: ${otp} (expires in 10 minutes)`)

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        isOnline: true,
        createdAt: user.createdAt.toISOString(),
        needsVerification: !user.emailVerified,
        demoOTP: user.emailVerified ? undefined : otp,
        message: user.emailVerified
          ? 'Account created successfully!'
          : `OTP sent to ${email}. Verify your email to complete registration. Check the server console for demo OTP.`,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Fetch users, alumni, or single user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'users') {
      const users = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(users.map(u => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })))
    }

    if (action === 'alumni') {
      const alumni = await db.user.findMany({
        where: { role: 'ALUMNI', isVerified: true },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(alumni.map(u => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })))
    }

    const userId = searchParams.get('id')
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      return NextResponse.json({ ...user, createdAt: user.createdAt.toISOString() })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, ...data } = body

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const user = await db.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        department: data.department,
        batch: data.batch,
        graduationYear: data.graduationYear,
        company: data.company,
        designation: data.designation,
        experience: data.experience,
        location: data.location,
        skills: data.skills,
        resumeUrl: data.resumeUrl,
        linkedinUrl: data.linkedinUrl,
        gpa: data.gpa,
        isVerified: data.isVerified,
        avatar: data.avatar,
      },
    })

    return NextResponse.json({ ...user, createdAt: user.createdAt.toISOString() })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

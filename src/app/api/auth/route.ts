import { db } from '@/lib/db'
import { getCanonicalDepartment, getDepartmentAliases } from '@/lib/departments'
import { isEmailConfigured, sendAccountStatusEmail, sendOtpEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

const VALID_EMAIL_DOMAIN = '@jjmcoe.ac.in'

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

function canManageUser(actor: { id: string; role: string; department: string | null }, target: { id: string; role: string; department: string | null }): boolean {
  if (actor.id === target.id) return true
  if (actor.role === 'ADMIN' && actor.department === 'Administration') return true
  if (actor.role === 'ADMIN' && actor.department &&
    getCanonicalDepartment(actor.department) === getCanonicalDepartment(target.department)) {
    return target.role === 'STUDENT' || target.role === 'ALUMNI' || target.role === 'ADMIN'
  }
  return (actor.role === 'PLACEMENT_CELL' || actor.role === 'RECRUITER') && target.role === 'STUDENT'
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

      const loginEmail = typeof email === 'string' ? email.trim().toLowerCase() : email
      let user = await db.user.findUnique({ where: { email: loginEmail } })
      let migrateAidsAdminEmail = false

      if (!user && loginEmail === 'aidsadmin@jjmcoe.ac.in') {
        const legacyUsers = await db.user.findMany({
          where: {
            email: {
              in: [
                'aidsadmin@gmail.ac.in',
                'aidsasdmin@jjmcoe.ac.in',
                'aidsasmin@jjmcoe.ac.in',
              ],
            },
            role: 'ADMIN',
          },
        })
        user = legacyUsers.find(
          (candidate) => getCanonicalDepartment(candidate.department) === 'Artificial Intelligence and Data Science (AIDS)'
        ) ?? null
        migrateAidsAdminEmail = Boolean(user)
      }

      if (!user) {
        return NextResponse.json(
          { error: 'You are not registered. Please register first, then log in.', notRegistered: true },
          { status: 404 }
        )
      }

      // Check password
      if (user.password && user.password !== password && user.password !== 'demo') {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      if (migrateAidsAdminEmail) {
        user = await db.user.update({
          where: { id: user.id },
          data: { email: 'aidsadmin@jjmcoe.ac.in' },
        })
      }

      // Check if email is verified (only for college emails)
      if (isValidCollegeEmail(loginEmail) && !user.emailVerified) {
        return NextResponse.json(
          { error: 'Please verify your email first. An OTP was sent to your email.', needsVerification: true, email: loginEmail },
          { status: 403 }
        )
      }

      if ((user.role === 'STUDENT' || user.role === 'ALUMNI') && !user.isVerified) {
        const rejected = user.verificationStatus === 'REJECTED'
        return NextResponse.json(
          {
            error: rejected
              ? 'Your account verification was rejected. Please contact your department admin.'
              : 'You cannot log in until your department admin or main admin verifies your account.',
            pendingApproval: !rejected,
            rejected,
          },
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
        department: getCanonicalDepartment(user.department),
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
        verificationStatus: user.isVerified ? 'APPROVED' : user.verificationStatus,
        emailVerified: user.emailVerified,
        isOnline: true,
        createdAt: user.createdAt.toISOString(),
      })
    }

    if (action === 'signup') {
      if (!email || !name) {
        return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
      }

      const signupRole = role || 'STUDENT'

      // Email validation based on role
      const studentOrAlumniRoles = ['STUDENT', 'ALUMNI']
      if (studentOrAlumniRoles.includes(signupRole)) {
        // Students and Alumni MUST use the official college email domain
        if (!isValidCollegeEmail(email)) {
          return NextResponse.json(
            {
              error: `Students and Alumni must register with their official college email ending with ${VALID_EMAIL_DOMAIN}. Example: yourname@jjmcoe.ac.in`,
            },
            { status: 400 }
          )
        }
        if (!department) {
          return NextResponse.json({ error: 'Please select your department.' }, { status: 400 })
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
      const signupDepartment = getCanonicalDepartment(department) || 'Information Technology (IT)'
      const user = await db.user.create({
        data: {
          email,
          password: password || 'demo',
          name,
          role: signupRole,
          department: signupDepartment,
          batch: batch || '',
          graduationYear: graduationYear || null,
          company: company || '',
          designation: designation || '',
          phone: phone || '',
          skills: skills || '',
          isVerified: !studentOrAlumniRoles.includes(signupRole),
          verificationStatus: studentOrAlumniRoles.includes(signupRole) ? 'PENDING' : 'APPROVED',
          emailVerified: isValidCollegeEmail(email) ? false : true, // College emails need verification
          verificationOtp: isValidCollegeEmail(email) ? otp : null,
          otpExpiry: isValidCollegeEmail(email) ? otpExpiry : null,
        },
      })

      if (studentOrAlumniRoles.includes(signupRole)) {
        const admins = await db.user.findMany({
          where: {
            role: 'ADMIN',
            OR: [{ department: 'Administration' }, { department: { in: getDepartmentAliases(signupDepartment) } }],
          },
        })
        await Promise.all(admins.map((admin) => db.notification.create({
          data: {
            userId: admin.id,
            title: 'New account awaiting approval',
            message: `${user.name} (${user.email}) registered for ${signupDepartment}. Review and approve this account.`,
            type: 'USER_VERIFICATION',
            link: 'user-management',
          },
        })))
      }

      let emailSent = false
      if (isEmailConfigured()) {
        try {
          await sendOtpEmail({ to: email, otp, purpose: 'verification' })
          emailSent = true
        } catch (error) {
          console.error('Verification email error:', error)
        }
      } else {
        console.log(`Verification OTP for ${email}: ${otp} (expires in 10 minutes)`)
      }

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: getCanonicalDepartment(user.department),
        isVerified: user.isVerified,
        verificationStatus: user.isVerified ? 'APPROVED' : user.verificationStatus,
        emailVerified: user.emailVerified,
        isOnline: true,
        createdAt: user.createdAt.toISOString(),
        needsVerification: !user.emailVerified,
        message: user.emailVerified
          ? 'Account created successfully!'
          : emailSent
            ? `OTP sent to ${email}. Verify your email to complete registration.`
            : `OTP generated for ${email}. Add SMTP settings to send it by email.`,
        ...(!emailSent && !isEmailConfigured() ? { demoOTP: otp } : {}),
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
      const actorId = searchParams.get('actorId')
      if (!actorId) return NextResponse.json({ error: 'Actor ID required' }, { status: 400 })
      const actor = await db.user.findUnique({
        where: { id: actorId },
        select: { id: true, role: true, department: true },
      })
      if (!actor) return NextResponse.json({ error: 'Actor not found' }, { status: 404 })

      const where = actor.role === 'ADMIN' && actor.department === 'Administration'
        ? undefined
        : actor.role === 'ADMIN' && actor.department
          ? { department: { in: getDepartmentAliases(actor.department) }, role: { in: ['STUDENT', 'ALUMNI', 'ADMIN'] } }
          : actor.role === 'PLACEMENT_CELL' || actor.role === 'RECRUITER'
            ? { role: 'STUDENT' }
            : { id: actor.id }
      const users = await db.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true, avatar: true, phone: true, bio: true,
          department: true, batch: true, graduationYear: true, company: true, designation: true,
          experience: true, location: true, skills: true, resumeUrl: true, linkedinUrl: true,
          gpa: true, isVerified: true, verificationStatus: true, emailVerified: true, isOnline: true,
          createdAt: true, updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(users.map(u => ({
        ...u,
        department: getCanonicalDepartment(u.department),
        verificationStatus: u.isVerified ? 'APPROVED' : u.verificationStatus,
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
        department: getCanonicalDepartment(u.department),
        verificationStatus: u.isVerified ? 'APPROVED' : u.verificationStatus,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })))
    }

    if (action === 'status') {
      const userId = searchParams.get('id')
      if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, department: true, isVerified: true, verificationStatus: true, batch: true, graduationYear: true },
      })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      return NextResponse.json({
        ...user,
        department: getCanonicalDepartment(user.department),
        verificationStatus: user.isVerified ? 'APPROVED' : user.verificationStatus,
      })
    }

    const userId = searchParams.get('id')
    if (userId) {
      const actorId = searchParams.get('viewerId')
      if (!actorId) return NextResponse.json({ error: 'Viewer ID required' }, { status: 400 })
      const [actor, user] = await Promise.all([
        db.user.findUnique({ where: { id: actorId }, select: { id: true, role: true, department: true } }),
        db.user.findUnique({
          where: { id: userId },
          select: {
            id: true, email: true, name: true, role: true, avatar: true, phone: true, bio: true,
            department: true, batch: true, graduationYear: true, company: true, designation: true,
            experience: true, location: true, skills: true, resumeUrl: true, linkedinUrl: true,
            gpa: true, isVerified: true, verificationStatus: true, emailVerified: true, isOnline: true,
            createdAt: true, updatedAt: true,
          },
        }),
      ])
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      if (!actor || !canManageUser(actor, user)) {
        return NextResponse.json({ error: 'You do not have access to this profile' }, { status: 403 })
      }
      return NextResponse.json({
        ...user,
        department: getCanonicalDepartment(user.department),
        verificationStatus: user.isVerified ? 'APPROVED' : user.verificationStatus,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })
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
    const { userId, actorId, passoutYear, ...data } = body

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const existingUser = await db.user.findUnique({ where: { id: userId } })
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const actor = typeof actorId === 'string'
      ? await db.user.findUnique({ where: { id: actorId }, select: { id: true, role: true, department: true } })
      : null
    if (!actor || !canManageUser(actor, existingUser)) {
      return NextResponse.json({ error: 'You do not have permission to update this profile.' }, { status: 403 })
    }
    if (typeof data.email === 'string' && data.email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
      return NextResponse.json({ error: 'Verify your new email address before saving it.' }, { status: 409 })
    }

    const promoteToAlumni = data.role === 'ALUMNI'
    const verificationChange = typeof data.isVerified === 'boolean' &&
      (existingUser.role === 'STUDENT' || existingUser.role === 'ALUMNI')
    const isDepartmentAdmin = actor.role === 'ADMIN' && (
      actor.department === 'Administration' ||
      (!!actor.department && getCanonicalDepartment(actor.department) === getCanonicalDepartment(existingUser.department))
    )
    if ((verificationChange || promoteToAlumni) && !isDepartmentAdmin) {
      return NextResponse.json({ error: "Only the main admin or the student's department admin can manage verification and alumni status." }, { status: 403 })
    }

    let graduationYear: number | undefined
    if (promoteToAlumni) {
      if (existingUser.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Only student accounts can be promoted to alumni.' }, { status: 400 })
      }
      if (!existingUser.isVerified) {
        return NextResponse.json({ error: 'Approve the student account before promoting it to alumni.' }, { status: 409 })
      }

      const year = Number(passoutYear)
      if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 10) {
        return NextResponse.json({ error: 'Enter a valid confirmed passout year.' }, { status: 400 })
      }

      graduationYear = year
    }
    const passoutBatch = graduationYear ? `${graduationYear - 1}-${graduationYear} passout batch` : undefined

    const user = await db.user.update({
      where: { id: userId },
      data: {
        role: promoteToAlumni ? 'ALUMNI' : undefined,
        name: data.name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        department: typeof data.department === 'string'
          ? getCanonicalDepartment(data.department)
          : data.department,
        batch: promoteToAlumni ? passoutBatch : data.batch,
        graduationYear: promoteToAlumni ? graduationYear : data.graduationYear,
        company: data.company,
        designation: data.designation,
        experience: data.experience,
        location: data.location,
        skills: data.skills,
        resumeUrl: data.resumeUrl,
        linkedinUrl: data.linkedinUrl,
        gpa: data.gpa,
        isVerified: data.isVerified,
        verificationStatus: (existingUser.role === 'STUDENT' || existingUser.role === 'ALUMNI') && typeof data.isVerified === 'boolean'
          ? data.isVerified ? 'APPROVED' : 'REJECTED'
          : undefined,
        avatar: data.avatar,
      },
    })

    if (typeof data.isVerified === 'boolean' && data.isVerified !== existingUser.isVerified && (user.role === 'STUDENT' || user.role === 'ALUMNI')) {
      if (isEmailConfigured()) {
        try {
          await sendAccountStatusEmail({ to: user.email, name: user.name, approved: data.isVerified })
        } catch (error) {
          console.error('Account status email error:', error)
        }
      } else {
        console.log(`Account ${data.isVerified ? 'approved' : 'rejected'} for ${user.email}`)
      }
    }

    return NextResponse.json({
      ...user,
      department: getCanonicalDepartment(user.department),
      verificationStatus: user.isVerified ? 'APPROVED' : user.verificationStatus,
      createdAt: user.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

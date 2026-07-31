import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, email, password, name, role, department, batch, graduationYear, company, designation, phone, skills } = body

    if (action === 'login') {
      // Demo login - accept any password for existing users, or create quick-access
      let user = await db.user.findUnique({ where: { email } })

      if (!user) {
        // Auto-create demo user for quick testing
        user = await db.user.create({
          data: {
            email,
            password: 'demo',
            name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            role: role || 'STUDENT',
            department: department || 'Information Technology',
            isVerified: true,
          },
        })
      }

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
        isOnline: true,
        createdAt: user.createdAt.toISOString(),
      })
    }

    if (action === 'signup') {
      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }

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
        },
      })

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isVerified: user.isVerified,
        isOnline: true,
        createdAt: user.createdAt.toISOString(),
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      },
    })

    return NextResponse.json({ ...user, createdAt: user.createdAt.toISOString() })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

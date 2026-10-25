import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Helper to generate a random hex string
function randomHex(length: number): string {
  const bytes = crypto.randomBytes(length / 2)
  return bytes.toString('hex')
}

function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null
}

// POST - Issue certificate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, title, type, description, issuedBy, issuedDate, expiresAt } = body

    if (!userId || !title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, type' },
        { status: 400 }
      )
    }
    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Certificate title cannot be empty' }, { status: 400 })
    }

    const issuedAt = issuedDate === undefined
      ? new Date()
      : parseDateOnly(issuedDate)
    if (!issuedAt) {
      return NextResponse.json({ error: 'Enter a valid issue date' }, { status: 400 })
    }

    const expiryDate = expiresAt === null || expiresAt === undefined || expiresAt === ''
      ? null
      : parseDateOnly(expiresAt)
    if (expiresAt !== null && expiresAt !== undefined && expiresAt !== '' && !expiryDate) {
      return NextResponse.json({ error: 'Enter a valid expiry date or choose Never' }, { status: 400 })
    }
    const expiryEnd = expiryDate
      ? new Date(expiryDate.getTime() + 24 * 60 * 60 * 1000 - 1)
      : null
    if (expiryEnd && expiryEnd < issuedAt) {
      return NextResponse.json({ error: 'Expiry date cannot be before the issue date' }, { status: 400 })
    }

    const validTypes = [
      'COMPLETION',
      'COURSE_COMPLETION',
      'EVENT_PARTICIPATION',
      'ACHIEVEMENT',
      'MENTORSHIP',
      'WORKSHOP',
      'INTERNSHIP',
      'PLACEMENT',
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate SHA-256 hash of certificate data
    const certData = JSON.stringify({
      userId,
      title,
      type,
      description,
      issuedBy,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiryEnd?.toISOString() || null,
      timestamp: Date.now(),
    })
    const certificateHash = crypto.createHash('sha256').update(certData).digest('hex')

    // Simulated blockchain transaction hash
    const txHash = '0x' + randomHex(64)

    const certificate = await db.$transaction(async (transaction) => {
      const createdCertificate = await transaction.certificate.create({
        data: {
          userId,
          title: title.trim(),
          type,
          description: description || `Certificate of ${type.toLowerCase()}`,
          certificateHash,
          txHash,
          issuedBy: issuedBy || null,
          issuedAt,
          expiresAt: expiryEnd,
        },
      })

      await transaction.notification.create({
        data: {
          userId,
          title: 'Certificate Issued',
          message: `Congratulations! You have been issued a certificate: ${title.trim()}`,
          type: 'CERTIFICATE',
          link: 'certificates',
        },
      })

      return createdCertificate
    })

    return NextResponse.json({
      ...certificate,
      issuedAt: certificate.issuedAt.toISOString(),
      createdAt: certificate.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Certificates POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List certificates, verify by hash, or verify by ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const hash = searchParams.get('hash')
    const id = searchParams.get('id')

    // Verify by hash
    if (hash) {
      const certificate = await db.certificate.findUnique({
        where: { certificateHash: hash },
        include: { user: { select: { name: true } } },
      })

      if (!certificate) {
        return NextResponse.json({ isValid: false, message: 'Certificate not found' })
      }

      return NextResponse.json({
        isValid: true,
        certificate: {
          ...certificate,
          userName: certificate.user.name,
          issuedAt: certificate.issuedAt.toISOString(),
          createdAt: certificate.createdAt.toISOString(),
        },
      })
    }

    // Verify by ID
    if (id) {
      const certificate = await db.certificate.findUnique({
        where: { id },
        include: { user: { select: { name: true } } },
      })

      if (!certificate) {
        return NextResponse.json(
          { error: 'Certificate not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        ...certificate,
        userName: certificate.user.name,
        issuedAt: certificate.issuedAt.toISOString(),
        createdAt: certificate.createdAt.toISOString(),
        isVerified: true,
      })
    }

    // List certificates by userId
    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId

    const certificates = await db.certificate.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      include: { user: { select: { name: true } } },
    })

    return NextResponse.json(
      certificates.map((c) => ({
        ...c,
        userName: c.user.name,
        issuedAt: c.issuedAt.toISOString(),
        createdAt: c.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Certificates GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

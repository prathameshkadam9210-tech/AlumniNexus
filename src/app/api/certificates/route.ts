import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Helper to generate a random hex string
function randomHex(length: number): string {
  const bytes = crypto.randomBytes(length / 2)
  return bytes.toString('hex')
}

// POST - Issue certificate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, title, type, description, issuedBy } = body

    if (!userId || !title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, type' },
        { status: 400 }
      )
    }

    const validTypes = ['COMPLETION', 'ACHIEVEMENT', 'MENTORSHIP', 'WORKSHOP', 'PLACEMENT']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate SHA-256 hash of certificate data
    const certData = JSON.stringify({ userId, title, type, description, issuedBy, timestamp: Date.now() })
    const certificateHash = crypto.createHash('sha256').update(certData).digest('hex')

    // Simulated blockchain transaction hash
    const txHash = '0x' + randomHex(64)

    const certificate = await db.certificate.create({
      data: {
        userId,
        title,
        type,
        description: description || `Certificate of ${type.toLowerCase()}`,
        certificateHash,
        txHash,
        issuedBy: issuedBy || null,
      },
    })

    // Notify user about new certificate
    await db.notification.create({
      data: {
        userId,
        title: 'Certificate Issued',
        message: `Congratulations! You have been issued a certificate: ${title}`,
        type: 'CERTIFICATE',
      },
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
      })

      if (!certificate) {
        return NextResponse.json({ isValid: false, message: 'Certificate not found' })
      }

      return NextResponse.json({
        isValid: true,
        certificate: {
          ...certificate,
          issuedAt: certificate.issuedAt.toISOString(),
          createdAt: certificate.createdAt.toISOString(),
        },
      })
    }

    // Verify by ID
    if (id) {
      const certificate = await db.certificate.findUnique({
        where: { id },
      })

      if (!certificate) {
        return NextResponse.json(
          { error: 'Certificate not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        ...certificate,
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
    })

    return NextResponse.json(
      certificates.map((c) => ({
        ...c,
        issuedAt: c.issuedAt.toISOString(),
        createdAt: c.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Certificates GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
